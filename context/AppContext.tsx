import React, { createContext, useContext, useEffect, useReducer, ReactNode, useCallback, ReactElement } from 'react';
import { Budget, Expense, Theme, ToastMessage, ToastType, BudgetSortOrder, ExpenseSortOrder } from '../types';
import * as storage from '../services/storage';

interface AppState {
  budgets: Budget[];
  expenses: Expense[];
  loading: boolean;
  theme: Theme;
  toasts: ToastMessage[];
  lastDeletedExpense: Expense | null;
  budgetSortOrder: BudgetSortOrder;
  expenseSortOrder: ExpenseSortOrder;
}

type Action =
  | { type: 'SET_DATA'; payload: { budgets: Budget[]; expenses: Expense[] } }
  | { type: 'ADD_BUDGET'; payload: Budget }
  | { type: 'UPDATE_BUDGET'; payload: Budget }
  | { type: 'DELETE_BUDGET'; payload: string }
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'UPDATE_EXPENSE'; payload: Expense }
  | { type: 'DELETE_EXPENSE'; payload: string }
  | { type: 'UNDO_DELETE_EXPENSE' }
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'IMPORT_DATA', payload: { budgets: Budget[], expenses: Expense[] } }
  | { type: 'ADD_TOAST'; payload: ToastMessage }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'REASSIGN_AND_DELETE_BUDGET'; payload: { sourceBudgetId: string; targetBudgetId: string } }
  | { type: 'MOVE_EXPENSE'; payload: { expenseId: string; targetBudgetId: string } }
  | { type: 'SET_BUDGET_SORT_ORDER'; payload: BudgetSortOrder }
  | { type: 'SET_EXPENSE_SORT_ORDER'; payload: ExpenseSortOrder };


const initialState: AppState = {
  budgets: [],
  expenses: [],
  loading: true,
  theme: (localStorage.getItem('theme') as Theme) || 'system',
  toasts: [],
  lastDeletedExpense: null,
  budgetSortOrder: (localStorage.getItem('budgetSortOrder') as BudgetSortOrder) || 'date-desc',
  expenseSortOrder: (localStorage.getItem('expenseSortOrder') as ExpenseSortOrder) || 'date-desc',
};

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, ...action.payload, loading: false };
    case 'ADD_BUDGET':
      return { ...state, budgets: [...state.budgets, action.payload] };
    case 'UPDATE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.map((b) =>
          b.id === action.payload.id ? action.payload : b
        ),
      };
    case 'DELETE_BUDGET': {
      const budgetId = action.payload;
      return {
        ...state,
        budgets: state.budgets.filter((b) => b.id !== budgetId),
        expenses: state.expenses.filter((e) => e.presupuestoId !== budgetId),
      };
    }
    case 'ADD_EXPENSE':
      return { ...state, expenses: [...state.expenses, action.payload] };
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map((e) =>
          e.id === action.payload.id ? action.payload : e
        ),
      };
    case 'DELETE_EXPENSE': {
      const expenseToDelete = state.expenses.find(e => e.id === action.payload);
      return {
        ...state,
        expenses: state.expenses.filter((e) => e.id !== action.payload),
        lastDeletedExpense: expenseToDelete || null,
      };
    }
    case 'UNDO_DELETE_EXPENSE': {
      if (!state.lastDeletedExpense) return state;
      const newExpenses = [...state.expenses, state.lastDeletedExpense]
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      return { ...state, expenses: newExpenses, lastDeletedExpense: null };
    }
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_BUDGET_SORT_ORDER':
      return { ...state, budgetSortOrder: action.payload };
    case 'SET_EXPENSE_SORT_ORDER':
      return { ...state, expenseSortOrder: action.payload };
    case 'IMPORT_DATA':
      return { ...state, budgets: action.payload.budgets, expenses: action.payload.expenses };
    case 'ADD_TOAST':
      return { ...state, toasts: [action.payload, ...state.toasts.filter(t => t.onUndo)] }; // Allow only one undo toast
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    case 'REASSIGN_AND_DELETE_BUDGET': {
      const { sourceBudgetId, targetBudgetId } = action.payload;
      return {
        ...state,
        expenses: state.expenses.map(e =>
          e.presupuestoId === sourceBudgetId ? { ...e, presupuestoId: targetBudgetId } : e
        ),
        budgets: state.budgets.filter(b => b.id !== sourceBudgetId),
      };
    }
    case 'MOVE_EXPENSE': {
      const { expenseId, targetBudgetId } = action.payload;
      return {
        ...state,
        expenses: state.expenses.map(e =>
          e.id === expenseId ? { ...e, presupuestoId: targetBudgetId } : e
        ),
      };
    }
    default:
      return state;
  }
};

