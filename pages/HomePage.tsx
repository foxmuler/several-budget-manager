import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import DonutChartComponent from '../components/DonutChart';
import BudgetCard from '../components/BudgetCard';
import Modal from '../components/ui/Modal';
import BudgetForm from '../components/BudgetForm';
import ExpenseForm from '../components/ExpenseForm';
import { Budget } from '../types';
import ReassignExpensesModal from '../components/ReassignExpensesModal';
import ConfirmationModal from '../components/ui/ConfirmationModal';

const AddIcon = ({ className }: { className: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
);

const HomePage = () => {
    const { budgets, loading, getBudgetExpenses, deleteBudget, reassignAndDeleteBudget, addToast, budgetSortOrder, getBudgetRemaining } = useAppContext();
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

    const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
    const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
    const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
    
    const availableBudgetsForReassign = useMemo(() => {
        if (!budgetToDelete) return [];
        return budgets.filter(b => b.id !== budgetToDelete.id);
    }, [budgets, budgetToDelete]);

    const sortedBudgets = useMemo(() => {
        const budgetsCopy = [...budgets];
        switch (budgetSortOrder) {
            case 'date-asc':
                return budgetsCopy.sort((a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime());
            case 'remaining-desc':
                return budgetsCopy.sort((a, b) => getBudgetRemaining(b.id) - getBudgetRemaining(a.id));
            case 'remaining-asc':
                return budgetsCopy.sort((a, b) => getBudgetRemaining(a.id) - getBudgetRemaining(b.id));
            case 'expenses-desc':
                return budgetsCopy.sort((a, b) => getBudgetExpenses(b.id).length - getBudgetExpenses(a.id).length);
            case 'expenses-asc':
                return budgetsCopy.sort((a, b) => getBudgetExpenses(a.id).length - getBudgetExpenses(b.id).length);
            case 'date-desc':
            default:
                return budgetsCopy.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
        }
    }, [budgets, budgetSortOrder, getBudgetRemaining, getBudgetExpenses]);


    const handleDeleteRequest = (budget: Budget) => {
        const expenses = getBudgetExpenses(budget.id);

        if (expenses.length > 0) {
            if (budgets.length > 1) {
                setBudgetToDelete(budget);
                setIsReassignModalOpen(true);
            } else {
                addToast('No se puede eliminar. Crea otro capital para mover los gastos asociados.', 'error');
            }
        } else {
            setBudgetToDelete(budget);
            setIsConfirmDeleteModalOpen(true);
        }
    };
    
    const handleConfirmReassignment = (targetBudgetId: string) => {
        if (budgetToDelete) {
            reassignAndDeleteBudget(budgetToDelete.id, targetBudgetId);
            addToast(`Gastos movidos y capital "${budgetToDelete.descripcion}" eliminado.`, 'success');
        }
        setIsReassignModalOpen(false);
        setBudgetToDelete(null);
    };

    const handleCloseReassignModal = () => {
        setIsReassignModalOpen(false);
        setBudgetToDelete(null);
    };

    const handleConfirmDelete = () => {
        if (budgetToDelete) {
            deleteBudget(budgetToDelete.id);
            addToast(`Capital "${budgetToDelete.descripcion}" eliminado.`, 'success');
        }
        setIsConfirmDeleteModalOpen(false);
        setBudgetToDelete(null);
    };

    const handleCloseConfirmDeleteModal = () => {
        setIsConfirmDeleteModalOpen(false);
        setBudgetToDelete(null);
    };

    if (loading) {
        return <div className="text-center p-8">Cargando datos...</div>;
    }

    return (
        <div className="space-y-6">
            <DonutChartComponent />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedBudgets.length > 0 ? (
                    sortedBudgets.map(budget => (
                        <BudgetCard key={budget.id} budget={budget} onDeleteRequest={handleDeleteRequest} />
                    ))
                ) : (
                    <div className="col-span-full text-center py-10 px-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">No hay capitales todavía</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">¡Añade tu primer capital para empezar!</p>
                        <button onClick={() => setIsBudgetModalOpen(true)} className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                            Crear Capital
                        </button>
                    </div>
                )}
            </div>

            {/* Floating Action Button for Budget (Left) */}
            <div className="fixed bottom-20 left-4 md:bottom-6 md:left-6 z-20">
                <button
                    onClick={() => setIsBudgetModalOpen(true)}
                    title="Añadir Capital"
                    aria-label="Añadir Capital"
                    className="flex items-center justify-center w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-transform transform hover:scale-110"
                >
                    <AddIcon className="w-8 h-8" />
                </button>
            </div>
            
            {/* Floating Action Button for Expense (Right) */}
            <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-20">
                 <button
                    onClick={() => setIsExpenseModalOpen(true)}
                    disabled={budgets.length === 0}
                    title="Añadir Gasto"
                    aria-label="Añadir Gasto"
                    className="flex items-center justify-center w-14 h-14 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-transform transform hover:scale-110 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
                >
                    <AddIcon className="w-8 h-8" />
                </button>
            </div>
            
            <Modal title="Añadir Capital" isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)}>
                <BudgetForm onSave={() => setIsBudgetModalOpen(false)} />
            </Modal>
            
            <Modal title="Añadir Gasto" isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)}>
                <ExpenseForm onSave={() => setIsExpenseModalOpen(false)} />
            </Modal>

            {budgetToDelete && (
                <ReassignExpensesModal
                    isOpen={isReassignModalOpen}
                    onClose={handleCloseReassignModal}
                    onConfirm={handleConfirmReassignment}
                    budgetToDeleteName={budgetToDelete.descripcion}
                    numberOfExpenses={getBudgetExpenses(budgetToDelete.id).length}
                    availableBudgets={availableBudgetsForReassign}
                />
            )}

            {budgetToDelete && (
                <ConfirmationModal
                    isOpen={isConfirmDeleteModalOpen}
                    onClose={handleCloseConfirmDeleteModal}
                    onConfirm={handleConfirmDelete}
                    title="Confirmar Eliminación"
                    message={`¿Estás seguro de que quieres eliminar el capital "${budgetToDelete.descripcion}"? Esta acción no se puede deshacer.`}
                    confirmButtonText="Eliminar"
                />
            )}
        </div>
    );
};

export default HomePage;