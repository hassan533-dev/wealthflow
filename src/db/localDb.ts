import Dexie, { type Table } from "dexie";
import type { AppSettings, Category, Transaction } from "../types/finance";

class WealthFlowDB extends Dexie {
  settings!: Table<AppSettings, string>;
  categories!: Table<Category, number>;
  transactions!: Table<Transaction, number>;

  constructor() {
    super("wealthflow-local-db");
    this.version(1).stores({
      settings: "id",
      categories: "++id, name, createdAt",
      transactions: "++id, categoryId, createdAt",
    });
    this.version(2)
      .stores({
        settings: "id",
        categories: "++id, name, createdAt",
        transactions: "++id, categoryId, createdAt",
      })
      .upgrade(async (tx) => {
        const settingsTable = tx.table("settings");
        const existing = (await settingsTable.get("singleton")) as Partial<AppSettings> | undefined;
        if (existing) {
          await settingsTable.put({
            id: "singleton",
            onboarded: existing.onboarded ?? false,
            totalBalance: existing.totalBalance ?? 0,
            currency: existing.currency ?? "USD",
            hideBalance: existing.hideBalance ?? false,
            darkMode: existing.darkMode ?? true,
            monthlyIncome: existing.monthlyIncome ?? 0,
            monthlySpend: existing.monthlySpend ?? 0,
            updatedAt: new Date().toISOString(),
            lastSpendDate: "",
            lastWantSpendDate: "",
            noSpendStreak: 0,
            dailyAllowanceBase: 0,
            dailyCarryOver: 0,
          });
        }
      });
    this.version(3)
      .stores({
        settings: "id",
        categories: "++id, name, createdAt",
        transactions: "++id, categoryId, createdAt",
      })
      .upgrade(async (tx) => {
        const settingsTable = tx.table("settings");
        const existing = (await settingsTable.get("singleton")) as Partial<AppSettings> | undefined;
        if (existing) {
          await settingsTable.put({
            ...existing,
            id: "singleton",
            lastSpendDate: existing.lastSpendDate ?? "",
            lastWantSpendDate: existing.lastWantSpendDate ?? "",
            noSpendStreak: existing.noSpendStreak ?? 0,
            dailyAllowanceBase: existing.dailyAllowanceBase ?? 0,
            dailyCarryOver: existing.dailyCarryOver ?? 0,
            updatedAt: new Date().toISOString(),
          });
        }
      });
    this.version(4)
      .stores({
        settings: "id",
        categories: "++id, name, createdAt",
        transactions: "++id, categoryId, createdAt",
      })
      .upgrade(async (tx) => {
        const settingsTable = tx.table("settings");
        const existing = (await settingsTable.get("singleton")) as Partial<AppSettings> | undefined;
        if (existing) {
          await settingsTable.put({
            ...existing,
            id: "singleton",
            lastWantSpendDate: existing.lastWantSpendDate ?? existing.lastSpendDate ?? "",
            updatedAt: new Date().toISOString(),
          });
        }
      });
  }
}

export const db = new WealthFlowDB();

const defaultCategories: Omit<Category, "id">[] = [
  { name: "Food", icon: "🍔", color: "#f97316", limit: 450, spent: 0, createdAt: new Date().toISOString() },
  { name: "Travel", icon: "✈️", color: "#38bdf8", limit: 300, spent: 0, createdAt: new Date().toISOString() },
  { name: "Bills", icon: "📄", color: "#f43f5e", limit: 520, spent: 0, createdAt: new Date().toISOString() },
  { name: "Health", icon: "💊", color: "#a3e635", limit: 280, spent: 0, createdAt: new Date().toISOString() },
  { name: "Shopping", icon: "🛒", color: "#8b5cf6", limit: 350, spent: 0, createdAt: new Date().toISOString() },
  { name: "Entertainment", icon: "🎬", color: "#06b6d4", limit: 200, spent: 0, createdAt: new Date().toISOString() },
];

const defaultSettings: AppSettings = {
  id: "singleton",
  onboarded: false,
  totalBalance: 0,
  currency: "USD",
  hideBalance: false,
  darkMode: true,
  monthlyIncome: 0,
  monthlySpend: 0,
  updatedAt: new Date().toISOString(),
  lastSpendDate: "",
  lastWantSpendDate: "",
  noSpendStreak: 0,
  dailyAllowanceBase: 0,
  dailyCarryOver: 0,
};

