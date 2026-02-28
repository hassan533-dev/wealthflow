import { useEffect, useState } from "react";

type UndoToastProps = {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
};

export function UndoToast({ message, onUndo, onDismiss, duration = 5000 }: UndoToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 30);
    return () => clearInterval(interval);
  }, [duration, onDismiss]);

  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2"
      style={{ animation: "slideUp 0.3s ease-out" }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translate(-50%, 20px); opacity: 0; }
          to   { transform: translate(-50%, 0);    opacity: 1; }
        }
      `}</style>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[var(--wf-surface)] shadow-2xl shadow-black/60">
        {/* Progress bar */}
        <div
          className="h-0.5 bg-[var(--wf-emerald)] transition-all"
          style={{ width: `${progress}%` }}
        />
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-base">✅</span>
            <p className="text-sm font-medium text-white">{message}</p>
          </div>
          <button
            onClick={onUndo}
            className="shrink-0 rounded-xl border border-[var(--wf-emerald)]/30 bg-[var(--wf-emerald)]/10 px-3 py-1.5 text-xs font-bold text-[var(--wf-emerald)] transition hover:bg-[var(--wf-emerald)]/20"
          >
            Undo
          </button>
        </div>
      </div>
    </div>
  );
}
