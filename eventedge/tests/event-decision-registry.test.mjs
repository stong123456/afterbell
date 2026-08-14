import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import ganache from 'ganache'
import {
  AbiCoder,
  BrowserProvider,
  ContractFactory,
  ZeroAddress,
  ZeroHash,
  id,
  keccak256,
  randomBytes,
} from 'ethers'

const artifact = JSON.parse(
  fs.readFileSync(new URL('../artifacts/contracts/EventDecisionRegistry.json', import.meta.url), 'utf8'),
)
const receiptType =
  'AskstoneDecisionReceipt(uint256 chainId,address registry,address owner,bytes32 eventHash,bytes32 planHash,uint8 kind,uint16 confidence)'
const receiptTypehash = id(receiptType)
const abiCoder = AbiCoder.defaultAbiCoder()

async function fixture() {
  const eip1193 = ganache.provider({
    chain: { chainId: 1952, hardfork: 'shanghai' },
    logging: { quiet: true },
    wallet: { deterministic: true, totalAccounts: 3 },
  })
  const provider = new BrowserProvider(eip1193)
  const owner = await provider.getSigner(0)
  const stranger = await provider.getSigner(1)
  const factory = new ContractFactory(artifact.abi, artifact.bytecode, owner)
  const registry = await factory.deploy()
  await registry.waitForDeployment()
  return { eip1193, provider, owner, stranger, factory, registry }
}

async function close(eip1193) {
  if (typeof eip1193.disconnect === 'function') await eip1193.disconnect()
}

async function expectTxRevert(action) {
  await assert.rejects(async () => {
    const transaction = await action()
    await transaction.wait()
  })
}

function expectedReceiptId(chainId, registry, owner, eventHash, planHash, kind, confidence) {
  return keccak256(
    abiCoder.encode(
      ['bytes32', 'uint256', 'address', 'address', 'bytes32', 'bytes32', 'uint8', 'uint16'],
      [receiptTypehash, chainId, registry, owner, eventHash, planHash, kind, confidence],
    ),
  )
}

test('domain-separated receipt ID commits to every immutable decision field', async () => {
  const context = await fixture()
  try {
    const { owner, registry, factory } = context
    const ownerAddress = await owner.getAddress()
    const registryAddress = await registry.getAddress()
    const eventHash = id('event:cpi-2026-08')
    const planHash = id('plan:btc-rwa-hedge-v1')
    assert.equal(await registry.RECEIPT_TYPEHASH(), receiptTypehash)

    const onchain = await registry.receiptIdFor(ownerAddress, eventHash, planHash, 1, 87)
    const expected = expectedReceiptId(1952, registryAddress, ownerAddress, eventHash, planHash, 1, 87)
    assert.equal(onchain, expected)

    const secondRegistry = await factory.deploy()
    await secondRegistry.waitForDeployment()
    assert.notEqual(
      onchain,
      await secondRegistry.receiptIdFor(ownerAddress, eventHash, planHash, 1, 87),
    )
    assert.notEqual(onchain, await registry.receiptIdFor(ownerAddress, eventHash, planHash, 0, 87))
    assert.notEqual(onchain, await registry.receiptIdFor(ownerAddress, eventHash, planHash, 1, 86))
  } finally {
    await close(context.eip1193)
  }
})

test('approval persists a complete immutable receipt and emits an audit event', async () => {
  const context = await fixture()
  try {
    const { owner, registry } = context
    const ownerAddress = await owner.getAddress()
    const eventHash = id('event:fed-cut')
    const planHash = id('plan:gold-btc')
    const receiptId = await registry.receiptIdFor(ownerAddress, eventHash, planHash, 0, 67)
    const tx = await registry.approveDecision(eventHash, planHash, 0, 67)
    const mined = await tx.wait()
    assert.ok(mined.gasUsed < 200_000n)

    const receipt = await registry.getReceipt(receiptId)
    assert.equal(receipt.owner, ownerAddress)
    assert.equal(receipt.eventHash, eventHash)
    assert.equal(receipt.planHash, planHash)
    assert.equal(receipt.executionTxHash, ZeroHash)
    assert.ok(receipt.createdAt > 0n)
    assert.equal(receipt.finalizedAt, 0n)
    assert.ok(receipt.createdBlock > 0n)
    assert.equal(receipt.confidence, 67n)
    assert.equal(receipt.kind, 0n)
    assert.equal(receipt.status, 1n)

    const parsed = mined.logs.map((log) => registry.interface.parseLog(log)).filter(Boolean)
    assert.equal(parsed[0].name, 'DecisionApproved')
    assert.equal(parsed[0].args.receiptId, receiptId)
  } finally {
    await close(context.eip1193)
  }
})

