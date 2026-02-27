import { useEffect, useRef, useState } from "react";
import type { Category } from "../types/finance";

type AddTransactionSheetProps = {
  category: Category | null;
  currency: string;
  onClose: () => void;
  onSubmit: (amount: number, note: string, isNeed: boolean) => Promise<void>;
};

export function AddTransactionSheet({ category, currency, onClose, onSubmit }: AddTransactionSheetProps) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isNeed, setIsNeed] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (category) {
      setAmount("");
      setNote("");
      setIsNeed(true);
      setTimeout(() => amountRef.current?.focus(), 30);
    }
  }, [category]);

  if (!category) {
    return null;
  }

  const submit = async () => {
    const parsed = Number.parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return;
    }
    setIsSaving(true);
    await onSubmit(parsed, note, isNeed);
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-20 flex items-end bg-black/55 p-3 sm:p-6" onClick={onClose}>
      <div
        className="mx-auto w-full max-w-lg rounded-3xl border border-white/10 bg-[var(--wf-surface)] p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm"
              style={{ backgroundColor: `${category.color}22`, color: category.color }}
            >
              {category.icon}
            </span>
            <h3 className="text-lg font-semibold text-white">{category.name}</h3>
          </div>
          <button onClick={onClose} className="text-sm text-[var(--wf-text-muted)]">
            Close
          </button>
        </div>
        <div className="space-y-3">
          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-wide text-[var(--wf-text-muted)]">
              Price ({currency})
            </span>
            <input
              ref={amountRef}
              type="number"
              min="0"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[var(--wf-surface-elevated)] px-4 py-3 text-2xl font-semibold text-white outline-none ring-[var(--wf-emerald)]/60 transition focus:ring"
              placeholder="0.00"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-wide text-[var(--wf-text-muted)]">Detail / Notes</span>
            <input
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[var(--wf-surface-elevated)] px-4 py-3 text-sm text-white outline-none ring-[var(--wf-emerald)]/60 transition focus:ring"
              placeholder="Optional note"
            />
          </label>

          {/* Need vs Want toggle */}
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-wide text-[var(--wf-text-muted)]">Type</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsNeed(true)}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isNeed
                    ? "bg-[var(--wf-emerald)] text-black"
                    : "border border-white/10 bg-[var(--wf-surface-elevated)] text-[var(--wf-text-muted)]"
                }`}
              >
                🛡️ Need
              </button>
              <button
                type="button"
                onClick={() => setIsNeed(false)}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  !isNeed
                    ? "bg-orange-500 text-black"
                    : "border border-white/10 bg-[var(--wf-surface-elevated)] text-[var(--wf-text-muted)]"
                }`}
              >
                ✨ Want
              </button>
            </div>
            <p className="text-xs text-[var(--wf-text-muted)]">
              {isNeed
                ? "Needs won't break your no-spend streak 🔥"
                : "Wants will reset your no-spend streak"}
            </p>
          </div>
        </div>
        <button
          onClick={submit}
          disabled={isSaving}
          className="mt-5 w-full rounded-2xl bg-[var(--wf-emerald)] px-5 py-3 text-sm font-semibold text-black disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save transaction"}
        </button>
      </div>
    </div>
  );
}
