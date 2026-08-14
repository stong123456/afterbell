import { CheckCircle } from "@phosphor-icons/react/CheckCircle";
import { Funnel } from "@phosphor-icons/react/Funnel";
import { MinusCircle } from "@phosphor-icons/react/MinusCircle";
import { Pulse } from "@phosphor-icons/react/Pulse";
import { SlidersHorizontal } from "@phosphor-icons/react/SlidersHorizontal";
import { useState } from "react";
import { useI18n } from "../i18n/I18nProvider.jsx";

const stateIcons = {
  confirmed: CheckCircle,
  mixed: Pulse,
  neutral: MinusCircle,
};

export function SourceStream({ sources, visibleCount, replaying }) {
  const [signalsOnly, setSignalsOnly] = useState(false);
  const { t, toggleLocale } = useI18n();
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
          <button type="button" aria-label={t("sourceStream.toggleSignals")} onClick={() => setSignalsOnly((current) => !current)}>
            <Funnel size={17} weight={signalsOnly ? "fill" : "regular"} />
          </button>
          <SlidersHorizontal size={17} aria-hidden="true" />
        </div>
      </div>

      <button className="live-filter" type="button" onClick={() => setSignalsOnly((current) => !current)}>
        <span><i /> {signalsOnly ? t("sourceStream.signalsOnly") : t("sourceStream.liveAuto")}</span>
        <span className="filter-caret">⌄</span>
      </button>

      <div className="stream-columns" aria-hidden="true">
        <span>{t("sourceStream.time")}</span>
        <span>{t("sourceStream.sourceEvent")}</span>
        <span>{t("sourceStream.agreement")}</span>
      </div>

      <div className={`stream-timeline ${replaying ? "is-replaying" : ""}`}>
        {visibleSources.map((source, index) => {
          const StateIcon = stateIcons[source.state];
          return (
            <article className="source-row" key={`${source.time}-${source.id}`} style={{ "--row-index": index }}>
              <div className="source-time">
                <i />
                {source.time}
              </div>
              <div className="source-content">
                <div className="source-name">
                  {source.isNew ? <small>• {t("sourceStream.new")}</small> : null}
                  <span>{t(`sourceItems.${source.id}.name`)}</span>
                </div>
                <strong>{t(`sourceItems.${source.id}.headline`)}</strong>
                {t(`sourceItems.${source.id}.detail`) ? <span>{t(`sourceItems.${source.id}.detail`)}</span> : null}
                <time>{t("sourceStream.fresh", { seconds: source.freshSeconds })}</time>
              </div>
              <StateIcon className={`source-state is-${source.state}`} size={20} weight="regular" />
            </article>
          );
        })}
      </div>

      <button className="stream-more" type="button">
        {t("sourceStream.viewFull")} ↗
      </button>
    </section>
  );
}
