import React, { createContext, useContext, useEffect, useReducer, ReactNode, useCallback, ReactElement } from 'react';
import { Budget, Expense, Theme, ToastMessage, ToastType, BudgetSortOrder, ExpenseSortOrder, AppData, AppConfig, AutoDistributionStrategy } from '../types';
import * as storage from '../services/storage';
import { PREDEFINED_COLORS, DEFAULT_ARCHIVED_COLOR } from '../constants';

interface AppState {
  budgets: Budget[];
  expenses: Expense[];
  loading: boolean;
  theme: Theme;
  toasts: ToastMessage[];
  lastDeletedExpense: Expense | null;
  budgetSortOrder: BudgetSortOrder;
  expenseSortOrder: ExpenseSortOrder;
  manualBudgetOrder: string[];
  archivedBudgetColor: string;
  autoDistributionStrategy: AutoDistributionStrategy;
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
  | { type: 'ADD_TOAST'; payload: ToastMessage }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'REASSIGN_AND_DELETE_BUDGET'; payload: { sourceBudgetId: string; targetBudgetId: string } }
  | { type: 'MOVE_EXPENSE'; payload: { expenseId: string; targetBudgetId: string } }
  | { type: 'SET_BUDGET_SORT_ORDER'; payload: BudgetSortOrder }
  | { type: 'SET_EXPENSE_SORT_ORDER'; payload: ExpenseSortOrder }
  | { type: 'SET_MANUAL_BUDGET_ORDER'; payload: string[] }
  | { type: 'SET_ARCHIVED_BUDGET_COLOR', payload: string }
  | { type: 'SET_AUTO_DISTRIBUTION_STRATEGY', payload: AutoDistributionStrategy }
  | { type: 'IMPORT_FULL_BACKUP'; payload: { data: AppData, config: Partial<AppConfig> } };


const initialState: AppState = {
  budgets: [],
  expenses: [],
  loading: true,
  theme: (localStorage.getItem('theme') as Theme) || 'system',
  toasts: [],
  lastDeletedExpense: null,
  budgetSortOrder: (localStorage.getItem('budgetSortOrder') as BudgetSortOrder) || 'manual',
  expenseSortOrder: (localStorage.getItem('expenseSortOrder') as ExpenseSortOrder) || 'date-desc',
  manualBudgetOrder: [],
  archivedBudgetColor: localStorage.getItem('archivedBudgetColor') || DEFAULT_ARCHIVED_COLOR,
  autoDistributionStrategy: (localStorage.getItem('autoDistributionStrategy') as AutoDistributionStrategy) || 'manual',
};

const checkAndApplyArchiveStatus = (
    budgets: Budget[],
    expenses: Expense[],
    archivedColor: string
): Budget[] => {
    return budgets.map(budget => {
        const budgetExpenses = expenses.filter(e => e.presupuestoId === budget.id);
        const totalSpent = budgetExpenses.reduce((sum, e) => sum + e.importe, 0);
        const initialAvailable = (budget.capitalTotal * budget.porcentajeUsable) / 100;
        const remaining = initialAvailable - totalSpent;

        const shouldBeArchived = remaining <= 0;

        if (shouldBeArchived && !budget.isArchived) {
            // Archive it
            return { ...budget, isArchived: true, color: archivedColor, fechaModificacion: new Date().toISOString() };
        } else if (!shouldBeArchived && budget.isArchived) {
            // Restore it
            const usedColors = new Set(budgets.map(b => b.color));
            const newColor = PREDEFINED_COLORS.find(c => !usedColors.has(c)) || PREDEFINED_COLORS[0];
            return { ...budget, isArchived: false, isRestored: true, color: newColor, fechaModificacion: new Date().toISOString() };
        }
        return budget;
    });
};


