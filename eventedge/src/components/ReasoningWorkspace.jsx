import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { Bank } from "@phosphor-icons/react/Bank";
import { CaretDown } from "@phosphor-icons/react/CaretDown";
import { CheckCircle } from "@phosphor-icons/react/CheckCircle";
import { Clock } from "@phosphor-icons/react/Clock";
import { Copy } from "@phosphor-icons/react/Copy";
import { FileText } from "@phosphor-icons/react/FileText";
import { GlobeHemisphereWest } from "@phosphor-icons/react/GlobeHemisphereWest";
import { Info } from "@phosphor-icons/react/Info";
import { Play } from "@phosphor-icons/react/Play";
import { Pulse } from "@phosphor-icons/react/Pulse";
import { WarningCircle } from "@phosphor-icons/react/WarningCircle";
import { useState } from "react";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { ConfidencePanel } from "./ConfidencePanel.jsx";

const evidenceIcons = [Bank, GlobeHemisphereWest, GlobeHemisphereWest, FileText];

function ReasoningNode({ node }) {
  const [expanded, setExpanded] = useState(true);
  const { t } = useI18n();

  return (
    <article className="reasoning-node">
      <CheckCircle className="node-check" size={21} weight="fill" />
      <div className="node-core">
        <strong>{t(`reasoning.nodes.${node.id}.title`)}</strong>
        <span>{t(`reasoning.nodes.${node.id}.subtitle`)}</span>
        <b>{t(`reasoning.nodes.${node.id}.value`)}</b>
        <small>{t(`reasoning.nodes.${node.id}.delta`)}</small>
      </div>
      <button className="evidence-toggle" type="button" onClick={() => setExpanded((current) => !current)}>
        <span>{t("reasoning.evidence")} ({node.evidence.length})</span>
        <CaretDown className={expanded ? "is-open" : ""} size={14} />
      </button>
      {expanded ? (
        <div className="node-evidence">
          {node.evidence.map((source, index) => {
            const EvidenceIcon = evidenceIcons[index % evidenceIcons.length];
            return (
              <div key={source}>
                <EvidenceIcon size={18} />
                <span>{t(`reasoning.evidenceItems.${source}`)}<small>08:30:{String(index * 4).padStart(2, "0")}</small></span>
              </div>
            );
          })}
        </div>
      ) : null}
      <div className="data-hash">
        <span>{t("reasoning.dataHash")}<strong>{node.hash}</strong></span>
        <Copy size={15} />
      </div>
    </article>
  );
}

function ImpactNode({ impact, showProbabilities }) {
  const { t } = useI18n();

  return (
    <article className="impact-node">
      <CheckCircle className="impact-check" size={18} weight="fill" />
      {showProbabilities ? <div className="impact-score"><strong>{impact.score}</strong><span>{t("reasoning.moderate")}</span></div> : null}
      <div>
        <strong>{t(`reasoning.impacts.${impact.id}`)}</strong>
        <small>({impact.symbol})</small>
      </div>
      <span>↑ {t("reasoning.supportive")}</span>
      <p>{t("reasoning.netInflow")}<br />{impact.flow}</p>
      <button type="button">{t("reasoning.evidence")} (1)<CaretDown size={13} /></button>
    </article>
  );
}

export function ReasoningWorkspace({ event, replaying, showProbabilities, onReplay, onToggleProbabilities }) {
  const [interpretationOpen, setInterpretationOpen] = useState(false);
  const { t } = useI18n();

  return (
    <section className="reasoning-workspace">
      <header className="event-header">
        <div className="event-copy">
          <h1>{t("event.title")}</h1>
          <time>{t("event.timestamp")}</time>
          <p>{t("event.summary")}</p>
          <button type="button" onClick={() => setInterpretationOpen((current) => !current)}>
            {interpretationOpen ? t("event.hideInterpretation") : t("event.viewInterpretation")}
            <CaretDown className={interpretationOpen ? "is-open" : ""} size={15} />
          </button>
          {interpretationOpen ? (
            <div className="interpretation-note">
              {t("event.interpretation")}
            </div>
          ) : null}
        </div>
        <div className="event-tools">
          <button className={replaying ? "is-active" : ""} type="button" onClick={onReplay}>
            {replaying ? <Clock size={16} /> : <Play size={16} weight="fill" />}
            {replaying ? t("event.replaying") : t("event.replay")}
          </button>
          <button type="button">1x <CaretDown size={13} /></button>
        </div>
        <ConfidencePanel confidence={event.confidence} />
      </header>

      <section className="map-section" aria-label={t("reasoning.label")}>
        <div className="map-heading">
          <span>{t("reasoning.title")} <Info size={15} /></span>
          <label>
            {t("reasoning.showProbabilities")}
            <input checked={showProbabilities} onChange={onToggleProbabilities} type="checkbox" />
            <i />
          </label>
        </div>

        <div className="reasoning-map">
          <div className="reasoning-chain">
            {event.reasoning.map((node, index) => (
              <div className="reasoning-step" key={node.id}>
                <ReasoningNode node={node} />
                {index < event.reasoning.length - 1 ? (
                  <div className="reasoning-arrow" aria-hidden="true">
                    <span>{showProbabilities ? node.strength : ""}</span>
                    <ArrowRight size={24} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="impact-branch" aria-label={t("reasoning.impactedAssets")}>
            <div className="branch-lines" aria-hidden="true">
              <i /><i /><i />
            </div>
            {event.impacts.map((impact) => (
              <ImpactNode impact={impact} key={impact.symbol} showProbabilities={showProbabilities} />
            ))}
          </div>
        </div>

        <footer className="map-footer">
          <div>
            <span><CheckCircle size={18} /> {t("reasoning.supports")}</span>
            <span><WarningCircle size={18} /> {t("reasoning.contradicts")}</span>
            <span><Pulse size={18} /> {t("reasoning.mixedNeutral")}</span>
          </div>
          <div>
            <span>{t("reasoning.model")} <Info size={15} /></span>
            <span>{t("reasoning.lastUpdated")} <i /></span>
          </div>
        </footer>
      </section>
    </section>
  );
}
