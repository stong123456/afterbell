import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { ArrowsClockwise } from "@phosphor-icons/react/ArrowsClockwise";
import { Bank } from "@phosphor-icons/react/Bank";
import { CaretDown } from "@phosphor-icons/react/CaretDown";
import { CheckCircle } from "@phosphor-icons/react/CheckCircle";
import { Clock } from "@phosphor-icons/react/Clock";
import { FileText } from "@phosphor-icons/react/FileText";
import { GlobeHemisphereWest } from "@phosphor-icons/react/GlobeHemisphereWest";
import { Info } from "@phosphor-icons/react/Info";
import { Play } from "@phosphor-icons/react/Play";
import { Pulse } from "@phosphor-icons/react/Pulse";
import { WarningCircle } from "@phosphor-icons/react/WarningCircle";
import { useState } from "react";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { localized } from "../lib/liveData.js";
import { ConfidencePanel } from "./ConfidencePanel.jsx";
import { CopyButton } from "./CopyButton.jsx";

const evidenceIcons = [Bank, GlobeHemisphereWest, GlobeHemisphereWest, FileText];

function ReasoningNode({ node, sourceMap }) {
  const [expanded, setExpanded] = useState(true);
  const { locale, t } = useI18n();
  const title = localized(node.title, locale, t("reasoning.nodes." + node.id + ".title"));
  const subtitle = localized(node.subtitle, locale, t("reasoning.nodes." + node.id + ".subtitle"));
  const value = localized(node.value, locale, t("reasoning.nodes." + node.id + ".value"));
  const delta = localized(node.delta, locale, t("reasoning.nodes." + node.id + ".delta"));

  return (
    <article className="reasoning-node">
      <CheckCircle className="node-check" size={21} weight="fill" />
      <div className="node-core">
        <strong>{title}</strong>
        <span>{subtitle}</span>
        <b>{value}</b>
        <small>{delta}</small>
      </div>
      <button
        aria-expanded={expanded}
        className="evidence-toggle"
        type="button"
        onClick={() => setExpanded((current) => !current)}
      >
        <span>{t("reasoning.evidence")} ({node.evidence.length})</span>
        <CaretDown className={expanded ? "is-open" : ""} size={14} />
      </button>
      {expanded ? (
        <div className="node-evidence">
          {node.evidence.map((sourceId, index) => {
            const EvidenceIcon = evidenceIcons[index % evidenceIcons.length];
            const source = sourceMap.get(sourceId);
            const label = localized(
              source?.name,
              locale,
              t("reasoning.evidenceItems." + sourceId),
            );
            return (
              <div key={sourceId}>
                <EvidenceIcon size={18} />
                <span>{label}<small>{source?.time ?? "—"}</small></span>
              </div>
            );
          })}
        </div>
      ) : null}
      <div className="data-hash">
        <span>{t("reasoning.dataHash")}<strong>{node.hash}</strong></span>
        <CopyButton value={node.hash} />
      </div>
    </article>
  );
}

function ImpactNode({ impact, showProbabilities }) {
  const [expanded, setExpanded] = useState(false);
  const { locale, t } = useI18n();
  const title = localized(impact.name, locale, t("reasoning.impacts." + impact.id));

  return (
    <article className="impact-node">
      <CheckCircle className="impact-check" size={18} weight="fill" />
      {showProbabilities ? (
        <div className="impact-score">
          <strong>{impact.score}</strong>
          <span>{t("reasoning.moderate")}</span>
        </div>
      ) : null}
      <div>
        <strong>{title}</strong>
        <small>({impact.symbol})</small>
      </div>
      <span>↑ {t("reasoning.supportive")}</span>
      <p>{t("reasoning.marketMove")}<br />{impact.flow}</p>
      <button aria-expanded={expanded} type="button" onClick={() => setExpanded((current) => !current)}>
        {t("reasoning.evidence")} (1)<CaretDown className={expanded ? "is-open" : ""} size={13} />
      </button>
      {expanded ? (
        <small className="impact-evidence">
          {impact.evidence ?? t("reasoning.flowEvidence", { flow: impact.flow, symbol: impact.symbol })}
        </small>
      ) : null}
    </article>
  );
}

export function ReasoningWorkspace({
  event,
  livePhase,
  mode,
  onRefresh,
  onReplay,
  onReplaySpeedChange,
  onToggleProbabilities,
  replaying,
  replaySpeed,
  showProbabilities,
}) {
  const [interpretationOpen, setInterpretationOpen] = useState(false);
  const { locale, t } = useI18n();
  const sourceMap = new Map(event.sources.map((source) => [source.id, source]));
  const title = localized(event.event?.title, locale, t("event.title"));
  const timestamp = localized(event.event?.timestamp, locale, t("event.timestamp"));
  const summary = localized(event.event?.summary, locale, t("event.summary"));
  const interpretation = localized(event.event?.interpretation, locale, t("event.interpretation"));
  const aiActive = event.engine?.aiStatus === "active";
  const generatedAt = event.engine?.generatedAt
    ? new Date(event.engine.generatedAt).toLocaleString(locale === "zh" ? "zh-CN" : "en-US")
    : t("reasoning.replayTimestamp");

  return (
    <section className="reasoning-workspace">
      <header className="event-header">
        <div className="event-copy">
          <h1>{title}</h1>
          <div className={"demo-badge " + (mode === "live" ? "is-live" : "")}>
            <Pulse size={14} />
            {mode === "live"
              ? aiActive
                ? t("event.liveAiBadge")
                : t("event.liveRulesBadge")
              : t("event.demoBadge")}
          </div>
          <time>{timestamp}</time>
          <p>{summary}</p>
          <button type="button" onClick={() => setInterpretationOpen((current) => !current)}>
            {interpretationOpen ? t("event.hideInterpretation") : t("event.viewInterpretation")}
            <CaretDown className={interpretationOpen ? "is-open" : ""} size={15} />
          </button>
          {interpretationOpen ? <div className="interpretation-note">{interpretation}</div> : null}
        </div>
        <div className="event-tools">
          {mode === "live" ? (
            <button
              className={livePhase === "refreshing" ? "is-active" : ""}
              disabled={livePhase === "refreshing"}
              type="button"
              onClick={onRefresh}
            >
              <ArrowsClockwise size={16} />
              {livePhase === "refreshing" ? t("event.refreshing") : t("event.refreshLive")}
            </button>
          ) : (
            <>
              <button className={replaying ? "is-active" : ""} type="button" onClick={onReplay}>
                {replaying ? <Clock size={16} /> : <Play size={16} weight="fill" />}
                {replaying ? t("event.replaying") : t("event.replay")}
              </button>
              <button
                aria-label={t("event.replaySpeed", { speed: replaySpeed })}
                title={t("event.replaySpeedHint")}
                type="button"
                onClick={onReplaySpeedChange}
              >
                {replaySpeed}x <CaretDown size={13} />
              </button>
            </>
          )}
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
                <ReasoningNode node={node} sourceMap={sourceMap} />
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
            <div className="branch-lines" aria-hidden="true"><i /><i /><i /></div>
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
            <span>{aiActive ? t("reasoning.aiModel", { model: event.engine.model }) : t("reasoning.rulesModel")} <Info size={15} /></span>
            <span>{t("reasoning.lastUpdatedDynamic", { time: generatedAt })} <i /></span>
          </div>
        </footer>
      </section>
    </section>
  );
}
