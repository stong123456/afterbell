export const XLAYER_TESTNET = Object.freeze({
  chainId: 1952,
  chainIdHex: "0x7a0",
  name: "X Layer Testnet",
  nativeCurrency: Object.freeze({ name: "OKB", symbol: "OKB", decimals: 18 }),
  rpcUrl: "https://xlayertestrpc.okx.com/terigon",
  explorerUrl: "https://www.okx.com/web3/explorer/xlayer-test",
  registryAddress: "0x8EB68D8fc210e4dA44bb5f6248D102ff44Aa7647",
});

const REGISTRY_ABI = [
  "function approveDecision(bytes32 eventHash, bytes32 planHash, uint8 kind, uint16 confidence) returns (bytes32 receiptId)",
  "function receiptIdFor(address owner, bytes32 eventHash, bytes32 planHash, uint8 kind, uint16 confidence) view returns (bytes32)",
];

const DECISION_KIND = Object.freeze({ trade: 0, hedge: 1, wait: 2 });

export class XLayerWalletError extends Error {
  constructor(code, cause) {
    super(code, { cause });
    this.name = "XLayerWalletError";
    this.code = code;
  }
}

function canonicalDecisionPayload(eventCase, decision, plan) {
  return {
    schema: "askstone.decision-plan.v2",
    eventId: eventCase.event.id,
    decision,
    confidence: eventCase.confidence.score,
    allocation: plan.allocation,
    notionalCap: plan.notionalCap ?? "$100,000",
    maxLoss: plan.maxLoss,
    maxSlippage: plan.slippage ?? "0.18%",
    expiresAt: plan.expiresAt ?? null,
    invalidation: plan.invalidation ?? null,
  };
}

function canonicalEventPayload(eventCase) {
  return {
    schema: "askstone.event.v2",
    eventId: eventCase.event.id,
    generatedAt: eventCase.generatedAt ?? null,
    sources: eventCase.sources.map(({
      id,
      time,
      state,
      observedAt = null,
      name = null,
      headline = null,
      detail = null,
      sourceUrl = null,
    }) => ({ id, time, state, observedAt, name, headline, detail, sourceUrl })),
  };
}

export async function buildDecisionCommitments(eventCase, decision, plan) {
  if (!(decision in DECISION_KIND) || !plan) throw new XLayerWalletError("invalidDecision");
  const { keccak256, toUtf8Bytes } = await import("ethers");
  const eventHash = keccak256(toUtf8Bytes(JSON.stringify(canonicalEventPayload(eventCase))));
  const planHash = keccak256(
    toUtf8Bytes(JSON.stringify(canonicalDecisionPayload(eventCase, decision, plan))),
  );
  return { eventHash, planHash, kind: DECISION_KIND[decision] };
}

export async function ensureXLayerTestnet(ethereum = globalThis.window?.ethereum) {
  if (!ethereum?.request) throw new XLayerWalletError("walletMissing");

  try {
    const currentChainId = await ethereum.request({ method: "eth_chainId" });
    if (currentChainId?.toLowerCase() !== XLAYER_TESTNET.chainIdHex) {
      try {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: XLAYER_TESTNET.chainIdHex }],
        });
      } catch (error) {
        if (error?.code !== 4902) throw error;
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: XLAYER_TESTNET.chainIdHex,
            chainName: XLAYER_TESTNET.name,
            nativeCurrency: XLAYER_TESTNET.nativeCurrency,
            rpcUrls: [XLAYER_TESTNET.rpcUrl],
            blockExplorerUrls: [XLAYER_TESTNET.explorerUrl],
          }],
        });
      }
    }

    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    if (!accounts?.[0]) throw new XLayerWalletError("accountUnavailable");
    return accounts[0];
  } catch (error) {
    if (error instanceof XLayerWalletError) throw error;
    if (error?.code === 4001 || error?.code === "ACTION_REJECTED") {
      throw new XLayerWalletError("walletRejected", error);
    }
    throw new XLayerWalletError("networkSetupFailed", error);
  }
}

export async function recordDecisionOnXLayer({
  ethereum = globalThis.window?.ethereum,
  eventCase,
  decision,
  plan,
}) {
  const account = await ensureXLayerTestnet(ethereum);
  const [{ BrowserProvider, Contract }, commitments] = await Promise.all([
    import("ethers"),
    buildDecisionCommitments(eventCase, decision, plan),
  ]);

  try {
    const provider = new BrowserProvider(ethereum, XLAYER_TESTNET.chainId);
    const signer = await provider.getSigner(account);
    const registry = new Contract(XLAYER_TESTNET.registryAddress, REGISTRY_ABI, signer);
    const receiptId = await registry.receiptIdFor(
      account,
      commitments.eventHash,
      commitments.planHash,
      commitments.kind,
      eventCase.confidence.score,
    );
    const transaction = await registry.approveDecision(
      commitments.eventHash,
      commitments.planHash,
      commitments.kind,
      eventCase.confidence.score,
    );
    const mined = await transaction.wait(1);
    if (mined?.status !== 1) throw new XLayerWalletError("transactionFailed");

    return {
      ...commitments,
      account,
      receiptId,
      txHash: transaction.hash,
      explorerUrl: `${XLAYER_TESTNET.explorerUrl}/tx/${transaction.hash}`,
    };
  } catch (error) {
    if (error instanceof XLayerWalletError) throw error;
    if (error?.code === 4001 || error?.code === "ACTION_REJECTED") {
      throw new XLayerWalletError("walletRejected", error);
    }
    const details = `${error?.shortMessage ?? ""} ${error?.message ?? ""}`;
    if (details.includes("ReceiptAlreadyExists")) {
      throw new XLayerWalletError("duplicateReceipt", error);
    }
    throw new XLayerWalletError("transactionFailed", error);
  }
}

export function compactAddress(address) {
  return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "";
}
