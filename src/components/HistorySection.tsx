import { useMemo, useState } from "react";
import type { Transaction } from "../types/finance";
import { ConfirmModal } from "./ConfirmModal";

type EnrichedTransaction = Transaction & {
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
};

type HistorySectionProps = {
  transactions: EnrichedTransaction[];
  currency: string;
  hideBalance: boolean;
  onDelete: (id: number) => Promise<void>;
  onEdit: (transaction: EnrichedTransaction) => void;
};

const formatMoney = (value: number, currency: string) => {
  if (/^[A-Za-z]{3}$/.test(currency.trim())) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency.toUpperCase(),
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value);
    } catch {
      return `${currency.toUpperCase()} ${value.toFixed(2)}`;
    }
  }
  return `${currency} ${value.toFixed(2)}`;
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function groupByDate(transactions: EnrichedTransaction[]) {
  const groups: { label: string; items: EnrichedTransaction[] }[] = [];
  const map = new Map<string, EnrichedTransaction[]>();

  for (const t of transactions) {
    const d = new Date(t.createdAt);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let label: string;
    if (d.toDateString() === today.toDateString()) {
      label = "Today";
    } else if (d.toDateString() === yesterday.toDateString()) {
      label = "Yesterday";
    } else {
      label = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    }

    if (!map.has(label)) {
      map.set(label, []);
    }
    map.get(label)!.push(t);
  }

  for (const [label, items] of map) {
    groups.push({ label, items });
  }

  return groups;
}

export function HistorySection({ transactions, currency, hideBalance, onDelete, onEdit }: HistorySectionProps) {
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<"all" | "need" | "want">("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return transactions;
    if (filter === "need") return transactions.filter((t) => t.isNeed);
    return transactions.filter((t) => !t.isNeed);
  }, [transactions, filter]);

  const displayed = showAll ? filtered : filtered.slice(0, 10);
  const grouped = useMemo(() => groupByDate(displayed), [displayed]);

  const totalSpent = useMemo(
    () => filtered.reduce((sum, t) => sum + t.amount, 0),
    [filtered]
  );

  const confirmingTransaction = transactions.find((t) => t.id === confirmDeleteId);

  const handleDeleteConfirmed = async () => {
    if (confirmDeleteId == null) return;
    setDeletingId(confirmDeleteId);
    setConfirmDeleteId(null);
    await onDelete(confirmDeleteId);
    setDeletingId(null);
  };

  return (
    <section className="fade-rise rounded-3xl border border-white/10 bg-[var(--wf-surface)] p-5 shadow-xl shadow-black/20 [animation-delay:360ms]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            📋 Transaction History
          </h2>
          <p className="mt-0.5 text-xs text-[var(--wf-text-muted)]">
            {transactions.length} {transactions.length === 1 ? "transaction" : "transactions"} total
            {filtered.length > 0 && !hideBalance && (
              <> · <span className="font-semibold text-red-400">-{formatMoney(totalSpent, currency)}</span></>
            )}
          </p>
        </div>
        <div className="flex gap-1.5">
          {(["all", "need", "want"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                filter === f
                  ? "bg-[var(--wf-emerald)] text-black"
                  : "border border-white/10 bg-[var(--wf-surface-elevated)] text-[var(--wf-text-muted)]"
              }`}
            >
              {f === "all" ? "All" : f === "need" ? "🛡️ Needs" : "✨ Wants"}
            </button>
          ))}
        </div>
      </div>

      {grouped.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 text-4xl">🧾</div>
          <p className="text-sm font-medium text-[var(--wf-text-muted)]">No transactions yet</p>
          <p className="mt-1 text-xs text-[var(--wf-text-muted)]/60">Tap a category to add your first one</p>
        </div>
      )}

      <div className="space-y-4">
        {grouped.map((group) => (
          <div key={group.label}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--wf-text-muted)]/70">
              {group.label}
            </p>
            <div className="space-y-1.5">
              {group.items.map((t) => (
                <div
                  key={t.id}
                  className={`group flex items-center gap-3 rounded-xl border border-white/5 bg-[var(--wf-surface-elevated)] px-3 py-3 transition hover:border-white/15 sm:px-4 ${
                    deletingId === t.id ? "opacity-50" : ""
                  }`}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base"
                    style={{ backgroundColor: `${t.categoryColor}22`, color: t.categoryColor }}
                  >
                    {t.categoryIcon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-white">{t.categoryName}</p>
                      <span
                        className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                          t.isNeed
                            ? "bg-[var(--wf-emerald)]/15 text-[var(--wf-emerald)]"
                            : "bg-orange-500/15 text-orange-400"
                        }`}
                      >
                        {t.isNeed ? "Need" : "Want"}
                      </span>
                    </div>
                    <p className="truncate text-xs text-[var(--wf-text-muted)]">
                      {t.note || "No note"} · {formatTime(t.createdAt)} · {timeAgo(t.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="shrink-0 text-sm font-semibold text-red-400">
                      {hideBalance ? "***" : `- ${formatMoney(t.amount, currency)}`}
                    </span>
                    {/* Edit button */}
                    <button
                      onClick={() => onEdit(t)}
                      className="shrink-0 rounded-lg p-1.5 text-[var(--wf-text-muted)]/50 opacity-0 transition hover:bg-[var(--wf-emerald)]/10 hover:text-[var(--wf-emerald)] group-hover:opacity-100"
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    {/* Delete button — always visible on mobile, hover on desktop */}
                    <button
                      onClick={() => t.id != null && setConfirmDeleteId(t.id)}
                      disabled={deletingId === t.id}
                      className="shrink-0 rounded-lg p-1.5 text-[var(--wf-text-muted)]/50 transition hover:bg-red-500/10 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100"
                      title="Delete"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filtered.length > 10 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 w-full rounded-xl border border-white/10 bg-[var(--wf-surface-elevated)] px-4 py-3 text-sm font-medium text-[var(--wf-text-muted)] transition hover:border-white/20"
        >
          {showAll ? "Show less" : `Show all ${filtered.length} transactions`}
        </button>
      )}

      {/* Beautiful in-app delete confirmation — replaces window.confirm */}
      <ConfirmModal
        open={confirmDeleteId !== null}
        title="Delete Transaction?"
        message={
          confirmingTransaction
            ? `Delete "${confirmingTransaction.categoryName}" transaction of ${formatMoney(confirmingTransaction.amount, currency)}? The amount will be refunded to your balance.`
            : "This transaction will be permanently deleted and the amount refunded to your balance."
        }
        confirmLabel="Delete"
        danger
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </section>
  );
}
