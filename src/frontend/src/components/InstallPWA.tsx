import React, { useEffect, useState } from "react";

// Extend Window type for beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

const DISMISS_KEY = "pwa-install-dismissed-at";
const COOLDOWN_DAYS = 3;

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  return (
    (window.navigator as { standalone?: boolean }).standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

function shouldShowBanner(): boolean {
  if (isInStandaloneMode()) return false;
  const dismissedAt = localStorage.getItem(DISMISS_KEY);
  if (!dismissedAt) return true;
  const daysSince =
    (Date.now() - Number.parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
  return daysSince >= COOLDOWN_DAYS;
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (!shouldShowBanner()) return;
    setIsIOSDevice(isIOS());

    // For iOS: show banner with Add to Home Screen instructions
    if (isIOS() && !isInStandaloneMode()) {
      setTimeout(() => setShow(true), 3000);
    }

    // For Android/Chrome/Edge: capture beforeinstallprompt
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShow(true), 3000);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Hide if already installed
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setShow(false);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (isIOSDevice) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
      setInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    setShowIOSGuide(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  };

  if (!show || installed) return null;

  const steps = [
    {
      step: "1",
      icon: "⬆️",
      text: "Tap the Share button at the bottom of Safari",
    },
    { step: "2", icon: "➕", text: 'Scroll down and tap "Add to Home Screen"' },
    { step: "3", icon: "✅", text: 'Tap "Add" to install Task Turtle' },
  ];

  // iOS Add to Home Screen guide modal
  if (showIOSGuide) {
    return (
      // biome-ignore lint/a11y/useKeyWithClickEvents: overlay dismiss is supplemental
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(8px)",
          zIndex: 9998,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          padding: "16px",
        }}
        onClick={handleDismiss}
      >
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: inner click stops propagation */}
        <div
          style={{
            background: "#111",
            border: "1px solid rgba(0,255,136,0.3)",
            borderRadius: "20px",
            padding: "24px",
            maxWidth: "400px",
            width: "100%",
            marginBottom: "16px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>🐢</div>
            <div
              style={{ color: "#00ff88", fontWeight: 700, fontSize: "18px" }}
            >
              Install Task Turtle
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: "13px",
                marginTop: "4px",
              }}
            >
              Add to your Home Screen for the best experience
            </div>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {steps.map(({ step, icon, text }) => (
              <div
                key={step}
                style={{ display: "flex", gap: "12px", alignItems: "center" }}
              >
                <div
                  style={{
                    minWidth: "32px",
                    height: "32px",
                    background: "rgba(0,255,136,0.15)",
                    border: "1px solid rgba(0,255,136,0.3)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                  }}
                >
                  {icon}
                </div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: "14px",
                    lineHeight: 1.4,
                  }}
                >
                  {text}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            style={{
              width: "100%",
              marginTop: "20px",
              background: "rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.6)",
              border: "none",
              borderRadius: "12px",
              padding: "12px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Got it, close
          </button>
        </div>
      </div>
    );
  }

  // Standard install banner (Android / Windows)
  return (
    <div
      style={{
        position: "fixed",
        bottom: "16px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth: "480px",
        background: "linear-gradient(135deg, #0a1a12 0%, #0d1f16 100%)",
        border: "1px solid rgba(0, 255, 136, 0.3)",
        borderRadius: "16px",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        zIndex: 9997,
        boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(0,255,136,0.1)",
        animation: "slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
      <img
        src="/assets/generated/pwa-icon-192.dim_192x192.png"
        alt="Task Turtle"
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "10px",
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: "#fff",
            fontWeight: 700,
            fontSize: "14px",
            lineHeight: 1.3,
          }}
        >
          Install Task Turtle
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "12px",
            marginTop: "2px",
          }}
        >
          Get the app for a better experience
        </div>
      </div>
      <button
        type="button"
        onClick={handleInstall}
        style={{
          background: "linear-gradient(135deg, #00ff88, #00cc6e)",
          color: "#000",
          border: "none",
          borderRadius: "10px",
          padding: "8px 16px",
          fontSize: "13px",
          fontWeight: 700,
          cursor: "pointer",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
      >
        {isIOSDevice ? "How to Install" : "Install"}
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        style={{
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.4)",
          cursor: "pointer",
          fontSize: "18px",
          padding: "4px",
          lineHeight: 1,
          flexShrink: 0,
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