const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_DATA': {
      const { budgets, expenses } = action.payload;
      const updatedBudgets = checkAndApplyArchiveStatus(budgets, expenses, state.archivedBudgetColor);
      return { ...state, budgets: updatedBudgets, expenses, loading: false };
    }
    case 'ADD_BUDGET': {
      const newBudgets = [...state.budgets, action.payload];
      const updatedBudgets = checkAndApplyArchiveStatus(newBudgets, state.expenses, state.archivedBudgetColor);
      return { ...state, budgets: updatedBudgets, manualBudgetOrder: [...state.manualBudgetOrder, action.payload.id] };
    }
    case 'UPDATE_BUDGET': {
      const newBudgets = state.budgets.map((b) =>
          b.id === action.payload.id ? action.payload : b
      );
      const updatedBudgets = checkAndApplyArchiveStatus(newBudgets, state.expenses, state.archivedBudgetColor);
      return { ...state, budgets: updatedBudgets };
    }
    case 'DELETE_BUDGET': {
      const budgetId = action.payload;
      const newExpenses = state.expenses.filter((e) => e.presupuestoId !== budgetId);
      const newBudgets = state.budgets.filter((b) => b.id !== budgetId);
      const updatedBudgets = checkAndApplyArchiveStatus(newBudgets, newExpenses, state.archivedBudgetColor);

      return {
        ...state,
        budgets: updatedBudgets,
        expenses: newExpenses,
        manualBudgetOrder: state.manualBudgetOrder.filter(id => id !== budgetId),
      };
    }
    case 'ADD_EXPENSE': {
        const newExpenses = [...state.expenses, action.payload];
        const updatedBudgets = checkAndApplyArchiveStatus(state.budgets, newExpenses, state.archivedBudgetColor);
        return { ...state, expenses: newExpenses, budgets: updatedBudgets };
    }
    case 'UPDATE_EXPENSE': {
      const newExpenses = state.expenses.map((e) =>
          e.id === action.payload.id ? action.payload : e
      );
      const updatedBudgets = checkAndApplyArchiveStatus(state.budgets, newExpenses, state.archivedBudgetColor);
      return { ...state, expenses: newExpenses, budgets: updatedBudgets };
    }
    case 'DELETE_EXPENSE': {
      const expenseToDelete = state.expenses.find(e => e.id === action.payload);
      const newExpenses = state.expenses.filter((e) => e.id !== action.payload);
      const updatedBudgets = checkAndApplyArchiveStatus(state.budgets, newExpenses, state.archivedBudgetColor);
      return {
        ...state,
        expenses: newExpenses,
        budgets: updatedBudgets,
        lastDeletedExpense: expenseToDelete || null,
      };
    }
    case 'UNDO_DELETE_EXPENSE': {
      if (!state.lastDeletedExpense) return state;
      const newExpenses = [...state.expenses, state.lastDeletedExpense]
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      const updatedBudgets = checkAndApplyArchiveStatus(state.budgets, newExpenses, state.archivedBudgetColor);
      return { ...state, expenses: newExpenses, budgets: updatedBudgets, lastDeletedExpense: null };
    }
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_BUDGET_SORT_ORDER':
      return { ...state, budgetSortOrder: action.payload };
    case 'SET_EXPENSE_SORT_ORDER':
      return { ...state, expenseSortOrder: action.payload };
    case 'ADD_TOAST':
      return { ...state, toasts: [action.payload, ...state.toasts.filter(t => t.onUndo)] }; // Allow only one undo toast
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    case 'REASSIGN_AND_DELETE_BUDGET': {
      const { sourceBudgetId, targetBudgetId } = action.payload;
      const newExpenses = state.expenses.map(e =>
          e.presupuestoId === sourceBudgetId ? { ...e, presupuestoId: targetBudgetId } : e
      );
      const newBudgets = state.budgets.filter(b => b.id !== sourceBudgetId);
      const updatedBudgets = checkAndApplyArchiveStatus(newBudgets, newExpenses, state.archivedBudgetColor);

      return {
        ...state,
        expenses: newExpenses,
        budgets: updatedBudgets,
        manualBudgetOrder: state.manualBudgetOrder.filter(id => id !== sourceBudgetId),
      };
    }
    case 'MOVE_EXPENSE': {
      const { expenseId, targetBudgetId } = action.payload;
      const newExpenses = state.expenses.map(e =>
          e.id === expenseId ? { ...e, presupuestoId: targetBudgetId } : e
      );
      const updatedBudgets = checkAndApplyArchiveStatus(state.budgets, newExpenses, state.archivedBudgetColor);
      return { ...state, expenses: newExpenses, budgets: updatedBudgets };
    }
     case 'SET_MANUAL_BUDGET_ORDER':
        return { ...state, manualBudgetOrder: action.payload };
    case 'SET_ARCHIVED_BUDGET_COLOR':
        const budgetsWithNewArchiveColor = state.budgets.map(b => {
            if (b.isArchived) {
                return { ...b, color: action.payload };
            }
            return b;
        });
        return { ...state, archivedBudgetColor: action.payload, budgets: budgetsWithNewArchiveColor };
    case 'SET_AUTO_DISTRIBUTION_STRATEGY':
        return { ...state, autoDistributionStrategy: action.payload };
    case 'IMPORT_FULL_BACKUP': {
        const { data, config } = action.payload;
        const { budgets, expenses, manualBudgetOrder } = data;
        
        // Use imported archived color for the check, or current state's one if not present
        const finalArchivedColor = config.archivedBudgetColor || state.archivedBudgetColor;
        const updatedBudgets = checkAndApplyArchiveStatus(budgets, expenses, finalArchivedColor);

        // Ensure manualBudgetOrder is synced with imported budgets
        const budgetIds = new Set(budgets.map(b => b.id));
        let syncedManualOrder = (manualBudgetOrder || []).filter(id => budgetIds.has(id));
        budgets.forEach(b => {
            if (!syncedManualOrder.includes(b.id)) {
                syncedManualOrder.push(b.id);
            }
        });

        return {
            ...state,
            budgets: updatedBudgets,
            expenses,
            manualBudgetOrder: syncedManualOrder,
            theme: config.theme || state.theme,
            budgetSortOrder: config.budgetSortOrder || state.budgetSortOrder,
            expenseSortOrder: config.expenseSortOrder || state.expenseSortOrder,
            archivedBudgetColor: finalArchivedColor,
            autoDistributionStrategy: config.autoDistributionStrategy || state.autoDistributionStrategy,
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
  findAutoBudget: (amount: number, strategy: AutoDistributionStrategy, excludeBudgetId?: string) => string | null;
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
  importFullBackup: (payload: { data: AppData, config: Partial<AppConfig> }) => void;
  addToast: (message: string, type: ToastType, options?: { onUndo?: () => void }) => void;
  removeToast: (id: string) => void;
  reassignAndDeleteBudget: (sourceBudgetId: string, targetBudgetId: string) => void;
  moveExpense: (expenseId: string, targetBudgetId: string) => void;
  setManualBudgetOrder: (order: string[]) => void;
  setArchivedBudgetColor: (color: string) => void;
  setAutoDistributionStrategy: (strategy: AutoDistributionStrategy) => void;
  resetApp: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// FIX: Removed explicit return type to allow TypeScript to infer it, resolving issues with child components.
export const AppProvider = ({ children }: { children?: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const loadData = async () => {
      const budgets = await storage.getBudgets();
      const expenses = await storage.getExpenses();
      let manualOrder = await storage.getManualBudgetOrder();

      if (manualOrder.length === 0 && budgets.length > 0) {
        manualOrder = budgets.map(b => b.id);
      } else {
        const budgetIds = new Set(budgets.map(b => b.id));
        manualOrder = manualOrder.filter(id => budgetIds.has(id));
        budgets.forEach(b => {
            if (!manualOrder.includes(b.id)) {
                manualOrder.push(b.id);
            }
        });
      }
      
      dispatch({ type: 'SET_DATA', payload: { budgets, expenses } });
      dispatch({ type: 'SET_MANUAL_BUDGET_ORDER', payload: manualOrder });
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!state.loading) {
      storage.saveBudgets(state.budgets);
      storage.saveExpenses(state.expenses);
      storage.saveManualBudgetOrder(state.manualBudgetOrder);
    }
  }, [state.budgets, state.expenses, state.manualBudgetOrder, state.loading]);

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

  useEffect(() => {
    localStorage.setItem('archivedBudgetColor', state.archivedBudgetColor);
  }, [state.archivedBudgetColor]);

  useEffect(() => {
    localStorage.setItem('autoDistributionStrategy', state.autoDistributionStrategy);
  }, [state.autoDistributionStrategy]);


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

  // New function to find a budget based on strategy
  const findAutoBudget = useCallback((amount: number, strategy: AutoDistributionStrategy, excludeBudgetId?: string): string | null => {
      if (strategy === 'manual') return null;

      // Filter valid candidates: Not archived, not the excluded one, and has enough remaining funds
      const candidates = state.budgets.filter(b => {
          if (b.isArchived) return false;
          if (excludeBudgetId && b.id === excludeBudgetId) return false;
          
          const remaining = getBudgetRemaining(b.id);
          return remaining >= amount;
      });

      if (candidates.length === 0) return null;

      switch (strategy) {
          case 'best-fit':
              // Sort by remaining ascending (closest to 0 after substraction)
              // We want minimal (Remaining - Amount), since Amount is constant, we want minimal Remaining.
              candidates.sort((a, b) => getBudgetRemaining(a.id) - getBudgetRemaining(b.id));
              return candidates[0].id;

          case 'largest-available':
              // Sort by remaining descending
              candidates.sort((a, b) => getBudgetRemaining(b.id) - getBudgetRemaining(a.id));
              return candidates[0].id;

          case 'newest':
              // Sort by creation date descending
              candidates.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
              return candidates[0].id;

          case 'oldest':
              // Sort by creation date ascending
              candidates.sort((a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime());
              return candidates[0].id;

          case 'random':
               // Pick a random index
               const randomIndex = Math.floor(Math.random() * candidates.length);
               return candidates[randomIndex].id;
          
          default:
              return null;
      }
  }, [state.budgets, getBudgetRemaining]);


  const addBudget = (budget: Omit<Budget, 'id' | 'fechaCreacion' | 'fechaModificacion'>) => {
    const newBudget: Budget = {
      ...budget,
      id: crypto.randomUUID(),
      fechaCreacion: new Date().toISOString(),
      fechaModificacion: new Date().toISOString(),
      isArchived: false,
      isRestored: false,
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
  
  const setManualBudgetOrder = (order: string[]) => {
    dispatch({ type: 'SET_MANUAL_BUDGET_ORDER', payload: order });
  }
  
  const setArchivedBudgetColor = (color: string) => {
    dispatch({ type: 'SET_ARCHIVED_BUDGET_COLOR', payload: color });
  };
  
  const setAutoDistributionStrategy = (strategy: AutoDistributionStrategy) => {
    dispatch({ type: 'SET_AUTO_DISTRIBUTION_STRATEGY', payload: strategy });
  };

  const importFullBackup = (payload: { data: AppData, config: Partial<AppConfig> }) => {
    dispatch({ type: 'IMPORT_FULL_BACKUP', payload });
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

  const resetApp = async () => {
    await storage.clearAllData();
    localStorage.removeItem('theme');
    localStorage.removeItem('budgetSortOrder');
    localStorage.removeItem('expenseSortOrder');
    localStorage.removeItem('archivedBudgetColor');
    localStorage.removeItem('autoDistributionStrategy');
    addToast('Aplicación reseteada. Recargando...', 'success');
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  return (
    <AppContext.Provider value={{ ...state, dispatch, getBudgetExpenses, getBudgetRemaining, findAutoBudget, addBudget, updateBudget, deleteBudget, addExpense, updateExpense, deleteExpense, undoDeleteExpense, setTheme, setBudgetSortOrder, setExpenseSortOrder, importFullBackup, addToast, removeToast, reassignAndDeleteBudget, moveExpense, setManualBudgetOrder, setArchivedBudgetColor, setAutoDistributionStrategy, resetApp }}>
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