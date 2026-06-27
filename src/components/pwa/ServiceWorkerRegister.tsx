"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (public/sw.js) once on the client. Only runs in
 * production builds — in dev, Next's hot-reload and an active SW fight each
 * other, so we skip registration and proactively unregister any stale worker.
 * Renders nothing.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((regs) =>
        regs.forEach((r) => r.unregister())
      );
      return;
    }

    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.error("SW registration failed:", err));
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
