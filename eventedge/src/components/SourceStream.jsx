import { CheckCircle } from "@phosphor-icons/react/CheckCircle";
import { Funnel } from "@phosphor-icons/react/Funnel";
import { MinusCircle } from "@phosphor-icons/react/MinusCircle";
import { Pulse } from "@phosphor-icons/react/Pulse";
import { useState } from "react";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { localized } from "../lib/liveData.js";

const stateIcons = {
  confirmed: CheckCircle,
  mixed: Pulse,
  neutral: MinusCircle,
};

function freshness(seconds, t) {
  if (!Number.isFinite(seconds) || seconds < 0) return t("sourceStream.freshNow");
  if (seconds < 60) return t("sourceStream.fresh", { seconds });
  if (seconds < 3_600) return t("sourceStream.freshMinutes", { minutes: Math.round(seconds / 60) });
  return t("sourceStream.freshHours", { hours: Math.round(seconds / 3_600) });
}

export function SourceStream({
  liveError,
  livePhase,
  mode,
  onModeChange,
  replaying,
  sources,
  totalCount,
  visibleCount,
}) {
  const [signalsOnly, setSignalsOnly] = useState(false);
  const { locale, t, toggleLocale } = useI18n();
  const visibleSources = sources
    .slice(0, visibleCount)
    .filter((source) => !signalsOnly || source.state !== "neutral");

  return (
    <section className="source-stream" aria-label={t("sourceStream.label")}>
      <div className="stream-heading">
        <span>{t("sourceStream.title")}</span>
        <div>
          <button
            className="language-toggle"
            type="button"
            aria-label={t("language.switchLabel")}
            title={t("language.switchLabel")}
            onClick={toggleLocale}
          >
            {t("language.shortTarget")}
          </button>
          <button
            aria-pressed={signalsOnly}
            type="button"
            aria-label={t("sourceStream.toggleSignals")}
            onClick={() => setSignalsOnly((current) => !current)}
          >
            <Funnel size={17} weight={signalsOnly ? "fill" : "regular"} />
          </button>
        </div>
      </div>

      <div className="mode-switch" role="group" aria-label={t("sourceStream.modeLabel")}>
        {["live", "replay"].map((value) => (
          <button
            aria-pressed={mode === value}
            className={mode === value ? "is-active" : ""}
            key={value}
            onClick={() => onModeChange(value)}
            type="button"
          >
            <i /> {t("sourceStream.modes." + value)}
          </button>
        ))}
      </div>

      <button
        aria-pressed={signalsOnly}
        className={"live-filter is-" + mode}
        title={mode === "live" ? t("sourceStream.liveDisclosure") : t("sourceStream.demoDisclosure")}
        type="button"
        onClick={() => setSignalsOnly((current) => !current)}
      >
        <span>
          <i />
          {signalsOnly
            ? t("sourceStream.signalsOnly")
            : mode === "live"
              ? t("sourceStream.livePhases." + livePhase)
              : t("sourceStream.replayAuto")}
        </span>
        <span className="filter-caret">⌄</span>
      </button>

      {mode === "live" && liveError ? (
        <div className="live-warning" role="status">
          {t("sourceStream.liveWarning")}
        </div>
      ) : null}

      <div className="stream-columns" aria-hidden="true">
        <span>{t("sourceStream.time")}</span>
        <span>{t("sourceStream.sourceEvent")}</span>
        <span>{t("sourceStream.agreement")}</span>
      </div>

      <div className={"stream-timeline " + (replaying ? "is-replaying" : "")}>
        {visibleSources.map((source, index) => {
          const StateIcon = stateIcons[source.state] ?? MinusCircle;
          const name = localized(source.name, locale, t("sourceItems." + source.id + ".name"));
          const headline = localized(source.headline, locale, t("sourceItems." + source.id + ".headline"));
          const detail = localized(source.detail, locale, t("sourceItems." + source.id + ".detail"));
          return (
            <article className="source-row" key={source.time + "-" + source.id} style={{ "--row-index": index }}>
              <div className="source-time">
                <i />
                {source.time}
              </div>
              <div className="source-content">
                <div className="source-name">
                  {source.isNew ? <small>— {t("sourceStream.new")}</small> : null}
                  {source.sourceUrl ? (
                    <a href={source.sourceUrl} target="_blank" rel="noreferrer">{name}</a>
                  ) : <span>{name}</span>}
                </div>
                <strong>{headline}</strong>
                {detail ? <span>{detail}</span> : null}
                <time>{freshness(source.freshSeconds, t)}</time>
              </div>
              <StateIcon className={"source-state is-" + source.state} size={20} weight="regular" />
            </article>
          );
        })}
      </div>

      <div className="stream-summary" aria-live="polite">
        <CheckCircle size={15} weight="fill" />
        <span>{t("sourceStream.loaded", { visible: visibleSources.length, total: totalCount })}</span>
        <small>{mode === "live" ? t("sourceStream.liveEvidence") : t("sourceStream.replayEvidence")}</small>
      </div>
    </section>
  );
}
