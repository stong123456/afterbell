import { Check } from "@phosphor-icons/react/Check";
import { Copy } from "@phosphor-icons/react/Copy";
import { useEffect, useState } from "react";
import { useI18n } from "../i18n/I18nProvider.jsx";

export function CopyButton({ className = "", value }) {
  const [status, setStatus] = useState("idle");
  const { t } = useI18n();

  useEffect(() => {
    if (status === "idle") return undefined;
    const timer = window.setTimeout(() => setStatus("idle"), 1600);
    return () => window.clearTimeout(timer);
  }, [status]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  };

  const label = status === "copied" ? t("common.copied") : status === "failed" ? t("common.copyFailed") : t("common.copy");

  return (
    <button
      aria-label={`${label}: ${value}`}
      className={`copy-button ${className}`.trim()}
      title={label}
      type="button"
      onClick={copy}
    >
      {status === "copied" ? <Check size={14} weight="bold" /> : <Copy size={14} />}
      <span className="sr-only" aria-live="polite">{status === "idle" ? "" : label}</span>
    </button>
  );
}
