
import React, { useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Budget, Expense } from '../types';
import Modal from '../components/ui/Modal';
import BudgetForm from '../components/BudgetForm';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseListItem from '../components/ExpenseListItem';
import ReassignExpensesModal from '../components/ReassignExpensesModal';
import MoveExpenseModal from '../components/MoveExpenseModal';
import ConfirmationModal from '../components/ui/ConfirmationModal';

const ArrowLeftIcon = ({ className }: { className: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
);
const EditIcon = ({ className }: { className: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>
);
const AddIcon = ({ className }: { className: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
);

const formatMonthYear = (dateString: string) => {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${year}`;
};

// FIX: Removed explicit ReactElement return type to allow TypeScript to correctly infer the component's type.
const BudgetDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const { budgets, getBudgetExpenses, getBudgetRemaining, deleteBudget, addToast, reassignAndDeleteBudget, deleteExpense, moveExpense, expenseSortOrder } = useAppContext();

    const [isEditBudgetModalOpen, setIsEditBudgetModalOpen] = useState(false);
    const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState<Expense | undefined>(undefined);
    const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
    const [expenseToMove, setExpenseToMove] = useState<Expense | null>(null);
    const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);

    const budget = useMemo(() => budgets.find(b => b.id === id), [budgets, id]);
    const expenses = useMemo(() => id ? getBudgetExpenses(id) : [], [id, getBudgetExpenses]);
    const remaining = useMemo(() => id ? getBudgetRemaining(id) : 0, [id, getBudgetRemaining]);
    const availableBudgetsForReassign = useMemo(() => budgets.filter(b => b.id !== id), [budgets, id]);
    const availableBudgetsForMove = useMemo(() => budgets.filter(b => b.id !== id), [budgets, id]);
    
    const sortedExpenses = useMemo(() => {
        return [...expenses].sort((a, b) => {
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
    }, [expenses, expenseSortOrder]);


    if (!budget) {
        return (
            <div className="text-center p-8">
                <p>Capital no encontrado.</p>
                <button onClick={() => window.location.hash = '/'} className="text-primary-600 hover:underline">Volver a Home</button>
            </div>
        );
    }
    
    const initialAvailable = (budget.capitalTotal * budget.porcentajeUsable) / 100;
    const spent = initialAvailable - remaining;
    const spentPercentage = initialAvailable > 0 ? (spent / initialAvailable) * 100 : 0;

    const handleDeleteBudget = () => {
        if (expenses.length > 0) {
            if (availableBudgetsForReassign.length > 0) {
                setIsReassignModalOpen(true);
            } else {
                addToast('No se puede eliminar. Crea otro capital para mover los gastos asociados.', 'error');
            }
        } else {
            setIsConfirmDeleteModalOpen(true);
        }
    };

    const handleConfirmDelete = () => {
        if (budget) {
            deleteBudget(budget.id);
            addToast(`Capital "${budget.descripcion}" eliminado.`, 'success');
            setIsConfirmDeleteModalOpen(false);
            window.location.hash = '/';
        }
    };
    
    const handleConfirmReassignment = (targetBudgetId: string) => {
        if (budget) {
            reassignAndDeleteBudget(budget.id, targetBudgetId);
            setIsReassignModalOpen(false);
            addToast(`Gastos movidos y capital "${budget.descripcion}" eliminado.`, 'success');
            window.location.hash = '/';
        }
    };

    const handleEditExpense = (expense: Expense) => {
        setExpenseToEdit(expense);
        setIsAddExpenseModalOpen(true);
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

    const handleCloseExpenseModal = () => {
        setExpenseToEdit(undefined);
        setIsAddExpenseModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <button onClick={() => window.location.hash = '/'} className="inline-flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline">
                <ArrowLeftIcon className="w-4 h-4" />
                Volver a Home
            </button>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                            {budget.descripcion}
                            <span className="ml-3 text-lg font-normal text-gray-500 dark:text-gray-400">
                                {formatMonthYear(budget.fechaCreacion)}
                            </span>
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{budget.numeroReferencia}</p>
                    </div>
                    <button onClick={() => setIsEditBudgetModalOpen(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <EditIcon className="w-5 h-5 text-gray-600 dark:text-gray-300"/>
                    </button>
                </div>
                
                <div className="mt-6 space-y-4">
                    <div className="flex justify-between items-baseline">
                        <span className="text-gray-600 dark:text-gray-300">Restante:</span>
                        <span className="text-2xl font-semibold" style={{color: budget.color}}>{remaining.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div className="h-2.5 rounded-full" style={{ width: `${spentPercentage}%`, backgroundColor: budget.color }}></div>
                    </div>
                    <div className="text-sm flex justify-between text-gray-500 dark:text-gray-400">
                        <span>Gastado: {spent.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                        <span>Total: {initialAvailable.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Gastos</h2>
                    <button onClick={() => setIsAddExpenseModalOpen(true)} className="inline-flex items-center gap-2 px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        <AddIcon className="w-5 h-5" />
                        Añadir
                    </button>
                </div>
                <div className="space-y-3">
                    {sortedExpenses.length > 0 ? (
                        sortedExpenses.map(expense => (
                            <ExpenseListItem key={expense.id} expense={expense} showBudgetInfo onEdit={() => handleEditExpense(expense)} onDelete={handleDeleteExpense} onMoveRequest={handleMoveRequest} />
                        ))
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No hay gastos en este capital.</p>
                    )}
                </div>
            </div>

            <div className="text-center mt-6">
                <button onClick={handleDeleteBudget} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium text-sm">
                    Eliminar Capital
                </button>
            </div>

            <Modal title="Editar Capital" isOpen={isEditBudgetModalOpen} onClose={() => setIsEditBudgetModalOpen(false)}>
                <BudgetForm onSave={() => setIsEditBudgetModalOpen(false)} budgetToEdit={budget} />
            </Modal>
            
            <Modal title={expenseToEdit ? "Editar Gasto" : "Añadir Gasto"} isOpen={isAddExpenseModalOpen} onClose={handleCloseExpenseModal}>
                <ExpenseForm onSave={handleCloseExpenseModal} expenseToEdit={expenseToEdit} defaultBudgetId={budget.id}/>
            </Modal>

            {budget && (
                <ReassignExpensesModal
                    isOpen={isReassignModalOpen}
                    onClose={() => setIsReassignModalOpen(false)}
                    onConfirm={handleConfirmReassignment}
                    budgetToDeleteId={budget.id}
                    budgetToDeleteName={budget.descripcion}
                    numberOfExpenses={expenses.length}
                    availableBudgets={availableBudgetsForReassign}
                />
            )}

            <MoveExpenseModal 
                isOpen={!!expenseToMove}
                onClose={() => setExpenseToMove(null)}
                onConfirm={handleConfirmMove}
                expenseToMove={expenseToMove}
                availableBudgets={availableBudgetsForMove}
            />

            {budget && (
                <ConfirmationModal
                    isOpen={isConfirmDeleteModalOpen}
                    onClose={() => setIsConfirmDeleteModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title="Confirmar Eliminación"
                    message={`¿Estás seguro de que quieres eliminar el capital "${budget.descripcion}"? Esta acción no se puede deshacer.`}
                    confirmButtonText="Eliminar"
                />
            )}
        </div>
    );
};

export default BudgetDetailPage;
