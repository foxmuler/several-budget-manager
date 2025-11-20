

import React, { useState, useEffect, useMemo } from 'react';
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
    const { addToast, getBudgetRemaining, findAutoBudget, autoDistributionStrategy: defaultStrategy } = useAppContext();
    const [targetBudgetId, setTargetBudgetId] = useState<string>('');
    const [forceManualMode, setForceManualMode] = useState(false);

    const budgetsWithPositiveBalance = useMemo(() => {
        return availableBudgets.filter(b => getBudgetRemaining(b.id) > 0);
    }, [availableBudgets, getBudgetRemaining]);

    useEffect(() => {
        if (budgetsWithPositiveBalance.length > 0) {
            setTargetBudgetId(budgetsWithPositiveBalance[0].id);
        } else {
            setTargetBudgetId('');
        }
        // Reset force manual mode when opening modal
        setForceManualMode(false);
    }, [budgetsWithPositiveBalance, isOpen]);


    const handleConfirm = () => {
        let finalTargetId = targetBudgetId;
        const effectiveStrategy = forceManualMode ? 'manual' : defaultStrategy;

        if (effectiveStrategy !== 'manual' && expenseToMove) {
             const autoId = findAutoBudget(expenseToMove.importe, effectiveStrategy, expenseToMove.presupuestoId);
             if (autoId) {
                 finalTargetId = autoId;
             } else {
                 addToast(`Conflicto: La estrategia "${effectiveStrategy}" no encontró un capital válido. Por favor, selecciona manualmente.`, 'error');
                 setForceManualMode(true);
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
    
    const isAutoMode = defaultStrategy !== 'manual' && !forceManualMode;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Mover Gasto">
            <div className="space-y-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                    Mover el gasto <span className="font-bold">"{expenseToMove.descripcion}"</span>
                    &nbsp;de <span className="font-bold">{expenseToMove.importe.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span> a un nuevo capital.
                </p>

                {/* Strategy dropdown removed - using global setting */}
                
                <div>
                     <label htmlFor="targetBudgetMove" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nuevo capital de destino:</label>
                    <select 
                        id="targetBudgetMove" 
                        value={targetBudgetId}
                        onChange={(e) => setTargetBudgetId(e.target.value)}
                        disabled={isAutoMode}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500"
                    >
                       {budgetsWithPositiveBalance.map(b => (
                           <option key={b.id} value={b.id}>
                               {b.descripcion} ({getBudgetRemaining(b.id).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} restante)
                            </option>
                       ))}
                    </select>
                    {isAutoMode && (
                         <p className="mt-2 text-center text-sm font-bold text-orange-500 dark:text-orange-400">
                            El capital será seleccionado automáticamente: {
                                defaultStrategy === 'best-fit' ? 'Ajustado al gasto' :
                                defaultStrategy === 'largest-available' ? 'Último Capital Grande' :
                                defaultStrategy === 'newest' ? 'Último capital introducido' :
                                defaultStrategy === 'oldest' ? 'Capital más antiguo' : 'Capital Auto'
                            }
                        </p>
                    )}
                    {/* Logic for manual feedback when no budgets */}
                    {!isAutoMode && budgetsWithPositiveBalance.length === 0 && (
                        <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
                            No hay otros capitales con saldo positivo disponibles para mover el gasto.
                        </p>
                    )}
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
                        disabled={!isAutoMode && budgetsWithPositiveBalance.length === 0}
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