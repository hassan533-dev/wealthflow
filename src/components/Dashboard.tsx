import { useState } from "react";
import type { AppSettings, Category, Transaction } from "../types/finance";
import { ConfirmModal } from "./ConfirmModal";
import { HistorySection } from "./HistorySection";

type EnrichedTransaction = Transaction & {
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
};

type DashboardProps = {
  settings: AppSettings;
  categories: Category[];
  transactions: EnrichedTransaction[];
  onCategoryTap: (category: Category) => void;
  onCreateCategory: () => void;
  onOpenSettings: () => void;
  onTogglePrivacy: () => void;
  onDeleteTransaction: (id: number) => Promise<void>;
  onEditTransaction: (transaction: EnrichedTransaction) => void;
  onDeleteCategory: (categoryId: number) => Promise<void>;
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

function getDaysRemainingInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate() + 1;
}

function getDailyAllowance(settings: AppSettings): number {
  const daysLeft = getDaysRemainingInMonth();
  const remaining = settings.monthlyIncome - settings.monthlySpend;
  if (remaining <= 0 || daysLeft <= 0) return 0;
  const base = remaining / daysLeft;
  return Number((base + settings.dailyCarryOver).toFixed(2));
}

function getStreakFlame(streak: number): string {
  if (streak === 0) return "";
  if (streak < 3) return "🔥";
  if (streak < 7) return "🔥🔥";
  if (streak < 14) return "🔥🔥🔥";
  return "🔥🔥🔥🔥";
}

function getStreakMessage(streak: number): string {
  if (streak === 0) return "Start saving today — skip the extras!";
  if (streak === 1) return "1 day strong! Keep going!";
  if (streak < 3) return `${streak} days! You're building momentum!`;
  if (streak < 7) return `${streak} day streak! You're on fire!`;
  if (streak < 14) return `${streak} days! Incredible discipline! 💪`;
  if (streak < 30) return `${streak} days! You're a saving machine! 🏆`;
  return `${streak} days! LEGENDARY streak! 👑`;
}

function getStreakGrade(streak: number): { label: string; color: string } {
  if (streak === 0) return { label: "Start", color: "#64748b" };
  if (streak < 3) return { label: "Warming Up", color: "#f97316" };
  if (streak < 7) return { label: "On Fire", color: "#ef4444" };
  if (streak < 14) return { label: "Blazing", color: "#eab308" };
  if (streak < 30) return { label: "Elite", color: "#8b5cf6" };
  return { label: "Legend", color: "#2ecc71" };
}

// ── Health Score ────────────────────────────────────────────────
function calcHealthScore(settings: AppSettings, transactions: EnrichedTransaction[]): number {
  let score = 0;

  // Budget control (0–40 pts)
  const spendRatio = settings.monthlyIncome > 0 ? settings.monthlySpend / settings.monthlyIncome : 1;
  if (spendRatio <= 0.5) score += 40;
  else if (spendRatio <= 0.7) score += 30;
  else if (spendRatio <= 0.9) score += 20;
  else if (spendRatio <= 1.0) score += 10;

  // No-spend streak (0–30 pts)
  const streak = settings.noSpendStreak;
  if (streak >= 14) score += 30;
  else if (streak >= 7) score += 25;
  else if (streak >= 3) score += 15;
  else if (streak >= 1) score += 8;

  // Savings rate (0–30 pts)
  const savingsRate = settings.monthlyIncome > 0
    ? (settings.monthlyIncome - settings.monthlySpend) / settings.monthlyIncome
    : 0;
  if (savingsRate >= 0.3) score += 30;
  else if (savingsRate >= 0.2) score += 22;
  else if (savingsRate >= 0.1) score += 15;
  else if (savingsRate >= 0) score += 5;

  // Needs vs wants bonus (up to 0 extra — just validates existing)
  const wantCount = transactions.filter(t => !t.isNeed).length;
  const needCount = transactions.filter(t => t.isNeed).length;
  const totalTxns = wantCount + needCount;
  if (totalTxns > 0 && needCount / totalTxns >= 0.8) score = Math.min(100, score + 5);

  return Math.min(100, Math.max(0, score));
}

function getScoreLabel(score: number): { label: string; color: string; emoji: string } {
  if (score >= 80) return { label: "Excellent", color: "#2ecc71", emoji: "🌟" };
  if (score >= 60) return { label: "Good", color: "#2ecc71", emoji: "💪" };
  if (score >= 40) return { label: "Fair", color: "#eab308", emoji: "📊" };
  if (score >= 20) return { label: "Warning", color: "#f97316", emoji: "⚠️" };
  return { label: "Critical", color: "#ef4444", emoji: "🔴" };
}