export async function bootstrapFinanceData() {
  const settings = await db.settings.get("singleton");
  if (!settings) {
    await db.settings.put(defaultSettings);
  } else {
    await db.settings.put({
      ...defaultSettings,
      ...settings,
      currency: settings.currency || "USD",
      hideBalance: settings.hideBalance ?? false,
      darkMode: settings.darkMode ?? true,
      lastSpendDate: settings.lastSpendDate ?? "",
      lastWantSpendDate: settings.lastWantSpendDate ?? "",
      noSpendStreak: settings.noSpendStreak ?? 0,
      dailyAllowanceBase: settings.dailyAllowanceBase ?? 0,
      dailyCarryOver: settings.dailyCarryOver ?? 0,
      updatedAt: new Date().toISOString(),
    });
  }

  const categoryCount = await db.categories.count();
  if (categoryCount === 0) {
    await db.categories.bulkAdd(defaultCategories);
  }
}

export async function getDashboardData() {
  const settings = await db.settings.get("singleton");
  const categories = await db.categories.toArray();

  if (!settings) {
    throw new Error("Finance settings were not initialized.");
  }

  return {
    settings,
    categories: categories.sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export async function getTransactions(): Promise<Transaction[]> {
  return db.transactions.orderBy("createdAt").reverse().toArray();
}

export async function getTransactionsWithCategory(): Promise<
  (Transaction & { categoryName: string; categoryIcon: string; categoryColor: string })[]
> {
  const transactions = await db.transactions.orderBy("createdAt").reverse().toArray();
  const categories = await db.categories.toArray();
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return transactions.map((t) => {
    const cat = categoryMap.get(t.categoryId);
    return {
      ...t,
      categoryName: cat?.name ?? "Unknown",
      categoryIcon: cat?.icon ?? "?",
      categoryColor: cat?.color ?? "#666",
    };
  });
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDaysRemainingInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate() + 1;
}

export async function finishOnboarding(totalBalance: number, currency: string, monthlyIncome: number) {
  const settings = await db.settings.get("singleton");
  const daysLeft = getDaysRemainingInMonth();
  const dailyBase = monthlyIncome > 0 ? monthlyIncome / daysLeft : 0;

  await db.settings.put({
    ...defaultSettings,
    ...settings,
    onboarded: true,
    totalBalance,
    monthlyIncome,
    currency: currency.trim().toUpperCase() || "USD",
    dailyAllowanceBase: Number(dailyBase.toFixed(2)),
    dailyCarryOver: 0,
    noSpendStreak: 0,
    lastSpendDate: "",
    lastWantSpendDate: "",
    updatedAt: new Date().toISOString(),
  });
}

export async function addTransaction(categoryId: number, amount: number, note: string, isNeed: boolean) {
  const settings = await db.settings.get("singleton");
  const category = await db.categories.get(categoryId);

  if (!settings || !category) {
    throw new Error("Missing settings or category.");
  }

  const today = getToday();

  // Streak logic: only "want" purchases break the streak
  let newStreak = settings.noSpendStreak;
  let newLastWantSpendDate = settings.lastWantSpendDate;

  if (!isNeed) {
    // A "want" purchase always resets the streak to 0
    newStreak = 0;
    newLastWantSpendDate = today;
  }

  // Calculate carry-over for daily allowance
  const daysLeft = getDaysRemainingInMonth();
  const dailyBase = settings.monthlyIncome > 0 ? settings.monthlyIncome / daysLeft : 0;
  let newCarryOver = settings.dailyCarryOver;

  if (settings.lastSpendDate !== today) {
    // New day: any unspent allowance from yesterday carries over
    const todayAllowance = dailyBase + settings.dailyCarryOver;
    newCarryOver = todayAllowance - amount;
  } else {
    newCarryOver = newCarryOver - amount;
  }

  await db.transaction("rw", db.transactions, db.categories, db.settings, async () => {
    await db.transactions.add({
      categoryId,
      amount,
      note,
      isNeed,
      createdAt: new Date().toISOString(),
    });

    await db.categories.update(categoryId, {
      spent: Number((category.spent + amount).toFixed(2)),
    });

    await db.settings.put({
      ...settings,
      totalBalance: Number((settings.totalBalance - amount).toFixed(2)),
      monthlySpend: Number((settings.monthlySpend + amount).toFixed(2)),
      lastSpendDate: today,
      lastWantSpendDate: newLastWantSpendDate,
      noSpendStreak: newStreak,
      dailyCarryOver: Number(newCarryOver.toFixed(2)),
      updatedAt: new Date().toISOString(),
    });
  });
}

export async function recalculateStreak() {
  const settings = await db.settings.get("singleton");
  if (!settings) return;

  const today = getToday();
  const lastWantDate = settings.lastWantSpendDate;

  // If user never spent on wants, count from onboarding
  if (!lastWantDate) {
    // Check if there are any want transactions at all
    const allTxns = await db.transactions.toArray();
    const wantTxns = allTxns.filter((t) => !t.isNeed);
    if (wantTxns.length === 0 && settings.onboarded) {
      // No want spending ever — streak is days since updatedAt or 0
      const onboardDate = settings.updatedAt ? settings.updatedAt.slice(0, 10) : today;
      const diff = dateDiffDays(onboardDate, today);
      if (diff > 0 && settings.noSpendStreak !== diff) {
        await db.settings.put({
          ...settings,
          noSpendStreak: diff,
          updatedAt: new Date().toISOString(),
        });
      }
    }
    return;
  }

  if (lastWantDate === today) return; // Already spent on want today, streak is 0

  // Count days since last want spend (not including today since today isn't over)
  const diff = dateDiffDays(lastWantDate, today);

  if (diff > 0) {
    // Check if there have been any want transactions since lastWantSpendDate
    const transactionsSince = await db.transactions
      .where("createdAt")
      .above(lastWantDate + "T23:59:59.999Z")
      .toArray();

    const recentWants = transactionsSince.filter((t) => !t.isNeed);

    if (recentWants.length === 0 && settings.noSpendStreak !== diff) {
      // No wants since last recorded date — streak = days since then
      await db.settings.put({
        ...settings,
        noSpendStreak: diff,
        dailyCarryOver: Number(
          (settings.dailyCarryOver + settings.dailyAllowanceBase * (diff - (settings.noSpendStreak || 0))).toFixed(2)
        ),
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

function dateDiffDays(dateStrA: string, dateStrB: string): number {
  const a = new Date(dateStrA);
  const b = new Date(dateStrB);
  const diffTime = b.getTime() - a.getTime();
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
}

export async function createCategory(input: {
  name: string;
  color: string;
  icon: string;
  limit: number;
}) {
  return db.categories.add({
    ...input,
    spent: 0,
    createdAt: new Date().toISOString(),
  });
}

export async function updateSettings(input: Partial<Pick<AppSettings, "currency" | "hideBalance" | "darkMode" | "monthlyIncome">>) {
  const settings = await db.settings.get("singleton");
  if (!settings) {
    throw new Error("Missing settings.");
  }

  const newIncome = input.monthlyIncome ?? settings.monthlyIncome;
  const daysLeft = getDaysRemainingInMonth();
  const dailyBase = newIncome > 0 ? newIncome / daysLeft : 0;

  await db.settings.put({
    ...settings,
    ...input,
    currency: (input.currency ?? settings.currency).trim().toUpperCase() || "USD",
    dailyAllowanceBase: Number(dailyBase.toFixed(2)),
    updatedAt: new Date().toISOString(),
  });
}

export async function adjustBalance(amount: number) {
  const settings = await db.settings.get("singleton");
  if (!settings) {
    throw new Error("Missing settings.");
  }

  await db.settings.put({
    ...settings,
    totalBalance: Number((settings.totalBalance + amount).toFixed(2)),
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteTransaction(transactionId: number) {
  const transaction = await db.transactions.get(transactionId);
  if (!transaction) return;

  const settings = await db.settings.get("singleton");
  const category = await db.categories.get(transaction.categoryId);
  if (!settings) return;

  await db.transaction("rw", db.transactions, db.categories, db.settings, async () => {
    await db.transactions.delete(transactionId);

    if (category) {
      await db.categories.update(transaction.categoryId, {
        spent: Number(Math.max(0, category.spent - transaction.amount).toFixed(2)),
      });
    }

    await db.settings.put({
      ...settings,
      totalBalance: Number((settings.totalBalance + transaction.amount).toFixed(2)),
      monthlySpend: Number(Math.max(0, settings.monthlySpend - transaction.amount).toFixed(2)),
      updatedAt: new Date().toISOString(),
    });
  });
}

export async function resetAllData() {
  await db.transaction("rw", db.settings, db.categories, db.transactions, async () => {
    await db.transactions.clear();
    await db.categories.clear();
    await db.settings.clear();
    await db.settings.put({ ...defaultSettings, updatedAt: new Date().toISOString() });
    await db.categories.bulkAdd(defaultCategories.map((item) => ({ ...item, spent: 0 })));
  });
}
