

import React, { useState, useEffect, useMemo } from 'react';
import { Budget, Expense, AutoDistributionStrategy } from '../types';
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
    const { addToast, getBudgetRemaining, findAutoBudget, autoDistributionStrategy: defaultStrategy } = useAppContext();
    const [targetBudgetId, setTargetBudgetId] = useState<string>('');
    const [selectedStrategy, setSelectedStrategy] = useState<AutoDistributionStrategy>(defaultStrategy);

    const budgetsWithPositiveBalance = useMemo(() => {
        return availableBudgets.filter(b => getBudgetRemaining(b.id) > 0);
    }, [availableBudgets, getBudgetRemaining]);

    useEffect(() => {
        if (budgetsWithPositiveBalance.length > 0) {
            setTargetBudgetId(budgetsWithPositiveBalance[0].id);
        } else {
            setTargetBudgetId('');
        }
        // Initialize with global preference when opening
        setSelectedStrategy(defaultStrategy);
    }, [budgetsWithPositiveBalance, isOpen, defaultStrategy]);

    const handleStrategyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedStrategy(e.target.value as AutoDistributionStrategy);
    };

    const handleConfirm = () => {
        let finalTargetId = targetBudgetId;

        if (selectedStrategy !== 'manual' && expenseToMove) {
             const autoId = findAutoBudget(expenseToMove.importe, selectedStrategy, expenseToMove.presupuestoId);
             if (autoId) {
                 finalTargetId = autoId;
             } else {
                 addToast(`Conflicto: La estrategia "${selectedStrategy}" no encontró un capital válido. Por favor, selecciona manualmente.`, 'error');
                 setSelectedStrategy('manual');
                 return;
             }
        }

        if (!finalTargetId) {
            addToast("Por favor, selecciona un capital de destino.", 'error');
            return;
        }
        
        if (expenseToMove) {
            const targetBudgetRemaining = getBudgetRemaining(finalTargetId);
            if (expenseToMove.importe > targetBudgetRemaining) {
                const remainingStr = targetBudgetRemaining.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
                addToast(`El gasto excede el capital restante del destino. Fondos disponibles: ${remainingStr}`, 'error');
                return;
            }
        }
        
        onConfirm(finalTargetId);
    };
    
    if (!expenseToMove) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Mover Gasto">
            <div className="space-y-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                    Mover el gasto <span className="font-bold">"{expenseToMove.descripcion}"</span>
                    &nbsp;de <span className="font-bold">{expenseToMove.importe.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span> a un nuevo capital.
                </p>

                 <div>
                     <label htmlFor="moveStrategy" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Auto-repartición de Capital</label>
                    <select 
                        id="moveStrategy" 
                        value={selectedStrategy} 
                        onChange={handleStrategyChange} 
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                    >
                        <option value="manual">Capital Manual</option>
                        <option value="best-fit">Capital ajustado al gasto</option>
                        <option value="largest-available">Último Capital Grande</option>
                        <option value="newest">Último capital introducido</option>
                        <option value="oldest">Capital más antiguo</option>
                        <option value="random">Capital Auto (Rotación)</option>
                    </select>
                </div>
                
                {selectedStrategy === 'manual' ? (
                    budgetsWithPositiveBalance.length > 0 ? (
                        <div>
                             <label htmlFor="targetBudgetMove" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nuevo capital de destino:</label>
                            <select 
                                id="targetBudgetMove" 
                                value={targetBudgetId}
                                onChange={(e) => setTargetBudgetId(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                            >
                               {budgetsWithPositiveBalance.map(b => (
                                   <option key={b.id} value={b.id}>
                                       {b.descripcion} ({getBudgetRemaining(b.id).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} restante)
                                    </option>
                               ))}
                            </select>
                        </div>
                    ) : (
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                            No hay otros capitales con saldo positivo disponibles para mover el gasto.
                        </p>
                    )
                ) : (
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md text-center text-sm text-gray-600 dark:text-gray-300">
                        El destino será calculado automáticamente: <strong>{selectedStrategy}</strong>
                    </div>
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
                        disabled={selectedStrategy === 'manual' && budgetsWithPositiveBalance.length === 0}
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