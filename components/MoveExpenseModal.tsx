import React, { useState, useEffect } from 'react';
import { Budget, Expense } from '../types';
import Modal from './ui/Modal';
import { useAppContext } from '../context/AppContext';

interface MoveExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (targetBudgetId: string) => void;
    expenseToMove: Expense | null;
    availableBudgets: Budget[];
}

const MoveExpenseModal = ({ isOpen, onClose, onConfirm, expenseToMove, availableBudgets }: MoveExpenseModalProps) => {
    const { addToast } = useAppContext();
    const [targetBudgetId, setTargetBudgetId] = useState<string>('');

    useEffect(() => {
        if (availableBudgets.length > 0) {
            setTargetBudgetId(availableBudgets[0].id);
        } else {
            setTargetBudgetId('');
        }
    }, [availableBudgets, isOpen]);

    const handleConfirm = () => {
        if(targetBudgetId) {
            onConfirm(targetBudgetId);
        } else {
            addToast("Por favor, selecciona un capital de destino.", 'error');
        }
    };
    
    if (!expenseToMove) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Mover Gasto">
            <div className="space-y-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                    Mover el gasto <span className="font-bold">"{expenseToMove.descripcion}"</span>
                    &nbsp;de <span className="font-bold">{expenseToMove.importe.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span> a un nuevo capital.
                </p>
                
                {availableBudgets.length > 0 ? (
                    <div>
                         <label htmlFor="targetBudgetMove" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nuevo capital de destino:</label>
                        <select 
                            id="targetBudgetMove" 
                            value={targetBudgetId}
                            onChange={(e) => setTargetBudgetId(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                        >
                           {availableBudgets.map(b => (
                               <option key={b.id} value={b.id}>{b.descripcion}</option>
                           ))}
                        </select>
                    </div>
                ) : (
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        No hay otros capitales disponibles para mover el gasto.
                    </p>
                )}
                
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
                        disabled={availableBudgets.length === 0}
                        className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Mover
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default MoveExpenseModal;