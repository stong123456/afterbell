import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { CheckCircle } from "@phosphor-icons/react/CheckCircle";
import { LockSimple } from "@phosphor-icons/react/LockSimple";
import { ShieldCheck } from "@phosphor-icons/react/ShieldCheck";
import { Wallet } from "@phosphor-icons/react/Wallet";
import { X } from "@phosphor-icons/react/X";
import { useEffect, useRef } from "react";
import { decisionPlans } from "../data/eventCase.js";
import { useI18n } from "../i18n/I18nProvider.jsx";

export function ReviewSheet({ connected, decision, error, open, phase, onClose, onConnect, onSign }) {
  const closeButtonRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  if (!open) return null;
  const plan = decisionPlans[decision];

  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-describedby="review-description"
        aria-labelledby="review-title"
        aria-modal="true"
        className="review-sheet"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button ref={closeButtonRef} className="sheet-close" type="button" onClick={onClose} aria-label={t("review.close")}>
          <X size={18} />
        </button>
        <ShieldCheck className="sheet-mark" size={32} weight="duotone" />
        <h2 id="review-title">{t("review.title")}</h2>
        <p id="review-description">{t("review.body")}</p>

        <dl className="review-summary">
          <div><dt>{t("review.action")}</dt><dd>{t(`decision.${decision}`)}</dd></div>
          <div><dt>{t("review.notionalCap")}</dt><dd>$100,000</dd></div>
          <div><dt>{t("review.maximumLoss")}</dt><dd>{plan.maxLoss}</dd></div>
          <div><dt>{t("review.expiry")}</dt><dd>{t("review.expiryValue")}</dd></div>
          <div><dt>{t("review.network")}</dt><dd>{t("receipt.networkValue")}</dd></div>
          <div><dt>{t("review.registry")}</dt><dd>0x8EB6…7647</dd></div>
        </dl>

        <div className="review-checks">
          <span><CheckCircle size={18} weight="fill" /> {t("review.immutable")}</span>
          <span><CheckCircle size={18} weight="fill" /> {t("review.invalidatable")}</span>
          <span><LockSimple size={18} /> {t("review.noCustody")}</span>
        </div>

        {error ? <p className="review-error" role="alert">{t(`review.errors.${error}`)}</p> : null}
        {connected ? (
          <button className="sign-button" disabled={phase !== "idle"} type="button" onClick={onSign}>
            {phase === "recording" ? t("review.recording") : t("review.sign")} <ArrowRight size={18} />
          </button>
        ) : (
          <button className="sign-button" disabled={phase !== "idle"} type="button" onClick={onConnect}>
            <Wallet size={19} /> {phase === "connecting" ? t("review.connecting") : t("review.connect")}
          </button>
        )}
        <small>{t("review.disclaimer")}</small>
      </section>
    </div>
  );
}
