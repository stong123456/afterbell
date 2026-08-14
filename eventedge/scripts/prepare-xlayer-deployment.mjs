import fs from 'node:fs'
import { Interface, getCreate2Address, id, keccak256 } from 'ethers'

const from = process.env.DEPLOYER_ADDRESS
const factory = '0xce0042B868300000d44A59004Da54A005ffdcf9f'
const saltLabel = 'askstone.EventDecisionRegistry.v1'

if (!from || !/^0x[0-9a-fA-F]{40}$/.test(from)) {
  throw new Error('DEPLOYER_ADDRESS must be a valid EVM address')
}

const artifact = JSON.parse(
  fs.readFileSync(new URL('../artifacts/contracts/EventDecisionRegistry.json', import.meta.url), 'utf8'),
)

const salt = id(saltLabel)
const initCodeHash = keccak256(artifact.bytecode)
const expectedAddress = getCreate2Address(factory, salt, initCodeHash)
const factoryInterface = new Interface([{
    type: 'function',
    name: 'deploy',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_initCode', type: 'bytes' },
      { name: '_salt', type: 'bytes32' },
    ],
    outputs: [{ name: 'createdContract', type: 'address' }],
}])
const calldata = factoryInterface.encodeFunctionData('deploy', [artifact.bytecode, salt])

process.stdout.write(JSON.stringify({
  chainId: 1952,
  factory,
  saltLabel,
  salt,
  initCodeHash,
  expectedAddress,
  calldata,
}))
