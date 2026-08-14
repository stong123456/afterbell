import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import { Interface, getCreate2Address, id, keccak256 } from 'ethers'

const artifact = JSON.parse(
  fs.readFileSync(new URL('../artifacts/contracts/EventDecisionRegistry.json', import.meta.url), 'utf8'),
)
const deployment = JSON.parse(
  fs.readFileSync(new URL('../deployments/xlayer-testnet.json', import.meta.url), 'utf8'),
)

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const runOnchainOs = (args) => {
  const executable = process.platform === 'win32' ? 'onchainos.exe' : 'onchainos'
  const result = spawnSync(executable, args, { encoding: 'utf8', windowsHide: true })
  if (result.error) throw new Error(`Onchain OS is unavailable: ${result.error.message}`)
  if (result.status !== 0) throw new Error(`Onchain OS ${args.slice(0, 2).join(' ')} failed`)
  const response = JSON.parse(result.stdout.trim())
  if (!response.ok) throw new Error(`Onchain OS ${args.slice(0, 2).join(' ')} rejected the request`)
  return response.data
}

assert(deployment.chainId === 1952, 'Deployment manifest is not X Layer Testnet')
assert(deployment.status === 'SUCCESS', 'Deployment manifest is not successful')
assert(artifact.compiler.startsWith('0.8.30+commit.73712a01'), 'Compiler build is not pinned')
assert(artifact.evmVersion === 'shanghai', 'EVM version is not pinned to Shanghai')

const initCodeHash = keccak256(artifact.bytecode)
const salt = id(deployment.deploymentSaltLabel)
const expectedAddress = getCreate2Address(deployment.deploymentFactory, salt, initCodeHash)
assert(expectedAddress === deployment.address, 'CREATE2 address does not match deployment manifest')
assert(initCodeHash === deployment.initCodeHash, 'Init-code hash does not match deployment manifest')

const source = fs.readFileSync(new URL('../contracts/EventDecisionRegistry.sol', import.meta.url))
const sourceSha256 = crypto.createHash('sha256').update(source).digest('hex')
const runtimeSha256 = crypto.createHash('sha256').update(artifact.deployedBytecode).digest('hex')
assert(sourceSha256 === deployment.sourceSha256, 'Source hash does not match deployment manifest')
assert(runtimeSha256 === deployment.runtimeBytecodeSha256, 'Runtime hash does not match deployment manifest')

const registryInterface = new Interface(artifact.abi)
const maxConfidenceData = registryInterface.encodeFunctionData('MAX_CONFIDENCE')
const missingReceiptData = registryInterface.encodeFunctionData('getReceipt', [`0x${'00'.repeat(32)}`])
const receiptNotFoundSelector = registryInterface.getError('ReceiptNotFound').selector

const successProbe = runOnchainOs([
  'gateway', 'simulate',
  '--chain', 'xlayer_test',
  '--from', deployment.deployer,
  '--to', deployment.address,
  '--amount', '0',
  '--data', maxConfidenceData,
])[0]
assert(successProbe.failReason === '', 'Deployed registry getter probe reverted')
assert(successProbe.risks?.length === 0, 'Gateway reported risk items for the getter probe')

const guardProbe = runOnchainOs([
  'gateway', 'simulate',
  '--chain', 'xlayer_test',
  '--from', deployment.deployer,
  '--to', deployment.address,
  '--amount', '0',
  '--data', missingReceiptData,
])[0]
assert(
  guardProbe.failReason?.toLowerCase().includes(receiptNotFoundSelector.slice(2).toLowerCase()),
  'Missing-receipt guard did not return the expected custom error',
)
assert(guardProbe.risks?.length === 0, 'Gateway reported risk items for the guard probe')

const history = runOnchainOs([
  'wallet', 'history',
  '--chain', 'xlayer_test',
  '--tx-hash', deployment.transactionHash,
])[0]
assert(history.chainIndex === '1952', 'Transaction history returned the wrong chain')
assert(history.txStatus === 'SUCCESS', 'Deployment transaction is not successful')
assert(history.txHash === deployment.transactionHash, 'Transaction hash mismatch')
assert(history.from.toLowerCase() === deployment.deployer.toLowerCase(), 'Deployer mismatch')
assert(history.to.toLowerCase() === deployment.deploymentFactory.toLowerCase(), 'Factory mismatch')

process.stdout.write(JSON.stringify({
  verdict: 'PASS',
  network: { name: deployment.network, chainId: deployment.chainId, gatewaySimulation: true },
  deployment: {
    address: deployment.address,
    transactionHash: deployment.transactionHash,
    status: history.txStatus,
    confirmations: Number(history.confirmedCount),
  },
  artifact: {
    compiler: artifact.compiler,
    evmVersion: artifact.evmVersion,
    sourceSha256,
    initCodeHash,
    runtimeSha256,
    create2AddressMatch: true,
  },
  probes: {
    getterExecution: 'PASS',
    receiptNotFoundGuard: 'PASS',
    riskItems: 0,
  },
}, null, 2))
