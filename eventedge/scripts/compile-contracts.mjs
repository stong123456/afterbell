import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";
import solc from "solc";

const projectRoot = process.cwd();
const contractName = "EventDecisionRegistry";
const sourceName = `${contractName}.sol`;
const sourcePath = path.join(projectRoot, "contracts", sourceName);
const source = fs.readFileSync(sourcePath, "utf8");

const input = {
  language: "Solidity",
  sources: {
    [sourceName]: { content: source },
  },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: "shanghai",
    metadata: { bytecodeHash: "ipfs" },
    outputSelection: {
      "*": {
        "*": [
          "abi",
          "storageLayout",
          "evm.bytecode.object",
          "evm.deployedBytecode.object",
          "evm.methodIdentifiers",
        ],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = (output.errors ?? []).filter((entry) => entry.severity === "error");
const warnings = (output.errors ?? []).filter((entry) => entry.severity === "warning");

if (errors.length > 0) {
  for (const error of errors) console.error(error.formattedMessage);
  process.exit(1);
}

if (warnings.length > 0) {
  for (const warning of warnings) console.error(warning.formattedMessage);
  process.exit(1);
}

const artifact = output.contracts[sourceName][contractName];
const artifactDirectory = path.join(projectRoot, "artifacts", "contracts");
fs.mkdirSync(artifactDirectory, { recursive: true });
fs.writeFileSync(
  path.join(artifactDirectory, `${contractName}.json`),
  JSON.stringify(
    {
      contractName,
      sourceName,
      abi: artifact.abi,
      bytecode: `0x${artifact.evm.bytecode.object}`,
      deployedBytecode: `0x${artifact.evm.deployedBytecode.object}`,
      compiler: solc.version(),
      evmVersion: input.settings.evmVersion,
      optimizer: input.settings.optimizer,
      sourceSha256: crypto.createHash("sha256").update(source).digest("hex"),
      methodIdentifiers: artifact.evm.methodIdentifiers,
      storageLayout: artifact.storageLayout,
    },
    null,
    2,
  ),
);

console.log(`Compiled ${contractName} with ${solc.version()}`);
