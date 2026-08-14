import { ClockCounterClockwise } from "@phosphor-icons/react/ClockCounterClockwise";
import { Crosshair } from "@phosphor-icons/react/Crosshair";
import { Moon } from "@phosphor-icons/react/Moon";
import { Receipt } from "@phosphor-icons/react/Receipt";
import { Sun } from "@phosphor-icons/react/Sun";
import { Wallet } from "@phosphor-icons/react/Wallet";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { compactAddress } from "../lib/xlayerTestnet.js";

export function AppRail({ connected, connecting, walletAddress, onConnect, onRadar, onReceipts, onReplay }) {
  const { t } = useI18n();

  return (
    <aside className="app-rail" aria-label={t("navigation.label")}>
      <div className="brand" aria-label="askstone">
        <div className="brand-mark">ask<span>stone</span></div>
        <small>askstone.xyz</small>
      </div>

      <nav className="rail-nav">
        <button className="rail-action is-active" type="button" onClick={onRadar}>
          <Crosshair size={27} weight="regular" />
          <span>{t("navigation.radar")}</span>
        </button>
        <button className="rail-action" type="button" onClick={onReceipts}>
          <Receipt size={26} weight="regular" />
          <span>{t("navigation.receipts")}</span>
        </button>
        <button className="rail-action" type="button" onClick={onReplay}>
          <ClockCounterClockwise size={27} weight="regular" />
          <span>{t("navigation.replay")}</span>
        </button>
      </nav>

      <div className="rail-footer">
        <div className="network-state" aria-label={t("network.statusLabel")}>
          <span>X Layer</span>
          <span>{t("network.testnet")}</span>
          <small><i /> {t("network.online")}</small>
        </div>
        <button
          aria-busy={connecting}
          aria-label={connected ? t("wallet.connectedLabel", { address: compactAddress(walletAddress) }) : t("wallet.connect")}
          className={`wallet-button ${connected ? "is-connected" : ""}`}
          disabled={connecting}
          type="button"
          onClick={onConnect}
        >
          <Wallet size={19} />
          <span>{connected ? compactAddress(walletAddress) : connecting ? t("wallet.connecting") : t("wallet.connect")}</span>
        </button>
        <div className="theme-icons" aria-hidden="true">
          <Sun size={20} />
          <Moon size={19} />
        </div>
      </div>
    </aside>
  );
}
