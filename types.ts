
export interface Budget {
  id: string;
  numeroReferencia: string;
  descripcion: string;
  capitalTotal: number;
  porcentajeUsable: number;
  color: string;
  fechaCreacion: string;
  fechaModificacion: string;
}

export interface Expense {
  id: string;
  numeroRefGasto: string;
  descripcion: string;
  importe: number;
  presupuestoId: string;
  fecha: string;
}

export type Theme = 'light' | 'dark' | 'system';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  onUndo?: () => void;
}

export type BudgetSortOrder =
  | 'date-desc'
  | 'date-asc'
  | 'remaining-desc'
  | 'remaining-asc'
  | 'expenses-desc'
  | 'expenses-asc';

export type ExpenseSortOrder =
  | 'date-desc'
  | 'date-asc'
  | 'amount-desc'
  | 'amount-asc'
  | 'description-asc'
  | 'description-desc';