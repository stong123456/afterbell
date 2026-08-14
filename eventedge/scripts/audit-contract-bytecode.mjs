import crypto from 'node:crypto'
import fs from 'node:fs'

const artifactUrl = new URL('../artifacts/contracts/EventDecisionRegistry.json', import.meta.url)
const sourceUrl = new URL('../contracts/EventDecisionRegistry.sol', import.meta.url)
const artifact = JSON.parse(fs.readFileSync(artifactUrl, 'utf8'))
const source = fs.readFileSync(sourceUrl)

const fail = (message) => {
  throw new Error(message)
}

if (!artifact.compiler.startsWith('0.8.30+commit.73712a01')) fail('Unexpected compiler build')
if (artifact.evmVersion !== 'shanghai') fail('Unexpected EVM target')
if (artifact.sourceSha256 !== crypto.createHash('sha256').update(source).digest('hex')) {
  fail('Artifact source hash does not match the Solidity source')
}

const runtime = Buffer.from(artifact.deployedBytecode.slice(2), 'hex')
if (runtime.length === 0) fail('Runtime bytecode is empty')
if (runtime.length > 24_576) fail('Runtime bytecode exceeds the EIP-170 limit')
if (runtime.length < 2) fail('Runtime bytecode is malformed')

const metadataLength = runtime.readUInt16BE(runtime.length - 2)
const executableLength = runtime.length - metadataLength - 2
if (executableLength <= 0) fail('Runtime metadata length is malformed')
const executable = runtime.subarray(0, executableLength)

const forbiddenOpcodes = new Map([
  [0xf0, 'CREATE'],
  [0xf1, 'CALL'],
  [0xf2, 'CALLCODE'],
  [0xf4, 'DELEGATECALL'],
  [0xf5, 'CREATE2'],
  [0xfa, 'STATICCALL'],
  [0xff, 'SELFDESTRUCT'],
])

for (let offset = 0; offset < executable.length; offset += 1) {
  const opcode = executable[offset]
  if (forbiddenOpcodes.has(opcode)) {
    fail(`Forbidden opcode ${forbiddenOpcodes.get(opcode)} at executable offset ${offset}`)
  }
  if (opcode >= 0x60 && opcode <= 0x7f) offset += opcode - 0x5f
}

const selectors = Object.values(artifact.methodIdentifiers)
if (new Set(selectors).size !== selectors.length) fail('ABI contains a selector collision')
if (artifact.abi.some((entry) => entry.stateMutability === 'payable')) fail('ABI unexpectedly accepts value')
if (artifact.abi.some((entry) => entry.type === 'fallback' || entry.type === 'receive')) {
  fail('ABI unexpectedly exposes fallback or receive')
}

const bytecodeSha256 = crypto.createHash('sha256').update(artifact.bytecode).digest('hex')
const runtimeSha256 = crypto.createHash('sha256').update(artifact.deployedBytecode).digest('hex')
process.stdout.write(JSON.stringify({
  compiler: artifact.compiler,
  evmVersion: artifact.evmVersion,
  creationBytes: (artifact.bytecode.length - 2) / 2,
  runtimeBytes: runtime.length,
  executableBytes: executable.length,
  methodCount: selectors.length,
  forbiddenOpcodeCount: 0,
  bytecodeSha256,
  runtimeSha256,
}))
