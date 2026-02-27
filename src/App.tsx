import { useEffect, useState } from "react";
import { AddTransactionSheet } from "./components/AddTransactionSheet";
import { CreateCategorySheet } from "./components/CreateCategorySheet";
import { Dashboard } from "./components/Dashboard";
import { OnboardingPager } from "./components/OnboardingPager";
import { SettingsSheet } from "./components/SettingsSheet";
import {
  adjustBalance,
  addTransaction,
  bootstrapFinanceData,
  createCategory,
  deleteTransaction,
  finishOnboarding,
  getDashboardData,
  getTransactionsWithCategory,
  recalculateStreak,
  resetAllData,
  updateSettings,
} from "./db/localDb";
import type { AppSettings, Category, Transaction } from "./types/finance";

type EnrichedTransaction = Transaction & {
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
};

export function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<EnrichedTransaction[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const refreshDashboard = async () => {
    const data = await getDashboardData();
    const txns = await getTransactionsWithCategory();
    setSettings(data.settings);
    setCategories(data.categories);
    setTransactions(txns);
  };

  useEffect(() => {
    const init = async () => {
      await bootstrapFinanceData();
      await recalculateStreak();
      await refreshDashboard();
      setIsLoading(false);
    };

    void init();
  }, []);

  useEffect(() => {
    if (!settings) {
      return;
    }
    document.body.dataset.theme = settings.darkMode ? "dark" : "light";
  }, [settings]);

  if (isLoading || !settings) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-2xl border border-white/10 bg-[var(--wf-surface)] px-5 py-4 text-sm text-[var(--wf-text-muted)]">
          Loading your local wallet...
        </div>
      </div>
    );
  }

  if (!settings.onboarded) {
    return (
      <OnboardingPager
        onComplete={async (balance, currency, monthlyIncome) => {
          await finishOnboarding(balance, currency, monthlyIncome);
          await refreshDashboard();
        }}
      />
    );
  }

  return (
    <>
      <Dashboard
        settings={settings}
        categories={categories}
        transactions={transactions}
        onCategoryTap={(category) => setActiveCategory(category)}
        onCreateCategory={() => setShowCreateCategory(true)}
        onOpenSettings={() => setShowSettings(true)}
        onTogglePrivacy={async () => {
          await updateSettings({ hideBalance: !settings.hideBalance });
          await refreshDashboard();
        }}
        onDeleteTransaction={async (id) => {
          await deleteTransaction(id);
          await refreshDashboard();
        }}
      />

      <AddTransactionSheet
        category={activeCategory}
        currency={settings.currency}
        onClose={() => setActiveCategory(null)}
        onSubmit={async (amount, note, isNeed) => {
          if (!activeCategory?.id) {
            return;
          }
          await addTransaction(activeCategory.id, amount, note, isNeed);
          await refreshDashboard();
          setActiveCategory(null);
        }}
      />

      <CreateCategorySheet
        open={showCreateCategory}
        onClose={() => setShowCreateCategory(false)}
        currency={settings.currency}
        onCreate={async (input) => {
          await createCategory(input);
          await refreshDashboard();
          setShowCreateCategory(false);
        }}
      />

      <SettingsSheet
        open={showSettings}
        settings={settings}
        onClose={() => setShowSettings(false)}
        onSavePreferences={async (input) => {
          await updateSettings(input);
          await refreshDashboard();
        }}
        onAdjustBalance={async (amount) => {
          await adjustBalance(amount);
          await refreshDashboard();
        }}
        onReset={async () => {
          await resetAllData();
          setActiveCategory(null);
          setShowCreateCategory(false);
          setShowSettings(false);
          await refreshDashboard();
        }}
      />
    </>
  );
}
