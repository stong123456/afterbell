export const eventCase = {
  event: {
    id: "evt_us_cpi_2026_08_14",
  },
  sources: [
    {
      id: "bls",
      time: "08:30:00",
      freshSeconds: 2,
      state: "confirmed",
      isNew: true,
    },
    {
      id: "cme",
      time: "08:30:07",
      freshSeconds: 9,
      state: "confirmed",
    },
    {
      id: "reuters",
      time: "08:30:12",
      freshSeconds: 14,
      state: "confirmed",
    },
    {
      id: "us2y",
      time: "08:30:18",
      freshSeconds: 20,
      state: "confirmed",
    },
    {
      id: "us10y",
      time: "08:30:21",
      freshSeconds: 23,
      state: "confirmed",
    },
    {
      id: "paxg",
      time: "08:30:25",
      freshSeconds: 27,
      state: "mixed",
    },
    {
      id: "xbtc",
      time: "08:30:27",
      freshSeconds: 29,
      state: "mixed",
    },
    {
      id: "xeth",
      time: "08:30:30",
      freshSeconds: 32,
      state: "mixed",
    },
    {
      id: "dxy",
      time: "08:30:33",
      freshSeconds: 35,
      state: "confirmed",
    },
    {
      id: "wti",
      time: "08:30:35",
      freshSeconds: 37,
      state: "neutral",
    },
  ],
  confidence: {
    score: 78,
    factors: [
      ["eventCertainty", "24 / 25"],
      ["probabilityRepricing", "16 / 20"],
      ["newsConsensus", "12 / 15"],
      ["priceConfirmation", "17 / 20"],
      ["onchainFlows", "7 / 10"],
      ["conflictPenalty", "-2"],
    ],
  },
  reasoning: [
    {
      id: "cpi",
      strength: "0.86",
      evidence: ["blsRelease", "reutersNews", "cmeFedWatch", "blsTableA"],
      hash: "b3f1…9c7a",
    },
    {
      id: "rates",
      strength: "0.74",
      evidence: ["cmeFedWatch", "sofrCurve"],
      hash: "9a2d…7e11",
    },
    {
      id: "yields",
      strength: "",
      evidence: ["tvc2y", "tvc10y"],
      hash: "a1c9…d4b2",
    },
  ],
  impacts: [
    { id: "gold", symbol: "PAXG", score: "0.71", flow: "+1,245 PAXG" },
    { id: "xbtc", symbol: "xBTC", score: "0.68", flow: "+18.6 xBTC" },
    { id: "xeth", symbol: "xETH", score: "0.64", flow: "+2,104 xETH" },
  ],
  receipt: {
    status: "ready",
    eventHash: "0x8f1c…7a9e",
    planHash: "0x3b7e…c2d1",
    txHash: null,
  },
};

export const decisionPlans = {
  trade: {
    allocation: [
      ["gold", "35%", "$35,000"],
      ["btc", "40%", "$40,000"],
      ["eth", "20%", "$20,000"],
      ["cash", "5%", "$5,000"],
    ],
    maxLoss: "-$6,000 (6.0%)",
  },
  hedge: {
    allocation: [
      ["gold", "40%", "$40,000"],
      ["btc", "35%", "$35,000"],
      ["eth", "15%", "$15,000"],
      ["cash", "10%", "$10,000"],
    ],
    maxLoss: "-$5,000 (5.0%)",
  },
  wait: {
    allocation: [
      ["cash", "100%", "$100,000"],
    ],
    maxLoss: "$0 (0.0%)",
  },
};
