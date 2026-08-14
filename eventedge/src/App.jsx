import { useEffect, useState } from "react";
import { AppRail } from "./components/AppRail.jsx";
import { DecisionInspector } from "./components/DecisionInspector.jsx";
import { ReasoningWorkspace } from "./components/ReasoningWorkspace.jsx";
import { ReviewSheet } from "./components/ReviewSheet.jsx";
import { SourceStream } from "./components/SourceStream.jsx";
import { decisionPlans, eventCase } from "./data/eventCase.js";
import {
  XLAYER_TESTNET,
  ensureXLayerTestnet,
  recordDecisionOnXLayer,
} from "./lib/xlayerTestnet.js";

const REPLAY_INTERVAL_MS = 360;

export function App() {
  const [decision, setDecision] = useState("hedge");
  const [walletAddress, setWalletAddress] = useState("");
  const [walletPhase, setWalletPhase] = useState("idle");
  const [walletError, setWalletError] = useState("");
  const [showProbabilities, setShowProbabilities] = useState(true);
  const [visibleSources, setVisibleSources] = useState(eventCase.sources.length);
  const [isReplaying, setIsReplaying] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [receipt, setReceipt] = useState(eventCase.receipt);
  const [receiptFocus, setReceiptFocus] = useState(false);

  useEffect(() => {
    if (!isReplaying) return undefined;

    if (visibleSources >= eventCase.sources.length) {
      setIsReplaying(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setVisibleSources((current) => current + 1);
    }, REPLAY_INTERVAL_MS);

    return () => window.clearTimeout(timer);
  }, [isReplaying, visibleSources]);

  useEffect(() => {
    const ethereum = window.ethereum;
    if (!ethereum?.on) return undefined;

    const handleAccountsChanged = (accounts) => setWalletAddress(accounts?.[0] ?? "");
    const handleChainChanged = (chainId) => {
      if (chainId?.toLowerCase() !== XLAYER_TESTNET.chainIdHex) setWalletAddress("");
    };
    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);
    return () => {
      ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
      ethereum.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  const startReplay = () => {
    setVisibleSources(1);
    setIsReplaying(true);
    setReceipt((current) => ({ ...current, status: "ready", txHash: null }));
  };

  const openReceipt = () => {
    setReceiptFocus(true);
    window.setTimeout(() => setReceiptFocus(false), 1400);
  };

  const connectWallet = async () => {
    setWalletPhase("connecting");
    setWalletError("");
    try {
      const address = await ensureXLayerTestnet();
      setWalletAddress(address);
      return address;
    } catch (error) {
      setWalletError(error?.code ?? "networkSetupFailed");
      return "";
    } finally {
      setWalletPhase("idle");
    }
  };

  const signDecision = async () => {
    setWalletPhase("recording");
    setWalletError("");
    try {
      const recorded = await recordDecisionOnXLayer({
        eventCase,
        decision,
        plan: decisionPlans[decision],
      });
      setWalletAddress(recorded.account);
      setReceipt({
        status: "recorded",
        eventHash: recorded.eventHash,
        planHash: recorded.planHash,
        receiptId: recorded.receiptId,
        txHash: recorded.txHash,
        explorerUrl: recorded.explorerUrl,
      });
      setReviewOpen(false);
      setReceiptFocus(true);
    } catch (error) {
      setWalletError(error?.code ?? "transactionFailed");
    } finally {
      setWalletPhase("idle");
    }
  };

  return (
    <main className="app-shell">
      <AppRail
        connected={Boolean(walletAddress)}
        walletAddress={walletAddress}
        onConnect={connectWallet}
        onRadar={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        onReceipts={openReceipt}
        onReplay={startReplay}
      />
      <SourceStream
        sources={eventCase.sources}
        visibleCount={visibleSources}
        replaying={isReplaying}
      />
      <ReasoningWorkspace
        event={eventCase}
        replaying={isReplaying}
        showProbabilities={showProbabilities}
        onReplay={startReplay}
        onToggleProbabilities={() => setShowProbabilities((current) => !current)}
      />
      <DecisionInspector
        decision={decision}
        receipt={receipt}
        receiptFocus={receiptFocus}
        onDecisionChange={setDecision}
        onReview={() => {
          setWalletError("");
          setReviewOpen(true);
        }}
      />
      <ReviewSheet
        connected={Boolean(walletAddress)}
        decision={decision}
        error={walletError}
        open={reviewOpen}
        phase={walletPhase}
        onClose={() => setReviewOpen(false)}
        onConnect={connectWallet}
        onSign={signDecision}
      />
    </main>
  );
}