interface AppContextType extends AppState {
  dispatch: React.Dispatch<Action>;
  getBudgetExpenses: (budgetId: string) => Expense[];
  getBudgetRemaining: (budgetId: string) => number;
  addBudget: (budget: Omit<Budget, 'id' | 'fechaCreacion' | 'fechaModificacion'>) => void;
  updateBudget: (budget: Budget) => void;
  deleteBudget: (budgetId: string) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'fecha'>) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (expenseId: string) => void;
  undoDeleteExpense: () => void;
  setTheme: (theme: Theme) => void;
  setBudgetSortOrder: (order: BudgetSortOrder) => void;
  setExpenseSortOrder: (order: ExpenseSortOrder) => void;
  importData: (data: { budgets: Budget[], expenses: Expense[]}) => void;
  addToast: (message: string, type: ToastType, options?: { onUndo?: () => void }) => void;
  removeToast: (id: string) => void;
  reassignAndDeleteBudget: (sourceBudgetId: string, targetBudgetId: string) => void;
  moveExpense: (expenseId: string, targetBudgetId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// FIX: Removed explicit return type to allow TypeScript to infer it, resolving issues with child components.
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const loadData = async () => {
      const budgets = await storage.getBudgets();
      const expenses = await storage.getExpenses();
      dispatch({ type: 'SET_DATA', payload: { budgets, expenses } });
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!state.loading) {
      storage.saveBudgets(state.budgets);
      storage.saveExpenses(state.expenses);
    }
  }, [state.budgets, state.expenses, state.loading]);

  useEffect(() => {
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else if (state.theme === 'light') {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      localStorage.removeItem('theme');
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [state.theme]);

  useEffect(() => {
    localStorage.setItem('budgetSortOrder', state.budgetSortOrder);
  }, [state.budgetSortOrder]);
  
  useEffect(() => {
    localStorage.setItem('expenseSortOrder', state.expenseSortOrder);
  }, [state.expenseSortOrder]);


  const getBudgetExpenses = useCallback((budgetId: string) => {
    return state.expenses.filter(expense => expense.presupuestoId === budgetId);
  }, [state.expenses]);

  const getBudgetRemaining = useCallback((budgetId: string) => {
    const budget = state.budgets.find(b => b.id === budgetId);
    if (!budget) return 0;

    const initialAvailable = (budget.capitalTotal * budget.porcentajeUsable) / 100;
    const totalSpent = getBudgetExpenses(budgetId).reduce((sum, e) => sum + e.importe, 0);
    
    return initialAvailable - totalSpent;
  }, [state.budgets, getBudgetExpenses]);


  const addBudget = (budget: Omit<Budget, 'id' | 'fechaCreacion' | 'fechaModificacion'>) => {
    const newBudget: Budget = {
      ...budget,
      id: crypto.randomUUID(),
      fechaCreacion: new Date().toISOString(),
      fechaModificacion: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_BUDGET', payload: newBudget });
  };
  
  const updateBudget = (budget: Budget) => {
    const updatedBudget = { ...budget, fechaModificacion: new Date().toISOString() };
    dispatch({ type: 'UPDATE_BUDGET', payload: updatedBudget });
  };

  const deleteBudget = (budgetId: string) => {
    dispatch({ type: 'DELETE_BUDGET', payload: budgetId });
  };
  
  const addExpense = (expense: Omit<Expense, 'id' | 'fecha'>) => {
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      fecha: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_EXPENSE', payload: newExpense });
  };
  
  const updateExpense = (expense: Expense) => {
    dispatch({ type: 'UPDATE_EXPENSE', payload: expense });
  };
  
  const undoDeleteExpense = () => {
    dispatch({ type: 'UNDO_DELETE_EXPENSE' });
  };

  const deleteExpense = (expenseId: string) => {
    dispatch({ type: 'DELETE_EXPENSE', payload: expenseId });
    addToast('Gasto eliminado.', 'info', { onUndo: undoDeleteExpense });
  };
  
  const setTheme = (theme: Theme) => {
    dispatch({ type: 'SET_THEME', payload: theme });
  };

  const setBudgetSortOrder = (order: BudgetSortOrder) => {
    dispatch({ type: 'SET_BUDGET_SORT_ORDER', payload: order });
  };

  const setExpenseSortOrder = (order: ExpenseSortOrder) => {
    dispatch({ type: 'SET_EXPENSE_SORT_ORDER', payload: order });
  };

  const importData = (data: { budgets: Budget[], expenses: Expense[]}) => {
    dispatch({ type: 'IMPORT_DATA', payload: data });
  };

  const addToast = useCallback((message: string, type: ToastType = 'info', options?: { onUndo?: () => void }) => {
    const id = crypto.randomUUID();
    dispatch({ type: 'ADD_TOAST', payload: { id, message, type, ...options } });
  }, []);

  const removeToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  }, []);

  const reassignAndDeleteBudget = (sourceBudgetId: string, targetBudgetId: string) => {
    dispatch({ type: 'REASSIGN_AND_DELETE_BUDGET', payload: { sourceBudgetId, targetBudgetId } });
  };

  const moveExpense = (expenseId: string, targetBudgetId: string) => {
    dispatch({ type: 'MOVE_EXPENSE', payload: { expenseId, targetBudgetId } });
  };

  return (
    <AppContext.Provider value={{ ...state, dispatch, getBudgetExpenses, getBudgetRemaining, addBudget, updateBudget, deleteBudget, addExpense, updateExpense, deleteExpense, undoDeleteExpense, setTheme, setBudgetSortOrder, setExpenseSortOrder, importData, addToast, removeToast, reassignAndDeleteBudget, moveExpense }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};