import React, { useState, useMemo, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { Expense } from '../types';
import ExpenseListItem from '../components/ExpenseListItem';
import Modal from '../components/ui/Modal';
import ExpenseForm from '../components/ExpenseForm';
import MoveExpenseModal from '../components/MoveExpenseModal';

const SearchIcon = ({className}: {className: string}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
);

const HistoryPage = () => {
    const { expenses, budgets, deleteExpense, moveExpense, addToast, expenseSortOrder } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [expenseToEdit, setExpenseToEdit] = useState<Expense | undefined>(undefined);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expenseToMove, setExpenseToMove] = useState<Expense | null>(null);

    const budgetMap = useMemo(() => {
        return new Map(budgets.map(b => [b.id, b]));
    }, [budgets]);

    const availableBudgetsForMove = useMemo(() => {
        if (!expenseToMove) return [];
        return budgets.filter(b => b.id !== expenseToMove.presupuestoId);
    }, [budgets, expenseToMove]);

    const filteredExpenses = useMemo(() => {
        const baseFiltered = !searchTerm
            ? [...expenses]
            : expenses.filter(expense => {
                const budget = budgetMap.get(expense.presupuestoId);
                const lowercasedFilter = searchTerm.toLowerCase();
                return (
                    expense.descripcion.toLowerCase().includes(lowercasedFilter) ||
                    expense.numeroRefGasto.toLowerCase().includes(lowercasedFilter) ||
                    (budget && budget.descripcion.toLowerCase().includes(lowercasedFilter)) ||
                    (budget && budget.numeroReferencia.toLowerCase().includes(lowercasedFilter))
                );
            });
        
        // Apply sorting
        return baseFiltered.sort((a, b) => {
            switch (expenseSortOrder) {
                case 'date-asc':
                    return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
                case 'amount-desc':
                    return b.importe - a.importe;
                case 'amount-asc':
                    return a.importe - b.importe;
                case 'description-asc':
                    return a.descripcion.localeCompare(b.descripcion);
                case 'description-desc':
                    return b.descripcion.localeCompare(a.descripcion);
                case 'date-desc':
                default:
                    return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
            }
        });
    }, [searchTerm, expenses, budgetMap, expenseSortOrder]);

    const handleEditExpense = (expense: Expense) => {
        setExpenseToEdit(expense);
        setIsModalOpen(true);
    };

    const handleDeleteExpense = useCallback((expenseToDelete: Expense) => {
        deleteExpense(expenseToDelete.id);
    }, [deleteExpense]);

    const handleMoveRequest = (expense: Expense) => {
        setExpenseToMove(expense);
    };

    const handleConfirmMove = (targetBudgetId: string) => {
        if (expenseToMove) {
            moveExpense(expenseToMove.id, targetBudgetId);
            const targetBudget = budgets.find(b => b.id === targetBudgetId);
            addToast(`Gasto movido a "${targetBudget?.descripcion || 'otro capital'}".`, 'success');
            setExpenseToMove(null);
        }
    };

    const handleCloseModal = () => {
        setExpenseToEdit(undefined);
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Historial de Gastos</h1>
            
            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Buscar por descripción, referencia..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 pl-10 py-3 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg space-y-3">
                {filteredExpenses.length > 0 ? (
                    filteredExpenses.map(expense => (
                        <ExpenseListItem 
                            key={expense.id} 
                            expense={expense} 
                            showBudgetInfo 
                            onEdit={() => handleEditExpense(expense)}
                            onDelete={handleDeleteExpense}
                            onMoveRequest={handleMoveRequest}
                        />
                    ))
                ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                        {searchTerm ? 'No se encontraron gastos' : 'No hay gastos registrados'}
                    </p>
                )}
            </div>

            <Modal title={expenseToEdit ? "Editar Gasto" : "Añadir Gasto"} isOpen={isModalOpen} onClose={handleCloseModal}>
                <ExpenseForm onSave={handleCloseModal} expenseToEdit={expenseToEdit}/>
            </Modal>

            <MoveExpenseModal 
                isOpen={!!expenseToMove}
                onClose={() => setExpenseToMove(null)}
                onConfirm={handleConfirmMove}
                expenseToMove={expenseToMove}
                availableBudgets={availableBudgetsForMove}
            />
        </div>
    );
};

export default HistoryPage;