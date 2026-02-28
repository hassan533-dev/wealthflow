type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-[var(--wf-surface)] p-5 shadow-2xl shadow-black/60"
        style={{ animation: "slideUp 0.25s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
        `}</style>

        {/* Icon */}
        <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl
          ${danger ? "bg-red-500/15" : "bg-[var(--wf-emerald)]/15"}`}>
          {danger ? "🗑️" : "❓"}
        </div>

        {/* Text */}
        <h3 className="mb-2 text-base font-bold text-white">{title}</h3>
        <p className="mb-5 text-sm leading-relaxed text-[var(--wf-text-muted)]">{message}</p>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-white/10 bg-[var(--wf-surface-elevated)] py-3 text-sm font-medium text-[var(--wf-text-muted)] transition hover:border-white/20"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-[1.5] rounded-2xl py-3 text-sm font-bold text-white transition
              ${danger ? "bg-red-500 hover:bg-red-600" : "bg-[var(--wf-emerald)] text-black hover:brightness-110"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
