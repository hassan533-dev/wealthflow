import { useEffect, useMemo, useRef, useState } from "react";
import type { AppSettings } from "../types/finance";
import { exportData, importData } from "../db/localDb";
import { ConfirmModal } from "./ConfirmModal";

type SettingsSheetProps = {
  open: boolean;
  settings: AppSettings;
  onClose: () => void;
  onSavePreferences: (input: { currency?: string; darkMode?: boolean; monthlyIncome?: number }) => Promise<void>;
  onAdjustBalance: (amount: number) => Promise<void>;
  onReset: () => Promise<void>;
};

export function SettingsSheet({
  open,
  settings,
  onClose,
  onSavePreferences,
  onAdjustBalance,
  onReset,
}: SettingsSheetProps) {
  const [currency, setCurrency] = useState(settings.currency);
  const [darkMode, setDarkMode] = useState(settings.darkMode);
  const [monthlyIncome, setMonthlyIncome] = useState(String(settings.monthlyIncome || ""));
  const [balanceDelta, setBalanceDelta] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [backupMsg, setBackupMsg] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setShowResetConfirm(false);
      setBackupMsg("");
      return;
    }
    setCurrency(settings.currency);
    setDarkMode(settings.darkMode);
    setMonthlyIncome(String(settings.monthlyIncome || ""));
    setBalanceDelta("");
  }, [open, settings.currency, settings.darkMode, settings.monthlyIncome]);

  const parsedDelta = useMemo(() => Number.parseFloat(balanceDelta), [balanceDelta]);
  const parsedIncome = useMemo(() => Number.parseFloat(monthlyIncome || "0"), [monthlyIncome]);

  if (!open) return null;

  const savePreferences = async () => {
    if (!currency.trim()) return;
    setIsSaving(true);
    await onSavePreferences({
      currency: currency.trim().toUpperCase(),
      darkMode,
      monthlyIncome: Number.isFinite(parsedIncome) && parsedIncome > 0 ? parsedIncome : settings.monthlyIncome,
    });
    setIsSaving(false);
  };

  const addBalance = async () => {
    if (!Number.isFinite(parsedDelta) || parsedDelta <= 0) return;
    setIsSaving(true);
    await onAdjustBalance(parsedDelta);
    setBalanceDelta("");
    setIsSaving(false);
  };

  const handleReset = async () => {
    setShowResetConfirm(false);
    await onReset();
  };

  const handleExport = async () => {
    try {
      const data = await exportData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wealthflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupMsg("✅ Backup downloaded!");
      setTimeout(() => setBackupMsg(""), 3000);
    } catch {
      setBackupMsg("❌ Export failed. Try again.");
      setTimeout(() => setBackupMsg(""), 3000);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!parsed.settings || !parsed.categories || !parsed.transactions) {
          setBackupMsg("❌ Invalid backup file.");
          setTimeout(() => setBackupMsg(""), 3000);
          return;
        }
        await importData(parsed);
        setBackupMsg("✅ Data restored! Refreshing...");
        setTimeout(() => window.location.reload(), 1500);
      } catch {
        setBackupMsg("❌ Could not read file. Make sure it's a valid WealthFlow backup.");
        setTimeout(() => setBackupMsg(""), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleShare = async () => {
    const url = window.location.origin;
    const text = "💰 I'm tracking my finances with WealthFlow — free, offline, private. No account needed!";
    if (navigator.share) {
      await navigator.share({ title: "WealthFlow", text, url }).catch(() => null);
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`).catch(() => null);
      setBackupMsg("✅ Link copied to clipboard!");
      setTimeout(() => setBackupMsg(""), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/70 backdrop-blur-sm p-3 sm:p-6" onClick={onClose}>
      <div
        className="mx-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-[var(--wf-surface)] shadow-2xl shadow-black/50"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 rounded-t-3xl border-b border-white/5 bg-[var(--wf-surface)]/95 backdrop-blur-md px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--wf-emerald)]/15 text-lg">
                ⚙️
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Settings</h3>
                <p className="text-[10px] text-[var(--wf-text-muted)]">Manage your preferences</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-[var(--wf-surface-elevated)] p-2 text-[var(--wf-text-muted)] transition hover:border-white/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-4 p-5">

          {/* Currency */}
          <div className="rounded-2xl border border-white/10 bg-[var(--wf-surface-elevated)] p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-base">💱</span>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--wf-text-muted)]">Currency</span>
            </div>
            <input
              type="text"
              value={currency}
              onChange={(event) => setCurrency(event.target.value.toUpperCase())}
              placeholder="PKR"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold uppercase text-white outline-none ring-[var(--wf-emerald)]/60 transition focus:ring"
            />
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {["USD", "PKR", "INR", "EUR", "GBP", "SAR", "AED", "BDT", "LKR", "NPR"].map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition ${
                    currency === c
                      ? "bg-[var(--wf-emerald)] text-black"
                      : "border border-white/10 bg-black/20 text-[var(--wf-text-muted)] hover:border-white/20"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Monthly Income */}
          <div className="rounded-2xl border border-white/10 bg-[var(--wf-surface-elevated)] p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-base">📈</span>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--wf-text-muted)]">Monthly Income</span>
            </div>
            <input
              type="number"
              min="0"
              value={monthlyIncome}
              onChange={(event) => setMonthlyIncome(event.target.value)}
              placeholder="50000"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white outline-none ring-[var(--wf-emerald)]/60 transition focus:ring"
            />
            <p className="mt-2 text-[10px] text-[var(--wf-text-muted)]">
              Powers your Daily Allowance calculation
            </p>
          </div>

          {/* Appearance */}
          <div className="rounded-2xl border border-white/10 bg-[var(--wf-surface-elevated)] p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-base">🎨</span>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--wf-text-muted)]">Appearance</span>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3 transition hover:border-white/20"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{darkMode ? "🌙" : "☀️"}</span>
                <span className="text-sm font-medium text-white">
                  {darkMode ? "Dark Mode" : "Light Mode"}
                </span>
              </div>
              <div className={`relative h-6 w-11 rounded-full transition-colors ${darkMode ? "bg-[var(--wf-emerald)]" : "bg-white/20"}`}>
                <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-all ${darkMode ? "left-[22px]" : "left-0.5"}`} />
              </div>
            </button>
          </div>

          {/* Add to Balance */}
          <div className="rounded-2xl border border-white/10 bg-[var(--wf-surface-elevated)] p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-base">💵</span>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--wf-text-muted)]">Add to Balance</span>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                value={balanceDelta}
                onChange={(event) => setBalanceDelta(event.target.value)}
                placeholder="500"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none ring-[var(--wf-emerald)]/60 transition focus:ring"
              />
              <button
                onClick={addBalance}
                disabled={isSaving || !Number.isFinite(parsedDelta) || parsedDelta <= 0}
                className="shrink-0 rounded-xl bg-[var(--wf-emerald)] px-5 py-3 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-50"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Save Preferences */}
          <button
            onClick={savePreferences}
            disabled={isSaving}
            className="w-full rounded-2xl bg-[var(--wf-emerald)] px-5 py-3.5 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "✓ Save All Preferences"}
          </button>

          {/* Backup & Restore */}
          <div className="rounded-2xl border border-white/10 bg-[var(--wf-surface-elevated)] p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-base">💾</span>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--wf-text-muted)]">Backup & Restore</span>
            </div>
            <p className="mb-3 text-xs text-[var(--wf-text-muted)]">
              Export all your data as a JSON file. Import it back anytime — even on a new device or browser.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-xs font-semibold text-white transition hover:border-white/20"
              >
                📤 Export Backup
              </button>
              <button
                onClick={() => importRef.current?.click()}
                className="flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-xs font-semibold text-white transition hover:border-white/20"
              >
                📥 Restore Backup
              </button>
              <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            </div>
            {backupMsg && (
              <p className="mt-2.5 text-xs font-medium text-[var(--wf-emerald)]">{backupMsg}</p>
            )}
          </div>

          {/* Share App */}
          <button
            onClick={handleShare}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[var(--wf-surface-elevated)] px-5 py-3 text-sm font-semibold text-[var(--wf-text-muted)] transition hover:border-[var(--wf-emerald)]/40 hover:text-[var(--wf-emerald)]"
          >
            🔗 Share WealthFlow with a Friend
          </button>

          {/* About */}
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[var(--wf-surface-elevated)] to-[var(--wf-surface)] p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--wf-emerald)]/15">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-[var(--wf-emerald)]" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 21v-6" strokeLinecap="round" />
                  <path d="M8 13c0-3 2-5 4-5s4 2 4 5" strokeLinecap="round" />
                  <path d="M12 8c0-3 2.5-5 5-5 0 3-1 6-5 7" strokeLinecap="round" />
                  <path d="M12 10C9 9 7 6 7 3c2.5 0 5 2 5 7" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">WealthFlow</h4>
                <p className="text-[10px] text-[var(--wf-text-muted)]">Version 1.0.0</p>
              </div>
            </div>

            <p className="mb-4 text-sm leading-relaxed text-[var(--wf-text-muted)]">
              <span className="font-semibold text-white">Your money. Your device. Your rules.</span>{" "}
              WealthFlow was crafted for people who believe financial freedom starts with awareness — not another subscription or cloud service.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--wf-emerald)]/10 text-sm">🔒</div>
                <div>
                  <p className="text-xs font-semibold text-white">100% Private & Offline</p>
                  <p className="text-[11px] leading-relaxed text-[var(--wf-text-muted)]">
                    Zero servers. Zero tracking. Your financial data is stored only on this device using IndexedDB.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--wf-emerald)]/10 text-sm">⚡</div>
                <div>
                  <p className="text-xs font-semibold text-white">Lightning Fast</p>
                  <p className="text-[11px] leading-relaxed text-[var(--wf-text-muted)]">
                    No loading spinners, no sync delays. Every tap responds instantly because your data lives right here.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--wf-emerald)]/10 text-sm">🌱</div>
                <div>
                  <p className="text-xs font-semibold text-white">Built for Real Habits</p>
                  <p className="text-[11px] leading-relaxed text-[var(--wf-text-muted)]">
                    Daily Allowance. No-Spend Streaks. Smart categories. Wealth isn't built in a day — it's built one good decision at a time.
                  </p>
                </div>
              </div>
            </div>

            {/* Quote — fixed attribution */}
            <div className="mt-4 rounded-xl border border-[var(--wf-emerald)]/15 bg-[var(--wf-emerald)]/5 p-3 text-center">
              <p className="text-xs font-medium text-[var(--wf-emerald)]">
                "The best time to plant a tree was 20 years ago. The second best time is now."
              </p>
              <p className="mt-1 text-[10px] text-[var(--wf-text-muted)]">— Chinese Proverb</p>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span className="text-xs font-bold uppercase tracking-wider text-red-400">Danger Zone</span>
            </div>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full rounded-xl border border-red-500/30 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
            >
              🗑️ Reset Everything
            </button>
          </div>
        </div>

        <div className="h-3" />
      </div>

      {/* Beautiful reset confirmation — replaces the old inline confirm UI */}
      <ConfirmModal
        open={showResetConfirm}
        title="Reset Everything?"
        message="This will permanently delete all your transactions, categories, and settings. This cannot be undone. Consider exporting a backup first."
        confirmLabel="Yes, Delete All"
        cancelLabel="Cancel"
        danger
        onConfirm={handleReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}
