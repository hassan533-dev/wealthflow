import { useEffect, useRef, useState } from "react";
import { AddTransactionSheet } from "./components/AddTransactionSheet";
import { CreateCategorySheet } from "./components/CreateCategorySheet";
import { Dashboard } from "./components/Dashboard";
import { InstallPrompt } from "./components/InstallPrompt";
import { OnboardingPager } from "./components/OnboardingPager";
import { SettingsSheet } from "./components/SettingsSheet";
import { UndoToast } from "./components/UndoToast";
import {
  adjustBalance,
  addTransaction,
  bootstrapFinanceData,
  createCategory,
  deleteCategory,
  deleteTransaction,
  finishOnboarding,
  getDashboardData,
  getTransactionsWithCategory,
  recalculateStreak,
  resetAllData,
  updateSettings,
  updateTransaction,
} from "./db/localDb";
import type { AppSettings, Category, Transaction } from "./types/finance";

type EnrichedTransaction = Transaction & {
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
};

type EditData = {
  id: number;
  amount: number;
  note: string;
  isNeed: boolean;
};

type UndoState = {
  transactionId: number;
  message: string;
};

export function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<EnrichedTransaction[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Edit transaction state
  const [editData, setEditData] = useState<EditData | null>(null);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  // Undo toast state
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const undoDismissRef = useRef<(() => void) | null>(null);

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
    if (!settings) return;
    document.body.dataset.theme = settings.darkMode ? "dark" : "light";
  }, [settings]);

  // ── Loading screen ─────────────────────────────────────────
  if (isLoading || !settings) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
            style={{ background: "rgba(46,204,113,0.15)" }}
          >
            💰
          </div>
          <div className="rounded-2xl border border-white/10 bg-[var(--wf-surface)] px-5 py-4 text-sm text-[var(--wf-text-muted)]">
            Loading your wallet...
          </div>
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

  // ── Handle add transaction (with undo support) ─────────────
  const handleSubmitTransaction = async (amount: number, note: string, isNeed: boolean) => {
    if (editData && editCategory) {
      // Edit mode
      await updateTransaction(editData.id, amount, note, isNeed);
      await refreshDashboard();
      setEditData(null);
      setEditCategory(null);
      setActiveCategory(null);
    } else if (activeCategory?.id) {
      // Add mode
      const newId = await addTransaction(activeCategory.id, amount, note, isNeed);
      await refreshDashboard();
      setActiveCategory(null);

      // Show undo toast
      setUndoState({
        transactionId: newId,
        message: `${activeCategory.icon} ${activeCategory.name} — ${isNeed ? "Need" : "Want"} added`,
      });
    }
  };

  // ── Handle undo ────────────────────────────────────────────
  const handleUndo = async () => {
    if (!undoState) return;
    setUndoState(null);
    await deleteTransaction(undoState.transactionId);
    await refreshDashboard();
  };

  // ── Handle edit transaction ────────────────────────────────
  const handleEditTransaction = (transaction: EnrichedTransaction) => {
    if (!transaction.id) return;
    const cat = categories.find((c) => c.id === transaction.categoryId) ?? null;
    setEditData({
      id: transaction.id,
      amount: transaction.amount,
      note: transaction.note,
      isNeed: transaction.isNeed,
    });
    setEditCategory(cat);
    setActiveCategory(cat);
  };

  // ── Handle delete category ─────────────────────────────────
  const handleDeleteCategory = async (categoryId: number) => {
    await deleteCategory(categoryId);
    await refreshDashboard();
  };

  return (
    <>
      <Dashboard
        settings={settings}
        categories={categories}
        transactions={transactions}
        onCategoryTap={(category) => {
          setEditData(null);
          setEditCategory(null);
          setActiveCategory(category);
        }}
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
        onEditTransaction={handleEditTransaction}
        onDeleteCategory={handleDeleteCategory}
      />

      <AddTransactionSheet
        category={activeCategory}
        currency={settings.currency}
        editData={editData}
        onClose={() => {
          setActiveCategory(null);
          setEditData(null);
          setEditCategory(null);
        }}
        onSubmit={handleSubmitTransaction}
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
          setEditData(null);
          setEditCategory(null);
          setUndoState(null);
          await refreshDashboard();
        }}
      />

      {/* Install prompt */}
      <InstallPrompt />

      {/* Undo toast */}
      {undoState && (
        <UndoToast
          message={undoState.message}
          onUndo={handleUndo}
          onDismiss={() => setUndoState(null)}
        />
      )}
    </>
  );
}
