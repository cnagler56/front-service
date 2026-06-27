"use client";

import { useEffect, useState } from "react";

/**
 * A visible "Install app" banner. Chrome on Android fires `beforeinstallprompt`
 * but shows no UI of its own, so we capture that event and surface our own
 * button that calls prompt() directly. iOS Safari has no such event, so we show
 * the manual "Share → Add to Home Screen" hint instead. Hidden when the app is
 * already installed (standalone) or the user dismissed it.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  prompt: () => Promise<void>;
}

const DISMISS_KEY = "j4a-install-dismissed";

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // iOS Safari can't auto-prompt — detect it and show manual instructions.
    const ua = window.navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
    if (isIOS && isSafari) {
      setIosHint(true);
      setVisible(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* private mode — fine, just won't persist */
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") setVisible(false);
    setDeferred(null);
  };

  return (
    <div
      role="dialog"
      aria-label="Install Just4Ag"
      style={{
        position: "fixed",
        left: "50%",
        bottom: "1rem",
        transform: "translateX(-50%)",
        zIndex: 2000,
        width: "min(440px, calc(100vw - 1.5rem))",
        display: "flex",
        alignItems: "center",
        gap: ".85rem",
        background: "linear-gradient(135deg, #2c4a1e, #3d6b2a)",
        border: "1px solid #8fbc45",
        borderRadius: 10,
        boxShadow: "0 8px 28px rgba(0,0,0,.35)",
        padding: ".75rem .9rem",
        fontFamily: "Lato, sans-serif",
        color: "#f0f7e6",
      }}
    >
      <img
        src="/icons/icon-192.png"
        alt=""
        width={40}
        height={40}
        style={{ borderRadius: 8, flex: "0 0 auto" }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: ".92rem" }}>Install Just4Ag</div>
        <div style={{ fontSize: ".78rem", color: "#c9dfa3", lineHeight: 1.35 }}>
          {iosHint
            ? "Tap the Share icon, then “Add to Home Screen.”"
            : "Add it to your home screen for quick, full-screen access."}
        </div>
      </div>

      {!iosHint && (
        <button
          onClick={install}
          style={{
            flex: "0 0 auto",
            background: "#8fbc45",
            color: "#1a2e0f",
            border: "none",
            borderRadius: 6,
            padding: ".5rem 1rem",
            fontSize: ".85rem",
            fontWeight: 700,
            fontFamily: "Lato, sans-serif",
            cursor: "pointer",
            letterSpacing: ".02em",
          }}
        >
          Install
        </button>
      )}

      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{
          flex: "0 0 auto",
          background: "transparent",
          color: "#f0f7e6",
          border: "none",
          fontSize: "1.2rem",
          lineHeight: 1,
          cursor: "pointer",
          opacity: 0.8,
          padding: "0 .15rem",
        }}
      >
        ×
      </button>
    </div>
  );
}
