import { useEffect, useState } from "react";

// Extend Window type for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIOS, setShowIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed (running as standalone PWA)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (isStandalone) return;

    // Don't show if user already dismissed within last 7 days
    const lastDismissed = localStorage.getItem("wf-install-dismissed");
    if (lastDismissed) {
      const daysSince = (Date.now() - Number(lastDismissed)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return;
    }

    // Detect iOS (Safari doesn't support beforeinstallprompt)
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as Window & { MSStream?: unknown }).MSStream;

    if (isIOS) {
      // Show iOS instructions after 3 seconds
      const timer = setTimeout(() => setShowIOS(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android / Chrome — listen for the install prompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show banner after 3 seconds
      setTimeout(() => setShowAndroid(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("wf-install-dismissed", String(Date.now()));
    setDismissed(true);
    setShowAndroid(false);
    setShowIOS(false);
  };

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowAndroid(false);
      setDeferredPrompt(null);
    }
  };

  if (dismissed) return null;

  // ── ANDROID BANNER ──────────────────────────────────────────────
  if (showAndroid) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4"
        style={{ animation: "slideUp 0.4s ease-out" }}
      >
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
        `}</style>
        <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-[var(--wf-surface)] p-4 shadow-2xl shadow-black/60">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                style={{ background: "rgba(46,204,113,0.15)" }}
              >
                💰
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Install WealthFlow</p>
                <p className="text-xs text-[var(--wf-text-muted)]">Works offline · No account needed</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="rounded-lg p-1.5 text-[var(--wf-text-muted)] hover:text-white transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Features row */}
          <div className="mb-4 flex gap-2">
            {["📴 Offline", "🔒 Private", "⚡ Fast"].map((f) => (
              <span
                key={f}
                className="rounded-lg border border-white/10 bg-[var(--wf-surface-elevated)] px-2.5 py-1 text-xs text-[var(--wf-text-muted)]"
              >
                {f}
              </span>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleDismiss}
              className="flex-1 rounded-xl border border-white/10 bg-[var(--wf-surface-elevated)] py-2.5 text-sm text-[var(--wf-text-muted)] transition hover:border-white/20"
            >
              Not now
            </button>
            <button
              onClick={handleAndroidInstall}
              className="flex-[2] rounded-xl py-2.5 text-sm font-semibold text-black transition hover:brightness-110"
              style={{ background: "var(--wf-emerald)" }}
            >
              📲 Add to Home Screen
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── iOS BANNER ───────────────────────────────────────────────────
  if (showIOS) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4"
        style={{ animation: "slideUp 0.4s ease-out" }}
      >
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
        `}</style>
        <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-[var(--wf-surface)] p-4 shadow-2xl shadow-black/60">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                style={{ background: "rgba(46,204,113,0.15)" }}
              >
                💰
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Install WealthFlow</p>
                <p className="text-xs text-[var(--wf-text-muted)]">Add to your iPhone home screen</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="rounded-lg p-1.5 text-[var(--wf-text-muted)] hover:text-white transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Step by step iOS instructions */}
          <div className="mb-4 space-y-2 rounded-xl border border-white/8 bg-[var(--wf-surface-elevated)] p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--wf-text-muted)]">
              3 Easy Steps
            </p>
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--wf-emerald)] text-xs font-bold text-black">1</span>
              <p className="text-sm text-white">
                Tap the <span className="font-semibold text-[var(--wf-emerald)]">Share</span> button{" "}
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs">⬆️</span>{" "}
                at the bottom of Safari
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--wf-emerald)] text-xs font-bold text-black">2</span>
              <p className="text-sm text-white">
                Scroll down and tap{" "}
                <span className="font-semibold text-[var(--wf-emerald)]">"Add to Home Screen"</span>{" "}
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs">＋</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--wf-emerald)] text-xs font-bold text-black">3</span>
              <p className="text-sm text-white">
                Tap <span className="font-semibold text-[var(--wf-emerald)]">"Add"</span> — done! App appears on your home screen
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="w-full rounded-xl border border-white/10 bg-[var(--wf-surface-elevated)] py-2.5 text-sm text-[var(--wf-text-muted)] transition hover:border-white/20"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  return null;
}