// ── Achievement Badges ──────────────────────────────────────────
type Badge = { id: string; icon: string; name: string; desc: string; unlocked: boolean };

function computeBadges(settings: AppSettings, transactions: EnrichedTransaction[], categoryCount: number): Badge[] {
  const savingsRate = settings.monthlyIncome > 0
    ? (settings.monthlyIncome - settings.monthlySpend) / settings.monthlyIncome
    : 0;

  return [
    {
      id: "first",
      icon: "🌱",
      name: "First Step",
      desc: "Track your first expense",
      unlocked: transactions.length >= 1,
    },
    {
      id: "week",
      icon: "🔥",
      name: "Week Warrior",
      desc: "7-day no-spend streak",
      unlocked: settings.noSpendStreak >= 7,
    },
    {
      id: "budget",
      icon: "💎",
      name: "Budget Boss",
      desc: "Stay under monthly budget",
      unlocked: settings.monthlyIncome > 0 && settings.monthlySpend < settings.monthlyIncome,
    },
    {
      id: "saver",
      icon: "💰",
      name: "Saver Pro",
      desc: "Save 20%+ of income",
      unlocked: savingsRate >= 0.2,
    },
    {
      id: "tracker",
      icon: "📊",
      name: "Power Tracker",
      desc: "Log 20+ transactions",
      unlocked: transactions.length >= 20,
    },
    {
      id: "organizer",
      icon: "📁",
      name: "Organizer",
      desc: "Create 5+ categories",
      unlocked: categoryCount >= 5,
    },
    {
      id: "legend",
      icon: "🏆",
      name: "Legend",
      desc: "30-day no-spend streak",
      unlocked: settings.noSpendStreak >= 30,
    },
  ];
}

// ── Spending Donut Chart ────────────────────────────────────────
function SpendingDonut({ categories }: { categories: Category[] }) {
  const active = categories.filter((c) => c.spent > 0);
  if (active.length === 0) return null;

  const total = active.reduce((s, c) => s + c.spent, 0);
  const r = 38;
  const circ = 2 * Math.PI * r;

  const segments: { cat: Category; portion: number; offset: number }[] = [];
  let cumOffset = 0;
  for (const cat of active) {
    const portion = (cat.spent / total) * circ;
    segments.push({ cat, portion, offset: cumOffset });
    cumOffset += portion;
  }

  return (
    <svg
      viewBox="0 0 100 100"
      className="h-20 w-20 shrink-0"
      style={{ transform: "rotate(-90deg)" }}
    >
      {segments.map(({ cat, portion, offset }) => (
        <circle
          key={cat.id}
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={cat.color}
          strokeWidth="16"
          strokeDasharray={`${portion} ${circ - portion}`}
          strokeDashoffset={-offset}
        />
      ))}
      <circle cx="50" cy="50" r="28" fill="var(--wf-surface-elevated)" />
    </svg>
  );
}

