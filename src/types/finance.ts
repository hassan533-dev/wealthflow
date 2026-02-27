export type AppSettings = {
  id: "singleton";
  onboarded: boolean;
  totalBalance: number;
  currency: string;
  hideBalance: boolean;
  darkMode: boolean;
  monthlyIncome: number;
  monthlySpend: number;
  updatedAt: string;
  lastSpendDate: string;
  lastWantSpendDate: string;
  noSpendStreak: number;
  dailyAllowanceBase: number;
  dailyCarryOver: number;
};

export type Category = {
  id?: number;
  name: string;
  icon: string;
  color: string;
  limit: number;
  spent: number;
  createdAt: string;
};

export type Transaction = {
  id?: number;
  categoryId: number;
  amount: number;
  note: string;
  isNeed: boolean;
  createdAt: string;
};