test('rejects invalid owner, empty commitments, out-of-range confidence, and duplicates', async () => {
  const context = await fixture()
  try {
    const { owner, registry } = context
    const ownerAddress = await owner.getAddress()
    const eventHash = id('event:valid')
    const planHash = id('plan:valid')
    await assert.rejects(registry.receiptIdFor(ZeroAddress, eventHash, planHash, 0, 50))
    await assert.rejects(registry.receiptIdFor(ownerAddress, ZeroHash, planHash, 0, 50))
    await assert.rejects(registry.receiptIdFor(ownerAddress, eventHash, ZeroHash, 0, 50))
    await assert.rejects(registry.receiptIdFor(ownerAddress, eventHash, planHash, 0, 101))
    await expectTxRevert(() => registry.approveDecision(ZeroHash, planHash, 0, 50))
    await expectTxRevert(() => registry.approveDecision(eventHash, ZeroHash, 0, 50))
    await expectTxRevert(() => registry.approveDecision(eventHash, planHash, 0, 101))
    await (await registry.approveDecision(eventHash, planHash, 0, 50)).wait()
    await expectTxRevert(() => registry.approveDecision(eventHash, planHash, 0, 50))
  } finally {
    await close(context.eip1193)
  }
})

test('receipt ownership is isolated between users', async () => {
  const context = await fixture()
  try {
    const { owner, stranger, registry } = context
    const eventHash = id('event:owner-isolation')
    const planHash = id('plan:owner-isolation')
    const ownerReceiptId = await registry.receiptIdFor(
      await owner.getAddress(), eventHash, planHash, 1, 72,
    )
    const strangerReceiptId = await registry.receiptIdFor(
      await stranger.getAddress(), eventHash, planHash, 1, 72,
    )
    assert.notEqual(ownerReceiptId, strangerReceiptId)
    await (await registry.approveDecision(eventHash, planHash, 1, 72)).wait()
    await expectTxRevert(() => registry.connect(stranger).cancelDecision(ownerReceiptId))
    await expectTxRevert(() => (
      registry.connect(stranger).markExecuted(ownerReceiptId, id('tx:foreign'))
    ))
  } finally {
    await close(context.eip1193)
  }
})

test('approved receipt can execute exactly once with a nonzero execution hash', async () => {
  const context = await fixture()
  try {
    const { owner, registry } = context
    const eventHash = id('event:execute')
    const planHash = id('plan:execute')
    const receiptId = await registry.receiptIdFor(await owner.getAddress(), eventHash, planHash, 0, 91)
    await (await registry.approveDecision(eventHash, planHash, 0, 91)).wait()
    await expectTxRevert(() => registry.markExecuted(receiptId, ZeroHash))
    const executionTxHash = id('execution:xlayer:0x1234')
    const mined = await (await registry.markExecuted(receiptId, executionTxHash)).wait()
    assert.ok(mined.gasUsed < 100_000n)
    const receipt = await registry.getReceipt(receiptId)
    assert.equal(receipt.status, 2n)
    assert.equal(receipt.executionTxHash, executionTxHash)
    assert.ok(receipt.finalizedAt >= receipt.createdAt)
    await expectTxRevert(() => registry.markExecuted(receiptId, id('execution:second')))
    await expectTxRevert(() => registry.cancelDecision(receiptId))
  } finally {
    await close(context.eip1193)
  }
})

test('approved receipt can cancel exactly once and can never execute afterward', async () => {
  const context = await fixture()
  try {
    const { owner, registry } = context
    const eventHash = id('event:cancel')
    const planHash = id('plan:cancel')
    const receiptId = await registry.receiptIdFor(await owner.getAddress(), eventHash, planHash, 2, 40)
    await (await registry.approveDecision(eventHash, planHash, 2, 40)).wait()
    await (await registry.cancelDecision(receiptId)).wait()
    const receipt = await registry.getReceipt(receiptId)
    assert.equal(receipt.status, 3n)
    assert.equal(receipt.executionTxHash, ZeroHash)
    assert.ok(receipt.finalizedAt >= receipt.createdAt)
    await expectTxRevert(() => registry.cancelDecision(receiptId))
    await expectTxRevert(() => registry.markExecuted(receiptId, id('execution:after-cancel')))
  } finally {
    await close(context.eip1193)
  }
})

test('unknown receipts and accidental native-token transfers revert', async () => {
  const context = await fixture()
  try {
    const { owner, registry } = context
    await assert.rejects(registry.getReceipt(id('missing')))
    await expectTxRevert(() => registry.cancelDecision(id('missing')))
    await expectTxRevert(() => registry.markExecuted(id('missing'), id('execution:missing')))
    await expectTxRevert(async () => (
      owner.sendTransaction({ to: await registry.getAddress(), value: 1n })
    ))
  } finally {
    await close(context.eip1193)
  }
})

test('property check: 128 randomized valid decisions produce unique, reproducible IDs', async () => {
  const context = await fixture()
  try {
    const { owner, registry } = context
    const ownerAddress = await owner.getAddress()
    const registryAddress = await registry.getAddress()
    const observed = new Set()
    for (let index = 0; index < 128; index += 1) {
      const eventHash = keccak256(randomBytes(32))
      const planHash = keccak256(randomBytes(32))
      const kind = index % 3
      const confidence = index % 101
      const actual = await registry.receiptIdFor(
        ownerAddress, eventHash, planHash, kind, confidence,
      )
      const expected = expectedReceiptId(
        1952, registryAddress, ownerAddress, eventHash, planHash, kind, confidence,
      )
      assert.equal(actual, expected)
      assert.equal(observed.has(actual), false)
      observed.add(actual)
    }
  } finally {
    await close(context.eip1193)
  }
})
