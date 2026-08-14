import { Info } from "@phosphor-icons/react/Info";
import { useI18n } from "../i18n/I18nProvider.jsx";

export function ConfidencePanel({ confidence }) {
  const { t } = useI18n();

  return (
    <section className="confidence-panel" aria-label={t("confidence.label", { score: confidence.score })}>
      <header>
        <span>{t("confidence.title")}</span>
        <Info size={15} />
      </header>
      <div className="confidence-score">
        <strong>{confidence.score}</strong>
        <span>/ 100</span>
      </div>
      <dl>
        {confidence.factors.map(([key, value], index) => (
          <div className={index === confidence.factors.length - 1 ? "is-penalty" : ""} key={key}>
            <dt>{t(`confidence.${key}`)}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="confidence-total">
        <span>{t("confidence.total")}</span>
        <strong>{confidence.score} / 100</strong>
      </div>
    </section>
  );
}