export function Dashboard({
  settings,
  categories,
  transactions,
  onCategoryTap,
  onCreateCategory,
  onOpenSettings,
  onTogglePrivacy,
  onDeleteTransaction,
  onEditTransaction,
  onDeleteCategory,
}: DashboardProps) {
  const dailyAllowance = getDailyAllowance(settings);
  const streakGrade = getStreakGrade(settings.noSpendStreak);
  const healthScore = calcHealthScore(settings, transactions);
  const scoreLabel = getScoreLabel(healthScore);
  const badges = computeBadges(settings, transactions, categories.length);
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);

  const spendingCats = categories.filter((c) => c.spent > 0);
  const totalSpent = spendingCats.reduce((s, c) => s + c.spent, 0);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 px-4 py-6 sm:gap-5 sm:px-6 lg:px-10">

      {/* ── Header ───────────────────────────────────────────── */}
      <header className="fade-rise rounded-3xl border border-white/10 bg-[var(--wf-surface)] p-5 shadow-2xl shadow-black/30 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--wf-text-muted)]">
            WealthFlow
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onTogglePrivacy}
              className="rounded-xl border border-white/10 bg-[var(--wf-surface-elevated)] px-3 py-2 text-xs font-semibold text-[var(--wf-text-muted)] transition hover:border-white/25"
              title={settings.hideBalance ? "Show balances" : "Hide balances"}
            >
              {settings.hideBalance ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <button
              onClick={onOpenSettings}
              className="rounded-xl border border-white/10 bg-[var(--wf-surface-elevated)] px-3 py-2 text-xs font-semibold text-[var(--wf-text-muted)] transition hover:border-white/25"
              title="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Balance */}
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--wf-text-muted)]">Total Balance</p>
        <h1 className="mt-2 text-4xl font-bold text-[var(--wf-emerald)] sm:text-5xl">
          {settings.hideBalance ? "• • • • •" : formatMoney(settings.totalBalance, settings.currency)}
        </h1>

        {/* Health Score row */}
        {settings.monthlyIncome > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--wf-text-muted)]">Health Score</span>
              <span className="text-sm font-bold" style={{ color: scoreLabel.color }}>
                {healthScore} {scoreLabel.emoji}
              </span>
              <span className="text-xs font-medium" style={{ color: scoreLabel.color }}>
                {scoreLabel.label}
              </span>
            </div>
            <div className="h-1.5 flex-1 rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${healthScore}%`, backgroundColor: scoreLabel.color }}
              />
            </div>
          </div>
        )}
      </header>

      {/* ── Daily Allowance + Streak ──────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Daily Allowance Card */}
        <div className="fade-rise rounded-3xl border border-white/10 bg-[var(--wf-surface)] p-5 shadow-xl shadow-black/20 [animation-delay:100ms]">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-lg">💰</span>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--wf-text-muted)]">
              Daily Allowance
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            {settings.hideBalance ? "• • •" : formatMoney(Math.max(0, dailyAllowance), settings.currency)}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[var(--wf-text-muted)]">
            {dailyAllowance > 0
              ? "You can safely spend this much today"
              : "You've exceeded your monthly budget"}
          </p>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-[var(--wf-text-muted)]/60">
            <span className="rounded-md bg-[var(--wf-surface-elevated)] px-2 py-1">
              {getDaysRemainingInMonth()} days left
            </span>
            <span className="rounded-md bg-[var(--wf-surface-elevated)] px-2 py-1">
              {settings.hideBalance
                ? "***"
                : `${formatMoney(Math.max(0, settings.monthlyIncome - settings.monthlySpend), settings.currency)} remaining`}
            </span>
          </div>
        </div>

        {/* No-Spend Streak Card */}
        <div className="fade-rise rounded-3xl border border-white/10 bg-[var(--wf-surface)] p-5 shadow-xl shadow-black/20 [animation-delay:180ms]">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{settings.noSpendStreak > 0 ? "🔥" : "❄️"}</span>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--wf-text-muted)]">
                No-Spend Streak
              </p>
            </div>
            <span
              className="rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: `${streakGrade.color}20`, color: streakGrade.color }}
            >
              {streakGrade.label}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-white sm:text-4xl">
              {settings.noSpendStreak}
            </span>
            <span className="text-base text-[var(--wf-text-muted)]">
              {settings.noSpendStreak === 1 ? "day" : "days"}
            </span>
            {settings.noSpendStreak > 0 && (
              <span className="text-xl">{getStreakFlame(settings.noSpendStreak)}</span>
            )}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[var(--wf-text-muted)]">
            {getStreakMessage(settings.noSpendStreak)}
          </p>
          <div className="mt-3">
            <div className="flex gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    i < Math.min(settings.noSpendStreak, 7)
                      ? "bg-[var(--wf-emerald)]"
                      : "bg-white/10"
                  }`}
                />
              ))}
            </div>
            <p className="mt-1.5 text-[10px] text-[var(--wf-text-muted)]/50">
              Only "want" purchases break the streak
            </p>
          </div>
        </div>
      </div>

      {/* ── Achievement Badges ────────────────────────────────── */}
      <div className="fade-rise rounded-3xl border border-white/10 bg-[var(--wf-surface)] p-5 shadow-xl shadow-black/20 [animation-delay:220ms]">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🏅</span>
            <h2 className="text-sm font-semibold text-white">Achievements</h2>
          </div>
          <span className="text-xs text-[var(--wf-text-muted)]">
            {unlockedCount}/{badges.length} unlocked
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`group relative flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all ${
                badge.unlocked
                  ? "border-white/15 bg-[var(--wf-surface-elevated)]"
                  : "border-white/5 bg-[var(--wf-surface-elevated)]/50 opacity-40 grayscale"
              }`}
              style={{ minWidth: 72 }}
            >
              <span className="text-2xl">{badge.icon}</span>
              <span className="text-center text-[10px] font-semibold leading-tight text-[var(--wf-text-muted)]">
                {badge.name}
              </span>
              {badge.unlocked && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--wf-emerald)] text-[8px] text-black font-bold">
                  ✓
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Category Cards ────────────────────────────────────── */}
      <section className="fade-rise rounded-3xl border border-white/10 bg-[var(--wf-surface)] p-5 shadow-xl shadow-black/20 [animation-delay:240ms]">
        {/* Section header with donut chart */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Spending Categories</h2>
              {spendingCats.length > 0 && !settings.hideBalance && (
                <p className="mt-0.5 text-xs text-[var(--wf-text-muted)]">
                  Total spent: {formatMoney(totalSpent, settings.currency)}
                </p>
              )}
            </div>
            {spendingCats.length > 1 && (
              <SpendingDonut categories={categories} />
            )}
          </div>
          <button
            onClick={onCreateCategory}
            className="group flex items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--wf-emerald)]/50 bg-[var(--wf-emerald)]/5 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[var(--wf-emerald)] transition hover:border-[var(--wf-emerald)] hover:bg-[var(--wf-emerald)]/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition group-hover:rotate-90" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create Category
          </button>
        </div>

        {/* Empty state */}
        {categories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 text-4xl">📁</div>
            <p className="text-sm font-medium text-[var(--wf-text-muted)]">No categories yet</p>
            <p className="mt-1 text-xs text-[var(--wf-text-muted)]/60">Create your first category to start tracking ✨</p>
          </div>
        )}

        <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const progress = category.limit > 0 ? Math.min((category.spent / category.limit) * 100, 100) : 0;
            const isOver = progress >= 100;
            const isWarning = progress >= 80 && progress < 100;
            return (
              <div
                key={category.id}
                className="rounded-2xl border border-white/10 bg-[var(--wf-surface-elevated)] transition hover:-translate-y-0.5 hover:border-white/30"
              >
                {/* Main tappable area */}
                <button
                  onClick={() => onCategoryTap(category)}
                  className="w-full p-3 text-left sm:p-4"
                >
                  <div className="mb-2 flex items-center gap-2 sm:mb-3">
                    <span
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base sm:h-11 sm:w-11"
                      style={{ backgroundColor: `${category.color}22`, color: category.color }}
                    >
                      {category.icon}
                    </span>
                    {/* Budget warning badge */}
                    {isOver && (
                      <span className="rounded-md bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
                        OVER
                      </span>
                    )}
                    {isWarning && (
                      <span className="rounded-md bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-bold text-orange-400">
                        ⚠️
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm font-semibold text-white sm:text-base">{category.name}</p>
                  <p className="mt-0.5 truncate text-xs text-[var(--wf-text-muted)] sm:mt-1 sm:text-sm">
                    {settings.hideBalance
                      ? "***** / *****"
                      : `${formatMoney(category.spent, settings.currency)} / ${formatMoney(category.limit, settings.currency)}`}
                  </p>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 sm:mt-3 sm:h-2">
                    <div
                      className={`h-full rounded-full transition-all ${isOver ? "animate-pulse" : ""}`}
                      style={{
                        width: `${progress}%`,
                        backgroundColor: isOver ? "#f43f5e" : isWarning ? "#f97316" : category.color,
                      }}
                    />
                  </div>
                </button>

                {/* Delete row — always visible, separated from tap area */}
                <div className="border-t border-white/5 px-3 py-1.5 sm:px-4">
                  <button
                    onClick={() => setDeletingCategoryId(category.id!)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1 text-[10px] font-semibold text-[var(--wf-text-muted)]/50 transition hover:bg-red-500/10 hover:text-red-400 active:bg-red-500/15"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── History Section ───────────────────────────────────── */}
      <HistorySection
        transactions={transactions}
        currency={settings.currency}
        hideBalance={settings.hideBalance}
        onDelete={onDeleteTransaction}
        onEdit={onEditTransaction}
      />

      {/* Bottom spacer */}
      <div className="h-4" />

      {/* Delete Category Confirmation */}
      <ConfirmModal
        open={deletingCategoryId !== null}
        title="Delete Category?"
        message="This will permanently delete the category and all its transactions. The total spent amount will be refunded to your balance."
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          if (deletingCategoryId !== null) {
            await onDeleteCategory(deletingCategoryId);
            setDeletingCategoryId(null);
          }
        }}
        onCancel={() => setDeletingCategoryId(null)}
      />
    </div>
  );
}
