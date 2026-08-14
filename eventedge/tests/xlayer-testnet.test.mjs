import assert from 'node:assert/strict'
import test from 'node:test'
import { decisionPlans, eventCase } from '../src/data/eventCase.js'
import {
  XLAYER_TESTNET,
  XLayerWalletError,
  buildDecisionCommitments,
  compactAddress,
  ensureXLayerTestnet,
} from '../src/lib/xlayerTestnet.js'

const account = '0xdbf3151ccdbcd23432f7906b5d6111e66755026d'

test('uses the deployed X Layer testnet registry and canonical chain id', () => {
  assert.equal(XLAYER_TESTNET.chainId, 1952)
  assert.equal(XLAYER_TESTNET.chainIdHex, '0x7a0')
  assert.equal(XLAYER_TESTNET.registryAddress, '0x8EB68D8fc210e4dA44bb5f6248D102ff44Aa7647')
})

test('decision commitments are deterministic and bind the selected plan', async () => {
  const first = await buildDecisionCommitments(eventCase, 'hedge', decisionPlans.hedge)
  const second = await buildDecisionCommitments(eventCase, 'hedge', decisionPlans.hedge)
  const trade = await buildDecisionCommitments(eventCase, 'trade', decisionPlans.trade)
  assert.deepEqual(first, second)
  assert.match(first.eventHash, /^0x[0-9a-f]{64}$/)
  assert.match(first.planHash, /^0x[0-9a-f]{64}$/)
  assert.equal(first.kind, 1)
  assert.notEqual(first.planHash, trade.planHash)
})

test('connects directly when the wallet is already on X Layer testnet', async () => {
  const methods = []
  const ethereum = {
    request: async ({ method }) => {
      methods.push(method)
      if (method === 'eth_chainId') return '0x7A0'
      if (method === 'eth_requestAccounts') return [account]
      throw new Error(`Unexpected method ${method}`)
    },
  }
  assert.equal(await ensureXLayerTestnet(ethereum), account)
  assert.deepEqual(methods, ['eth_chainId', 'eth_requestAccounts'])
})

test('switches to X Layer testnet before requesting an account', async () => {
  const methods = []
  const ethereum = {
    request: async ({ method, params }) => {
      methods.push(method)
      if (method === 'eth_chainId') return '0x1'
      if (method === 'wallet_switchEthereumChain') {
        assert.equal(params[0].chainId, '0x7a0')
        return null
      }
      if (method === 'eth_requestAccounts') return [account]
      throw new Error(`Unexpected method ${method}`)
    },
  }
  assert.equal(await ensureXLayerTestnet(ethereum), account)
  assert.deepEqual(methods, ['eth_chainId', 'wallet_switchEthereumChain', 'eth_requestAccounts'])
})

test('adds X Layer testnet when the wallet does not know chain 1952', async () => {
  const methods = []
  const ethereum = {
    request: async ({ method, params }) => {
      methods.push(method)
      if (method === 'eth_chainId') return '0x1'
      if (method === 'wallet_switchEthereumChain') throw Object.assign(new Error('unknown chain'), { code: 4902 })
      if (method === 'wallet_addEthereumChain') {
        assert.equal(params[0].chainId, '0x7a0')
        assert.equal(params[0].rpcUrls[0], XLAYER_TESTNET.rpcUrl)
        return null
      }
      if (method === 'eth_requestAccounts') return [account]
      throw new Error(`Unexpected method ${method}`)
    },
  }
  assert.equal(await ensureXLayerTestnet(ethereum), account)
  assert.deepEqual(methods, [
    'eth_chainId',
    'wallet_switchEthereumChain',
    'wallet_addEthereumChain',
    'eth_requestAccounts',
  ])
})

test('fails closed for missing wallets and user rejection', async () => {
  await assert.rejects(
    ensureXLayerTestnet(undefined),
    (error) => error instanceof XLayerWalletError && error.code === 'walletMissing',
  )
  const rejectingWallet = {
    request: async ({ method }) => {
      if (method === 'eth_chainId') return '0x1'
      throw Object.assign(new Error('rejected'), { code: 4001 })
    },
  }
  await assert.rejects(
    ensureXLayerTestnet(rejectingWallet),
    (error) => error instanceof XLayerWalletError && error.code === 'walletRejected',
  )
})

test('compacts wallet addresses without changing the underlying value', () => {
  assert.equal(compactAddress(account), '0xdbf3…026d')
  assert.equal(compactAddress(''), '')
})
