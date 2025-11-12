
import React, { useState } from 'react';
import { Budget } from '../types';
import Modal from './ui/Modal';
import { useAppContext } from '../context/AppContext';

interface ReassignExpensesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (targetBudgetId: string) => void;
    budgetToDeleteName: string;
    numberOfExpenses: number;
    availableBudgets: Budget[];
}

// FIX: Removed explicit ReactElement return type to allow TypeScript to correctly infer the component's type.
const ReassignExpensesModal = ({ isOpen, onClose, onConfirm, budgetToDeleteName, numberOfExpenses, availableBudgets }: ReassignExpensesModalProps) => {
    const { addToast } = useAppContext();
    const [targetBudgetId, setTargetBudgetId] = useState<string>(availableBudgets.length > 0 ? availableBudgets[0].id : '');

    const handleConfirm = () => {
        if(targetBudgetId) {
            onConfirm(targetBudgetId);
        } else {
            addToast("Por favor, selecciona un capital de destino.", 'error');
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Reasignar Gastos">
            <div className="space-y-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                    El capital <span className="font-bold">"{budgetToDeleteName}"</span> tiene <span className="font-bold">{numberOfExpenses}</span> gastos asociados.
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                    Para poder eliminarlo, por favor, selecciona un nuevo capital al que mover estos gastos.
                </p>
                <div>
                     <label htmlFor="targetBudget" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mover gastos a:</label>
                    <select 
                        id="targetBudget" 
                        value={targetBudgetId}
                        onChange={(e) => setTargetBudgetId(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                    >
                       {availableBudgets.map(b => (
                           <option key={b.id} value={b.id}>{b.descripcion}</option>
                       ))}
                    </select>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                    <button 
                        onClick={onClose}
                        type="button" 
                        className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleConfirm}
                        type="button" 
                        className="inline-flex justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                        Mover y Eliminar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ReassignExpensesModal;