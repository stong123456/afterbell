import { CaretDown } from "@phosphor-icons/react/CaretDown";
import { CheckCircle } from "@phosphor-icons/react/CheckCircle";
import { Coins } from "@phosphor-icons/react/Coins";
import { Copy } from "@phosphor-icons/react/Copy";
import { Info } from "@phosphor-icons/react/Info";
import { LockSimple } from "@phosphor-icons/react/LockSimple";
import { XLogo } from "@phosphor-icons/react/XLogo";
import { decisionPlans } from "../data/eventCase.js";
import { useI18n } from "../i18n/I18nProvider.jsx";

const assetLabels = {
  gold: "Au",
  btc: "₿",
  eth: "Ξ",
  cash: "$",
};

const compactHash = (value) => (
  value?.length > 18 ? `${value.slice(0, 10)}…${value.slice(-6)}` : value
);

export function DecisionInspector({ decision, receipt, receiptFocus, onDecisionChange, onReview }) {
  const plan = decisionPlans[decision];
  const { t } = useI18n();

  return (
    <aside className={`decision-inspector ${receiptFocus ? "receipt-focused" : ""}`}>
      <header>
        <span>{t("decision.title")} <Info size={15} /></span>
        <span>↗</span>
      </header>

      <section className="decision-block">
        <h2>{t("decision.section")}</h2>
        <div className="decision-tabs" role="tablist" aria-label={t("decision.modeLabel")}>
          {["trade", "hedge", "wait"].map((value) => (
            <button
              aria-selected={decision === value}
              className={decision === value ? "is-selected" : ""}
              key={value}
              onClick={() => onDecisionChange(value)}
              role="tab"
              type="button"
            >
              {t(`decision.${value}`)}
            </button>
          ))}
        </div>
      </section>

      <section className="rationale">
        <h2>{t("decision.rationale")}</h2>
        <p>{t(`decision.rationales.${decision}`)}</p>
      </section>

      <section className="allocation">
        <h2>{t("decision.suggestedAllocation")}</h2>
        <div className="allocation-list">
          {plan.allocation.map(([kind, percent, amount]) => (
            <div className="allocation-row" key={kind}>
              <span className={`asset-icon is-${kind}`}>{assetLabels[kind]}</span>
              <strong>{t(`decision.assets.${kind}`)}</strong>
              <b>{percent}</b>
              <span>{amount}</span>
            </div>
          ))}
        </div>
        <div className="total-row"><span>{t("decision.totalNotional")}</span><strong>$100,000</strong></div>
      </section>

      <dl className="risk-list">
        <div><dt>{t("decision.maxLoss")}</dt><dd>{plan.maxLoss}</dd></div>
        <div><dt>{t("decision.estimatedSlippage")} <Info size={14} /></dt><dd>0.18%</dd></div>
        <div><dt>{t("decision.timeInForce")}</dt><dd>{t("decision.goodFor")}</dd></div>
        <div className="invalidation"><dt>{t("decision.invalidation")}</dt><dd>{t("decision.invalidationCopy")}</dd></div>
      </dl>

      <button className="review-button" type="button" onClick={onReview}>
        {t("decision.reviewSign")}
      </button>
      <div className="trust-copy">
        <LockSimple size={20} />
        <span>{t("decision.trustPrimary")}<small>{t("decision.trustSecondary")}</small></span>
      </div>

      <section className="receipt-preview">
        <header>
          <span>{t("receipt.title")} <Info size={14} /></span>
          <CaretDown size={15} />
        </header>
        <div className="receipt-status"><i /> {t(`receipt.statuses.${receipt.status}`)}</div>
        <dl>
          <div><dt>{t("receipt.eventHash")}</dt><dd title={receipt.eventHash}>{compactHash(receipt.eventHash)} <Copy size={14} /></dd></div>
          <div><dt>{t("receipt.planHash")}</dt><dd title={receipt.planHash}>{compactHash(receipt.planHash)} <Copy size={14} /></dd></div>
          <div><dt>{t("receipt.network")}</dt><dd><XLogo size={14} /> {t("receipt.networkValue")}</dd></div>
          <div><dt>{t("receipt.feeSponsor")}</dt><dd>{t("receipt.sponsorValue")}</dd></div>
          {receipt.txHash ? <div><dt>{t("receipt.txHash")}</dt><dd title={receipt.txHash}>{compactHash(receipt.txHash)} <Copy size={14} /></dd></div> : null}
        </dl>
      </section>
      <Coins className="inspector-watermark" size={110} weight="thin" aria-hidden="true" />
    </aside>
  );
}
