
import localforage from 'localforage';
import { Budget, Expense } from '../types';

localforage.config({
  name: 'SeveralApp',
  storeName: 'data_store',
  description: 'Storage for Several Budget Manager',
});

const BUDGETS_KEY = 'budgets';
const EXPENSES_KEY = 'expenses';
const MANUAL_BUDGET_ORDER_KEY = 'manualBudgetOrder';
const ZERO_BALANCE_COLOR_KEY = 'zeroBalanceColor';

export const getBudgets = async (): Promise<Budget[]> => {
  const budgets = await localforage.getItem<Budget[]>(BUDGETS_KEY);
  return budgets || [];
};

export const saveBudgets = async (budgets: Budget[]): Promise<Budget[]> => {
  return localforage.setItem<Budget[]>(BUDGETS_KEY, budgets);
};

export const getExpenses = async (): Promise<Expense[]> => {
  const expenses = await localforage.getItem<Expense[]>(EXPENSES_KEY);
  return expenses || [];
};

export const saveExpenses = async (expenses: Expense[]): Promise<Expense[]> => {
  return localforage.setItem<Expense[]>(EXPENSES_KEY, expenses);
};

export const getManualBudgetOrder = async (): Promise<string[]> => {
    const order = await localforage.getItem<string[]>(MANUAL_BUDGET_ORDER_KEY);
    return order || [];
};

export const saveManualBudgetOrder = async (order: string[]): Promise<string[]> => {
    return localforage.setItem<string[]>(MANUAL_BUDGET_ORDER_KEY, order);
};

export const getZeroBalanceColor = async (): Promise<string | null> => {
    return localforage.getItem<string>(ZERO_BALANCE_COLOR_KEY);
};

export const saveZeroBalanceColor = async (color: string): Promise<string> => {
    return localforage.setItem<string>(ZERO_BALANCE_COLOR_KEY, color);
};

export const clearAllData = async (): Promise<void> => {
  await localforage.removeItem(BUDGETS_KEY);
  await localforage.removeItem(EXPENSES_KEY);
  await localforage.removeItem(MANUAL_BUDGET_ORDER_KEY);
  await localforage.removeItem(ZERO_BALANCE_COLOR_KEY);
};
