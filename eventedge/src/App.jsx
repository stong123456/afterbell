import { useCallback, useEffect, useRef, useState } from "react";
import { AppRail } from "./components/AppRail.jsx";
import { DecisionInspector } from "./components/DecisionInspector.jsx";
import { ReasoningWorkspace } from "./components/ReasoningWorkspace.jsx";
import { ReviewSheet } from "./components/ReviewSheet.jsx";
import { SourceStream } from "./components/SourceStream.jsx";
import { decisionPlans, eventCase } from "./data/eventCase.js";
import {
  fetchLiveSnapshot,
  fetchReceiptHistory,
  subscribeToLiveSnapshots,
  syncDecisionReceipt,
} from "./lib/liveData.js";
import {
  XLAYER_TESTNET,
  ensureXLayerTestnet,
  recordDecisionOnXLayer,
} from "./lib/xlayerTestnet.js";

const REPLAY_INTERVAL_MS = 480;

export function App() {
  const [mode, setMode] = useState("live");
  const [activeCase, setActiveCase] = useState(eventCase);
  const [decision, setDecision] = useState("hedge");
  const [walletAddress, setWalletAddress] = useState("");
  const [walletPhase, setWalletPhase] = useState("idle");
  const [walletError, setWalletError] = useState("");
  const [showProbabilities, setShowProbabilities] = useState(true);
  const [visibleSources, setVisibleSources] = useState(eventCase.sources.length);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [receipt, setReceipt] = useState(eventCase.receipt);
  const [receiptHistory, setReceiptHistory] = useState([]);
  const [receiptFocus, setReceiptFocus] = useState(false);
  const [livePhase, setLivePhase] = useState("loading");
  const [liveError, setLiveError] = useState("");
  const currentEventIdRef = useRef(eventCase.event.id);

  const activePlans = activeCase.plans ?? decisionPlans;
  const selectedPlan = activePlans[decision] ?? decisionPlans[decision];

  const applyLiveSnapshot = useCallback((snapshot) => {
    const eventChanged = currentEventIdRef.current !== snapshot.event.id;
    currentEventIdRef.current = snapshot.event.id;
    setActiveCase(snapshot);
    setVisibleSources(snapshot.sources.length);
    setLivePhase("connected");
    setLiveError("");
    if (eventChanged) setDecision(snapshot.recommendedDecision);
    setReceipt((current) => (
      current.status === "recorded" && current.eventId === snapshot.event.id
        ? current
        : { ...snapshot.receipt, eventId: snapshot.event.id }
    ));
  }, []);

  const loadReceiptHistory = useCallback(async (owner) => {
    if (!owner) {
      setReceiptHistory([]);
      return;
    }
    try {
      setReceiptHistory(await fetchReceiptHistory(owner));
    } catch {
      setReceiptHistory([]);
    }
  }, []);

  useEffect(() => {
    if (mode !== "live") return undefined;
    const controller = new AbortController();
    let disposed = false;
    setLivePhase("loading");

    fetchLiveSnapshot({ signal: controller.signal })
      .then((snapshot) => {
        if (!disposed) applyLiveSnapshot(snapshot);
      })
      .catch((error) => {
        if (disposed || error?.name === "AbortError") return;
        setLivePhase("degraded");
        setLiveError(error?.message ?? "live_unavailable");
        setMode("replay");
        setActiveCase(eventCase);
        currentEventIdRef.current = eventCase.event.id;
        setVisibleSources(eventCase.sources.length);
      });

    const unsubscribe = subscribeToLiveSnapshots({
      onSnapshot: (snapshot) => {
        if (!disposed) applyLiveSnapshot(snapshot);
      },
      onError: () => {
        if (!disposed) setLivePhase((current) => current === "loading" ? "degraded" : "reconnecting");
      },
    });

    return () => {
      disposed = true;
      controller.abort();
      unsubscribe();
    };
  }, [applyLiveSnapshot, mode]);

  useEffect(() => {
    if (mode !== "replay" || !isReplaying) return undefined;
    if (visibleSources >= eventCase.sources.length) {
      setIsReplaying(false);
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setVisibleSources((current) => current + 1);
    }, REPLAY_INTERVAL_MS / replaySpeed);
    return () => window.clearTimeout(timer);
  }, [isReplaying, mode, replaySpeed, visibleSources]);

  useEffect(() => {
    const ethereum = window.ethereum;
    if (!ethereum?.on) return undefined;

    const handleAccountsChanged = (accounts) => {
      const address = accounts?.[0] ?? "";
      setWalletAddress(address);
      void loadReceiptHistory(address);
    };
    const handleChainChanged = (chainId) => {
      if (chainId?.toLowerCase() !== XLAYER_TESTNET.chainIdHex) {
        setWalletAddress("");
        setReceiptHistory([]);
      }
    };
    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);
    return () => {
      ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
      ethereum.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [loadReceiptHistory]);

  const startReplay = () => {
    setMode("replay");
    setActiveCase(eventCase);
    currentEventIdRef.current = eventCase.event.id;
    setVisibleSources(1);
    setIsReplaying(true);
    setLiveError("");
    setReceipt({ ...eventCase.receipt, eventId: eventCase.event.id });
    setDecision("hedge");
  };

  const switchMode = (nextMode) => {
    if (nextMode === "replay") {
      startReplay();
      return;
    }
    setMode("live");
    setIsReplaying(false);
  };

  const refreshLive = async () => {
    setLivePhase("refreshing");
    setLiveError("");
    try {
      applyLiveSnapshot(await fetchLiveSnapshot({ refresh: true }));
    } catch (error) {
      setLivePhase("degraded");
      setLiveError(error?.message ?? "live_unavailable");
    }
  };

  const openReceipt = () => {
    setReceiptFocus(true);
    window.setTimeout(() => setReceiptFocus(false), 1400);
    void loadReceiptHistory(walletAddress);
  };

  const connectWallet = async () => {
    setWalletPhase("connecting");
    setWalletError("");
    try {
      const address = await ensureXLayerTestnet();
      setWalletAddress(address);
      void loadReceiptHistory(address);
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
      const executablePlan = {
        ...selectedPlan,
        expiresAt: new Date(
          Date.now() + (selectedPlan.expiresInMinutes ?? 120) * 60_000,
        ).toISOString(),
        invalidation: selectedPlan.invalidation ?? "critical_source_stale_or_market_confirmation_reversed",
      };
      const recorded = await recordDecisionOnXLayer({
        eventCase: activeCase,
        decision,
        plan: executablePlan,
      });
      setWalletAddress(recorded.account);
      setReceipt({
        status: "recorded",
        eventId: activeCase.event.id,
        eventHash: recorded.eventHash,
        planHash: recorded.planHash,
        receiptId: recorded.receiptId,
        txHash: recorded.txHash,
        explorerUrl: recorded.explorerUrl,
      });
      setReviewOpen(false);
      setReceiptFocus(true);
      try {
        await syncDecisionReceipt({
          owner: recorded.account,
          receiptId: recorded.receiptId,
          eventHash: recorded.eventHash,
          planHash: recorded.planHash,
          txHash: recorded.txHash,
          decision,
          chainId: XLAYER_TESTNET.chainId,
        });
        await loadReceiptHistory(recorded.account);
      } catch {
        // The onchain receipt remains authoritative if the optional index sync is unavailable.
      }
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
        connecting={walletPhase === "connecting"}
        walletAddress={walletAddress}
        onConnect={connectWallet}
        onRadar={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        onReceipts={openReceipt}
        onReplay={startReplay}
      />
      <SourceStream
        liveError={liveError}
        livePhase={livePhase}
        mode={mode}
        onModeChange={switchMode}
        replaying={isReplaying}
        sources={activeCase.sources}
        totalCount={activeCase.sources.length}
        visibleCount={mode === "live" ? activeCase.sources.length : visibleSources}
      />
      <ReasoningWorkspace
        event={activeCase}
        livePhase={livePhase}
        mode={mode}
        onRefresh={refreshLive}
        onReplay={startReplay}
        onReplaySpeedChange={() => setReplaySpeed((current) => (current === 1 ? 2 : current === 2 ? 0.5 : 1))}
        onToggleProbabilities={() => setShowProbabilities((current) => !current)}
        replaying={isReplaying}
        replaySpeed={replaySpeed}
        showProbabilities={showProbabilities}
      />
      <DecisionInspector
        decision={decision}
        plans={activePlans}
        receipt={receipt}
        receiptFocus={receiptFocus}
        receiptHistory={receiptHistory}
        recommendedDecision={activeCase.recommendedDecision ?? "hedge"}
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
        plan={selectedPlan}
        onClose={() => setReviewOpen(false)}
        onConnect={connectWallet}
        onSign={signDecision}
      />
    </main>
  );
}
