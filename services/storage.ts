
import localforage from 'localforage';
import { Budget, Expense } from '../types';

localforage.config({
  name: 'SeveralApp',
  storeName: 'data_store',
  description: 'Storage for Several Budget Manager',
});

const BUDGETS_KEY = 'budgets';
const EXPENSES_KEY = 'expenses';

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

export const clearAllData = async (): Promise<void> => {
  await localforage.removeItem(BUDGETS_KEY);
  await localforage.removeItem(EXPENSES_KEY);
};
