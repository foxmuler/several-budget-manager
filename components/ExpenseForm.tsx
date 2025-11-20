

import React, { useState, useEffect, useMemo } from 'react';
import { Expense, AutoDistributionStrategy } from '../types';
import { useAppContext } from '../context/AppContext';
import CameraScannerModal from './ui/CameraScannerModal';
import { OcrData } from '../services/gemini';

interface ExpenseFormProps {
    onSave: () => void;
    expenseToEdit?: Expense;
    defaultBudgetId?: string;
}

const CameraIcon = ({ className }: { className: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4h-3.17L15 2H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h4.05l1.83-2h4.24l1.83 2H20v12zM12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z"/></svg>
);


const ExpenseForm = ({ onSave, expenseToEdit, defaultBudgetId }: ExpenseFormProps) => {
    const { budgets, addExpense, updateExpense, getBudgetRemaining, expenses, addToast, budgetSortOrder, getBudgetExpenses, autoDistributionStrategy: defaultStrategy, findAutoBudget } = useAppContext();

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

    const availableBudgetsForForm = useMemo(() => {
        return sortedBudgets.filter(b => {
            if (expenseToEdit && b.id === expenseToEdit.presupuestoId) {
                return true;
            }
            return getBudgetRemaining(b.id) > 0;
        });
    }, [sortedBudgets, getBudgetRemaining, expenseToEdit]);


    const [formData, setFormData] = useState({
        numeroRefGasto: '',
        descripcion: '',
        importe: '0',
        presupuestoId: defaultBudgetId || '',
    });
    const [selectedStrategy, setSelectedStrategy] = useState<AutoDistributionStrategy>(defaultStrategy);
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        if (expenseToEdit) {
            setFormData({
                numeroRefGasto: expenseToEdit.numeroRefGasto,
                descripcion: expenseToEdit.descripcion,
                importe: String(expenseToEdit.importe),
                presupuestoId: expenseToEdit.presupuestoId,
            });
            // When editing, typically we start in Manual mode to show the current budget
            setSelectedStrategy('manual');
        } else {
            setFormData(prev => ({
                ...prev,
                presupuestoId: defaultBudgetId || (availableBudgetsForForm.length > 0 ? availableBudgetsForForm[0].id : ''),
            }));
            // Use global default strategy
            setSelectedStrategy(defaultStrategy);
        }
    }, [expenseToEdit, availableBudgetsForForm, defaultBudgetId, defaultStrategy]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleStrategyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedStrategy(e.target.value as AutoDistributionStrategy);
    };

    const handleScanSuccess = (data: OcrData) => {
        setFormData(prev => ({
            ...prev,
            numeroRefGasto: data.numeroRefGasto || '',
            importe: String(data.importe || 0),
        }));
        setIsCameraModalOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const amount = parseFloat(formData.importe) || 0;
        if (amount <= 0 || !formData.descripcion || !formData.numeroRefGasto) {
             addToast("Por favor, completa todos los campos requeridos.", 'error');
            return;
        }

        // Uniqueness check for numeroRefGasto
        const isDuplicateRef = expenses.some(exp => 
            exp.numeroRefGasto.trim().toLowerCase() === formData.numeroRefGasto.trim().toLowerCase() && 
            exp.id !== expenseToEdit?.id
        );
        if (isDuplicateRef) {
            addToast("El número de referencia del gasto ya existe.", 'error');
            return;
        }

        // Determine Target Budget ID
        let targetBudgetId = formData.presupuestoId;
        
        if (selectedStrategy !== 'manual') {
            const autoId = findAutoBudget(amount, selectedStrategy);
            if (autoId) {
                targetBudgetId = autoId;
            } else {
                // Fallback to manual if auto strategy fails
                addToast(`Conflicto: La estrategia "${selectedStrategy}" no encontró un capital válido. Por favor, selecciona manualmente.`, 'error');
                setSelectedStrategy('manual');
                return;
            }
        }

        if (!targetBudgetId) {
             addToast("Por favor, selecciona un capital.", 'error');
             return;
        }


        const expenseData = {
            numeroRefGasto: formData.numeroRefGasto,
            descripcion: formData.descripcion,
            importe: amount,
            presupuestoId: targetBudgetId,
        };


        const targetBudgetRemaining = getBudgetRemaining(expenseData.presupuestoId);
        const formatCurrency = (amount: number) => amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });


        if (expenseToEdit) {
            // UPDATING an existing expense
            if (expenseToEdit.presupuestoId === expenseData.presupuestoId) {
                // Budget is the same, check the difference
                const diff = expenseData.importe - expenseToEdit.importe;
                if (diff > targetBudgetRemaining) {
                    addToast(`El importe del gasto excede el capital restante. Fondos disponibles: ${formatCurrency(targetBudgetRemaining)}`, 'error');
                    return;
                }
            } else {
                // Budget is changing, check the full amount against the new budget
                if (expenseData.importe > targetBudgetRemaining) {
                     addToast(`El importe del gasto excede el capital del nuevo presupuesto. Fondos disponibles: ${formatCurrency(targetBudgetRemaining)}`, 'error');
                    return;
                }
            }
            updateExpense({ ...expenseToEdit, ...expenseData });
            addToast('Gasto actualizado con éxito', 'success');
        } else {
            // ADDING a new expense
            if (expenseData.importe > targetBudgetRemaining) {
                addToast(`El importe del gasto excede el capital restante. Fondos disponibles: ${formatCurrency(targetBudgetRemaining)}`, 'error');
                return;
            }
            addExpense(expenseData);
            addToast('Gasto guardado con éxito', 'success');
        }
        
        onSave();
    };
    
    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                     <label htmlFor="distributionStrategy" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Auto-repartición de Capital</label>
                    <select 
                        id="distributionStrategy" 
                        value={selectedStrategy} 
                        onChange={handleStrategyChange} 
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 py-3 pl-3 pr-10 text-lg text-center focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    >
                        <option value="manual">Capital Manual</option>
                        <option value="best-fit">Capital ajustado al gasto</option>
                        <option value="largest-available">Último Capital Grande</option>
                        <option value="newest">Último capital introducido</option>
                        <option value="oldest">Capital más antiguo</option>
                        <option value="random">Capital Auto (Rotación)</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="presupuestoId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Asociar a Capital</label>
                    <select 
                        id="presupuestoId" 
                        name="presupuestoId" 
                        value={formData.presupuestoId} 
                        onChange={handleChange} 
                        required 
                        disabled={selectedStrategy !== 'manual'}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 py-3 pl-3 pr-10 text-lg text-center focus:border-primary-500 focus:outline-none focus:ring-primary-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500"
                    >
                        {availableBudgetsForForm.map(b => (
                            <option key={b.id} value={b.id}>
                                {b.descripcion} ({getBudgetRemaining(b.id).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} restante)
                            </option>
                        ))}
                    </select>
                    {selectedStrategy !== 'manual' && (
                         <p className="mt-2 text-center text-sm font-bold text-orange-500 dark:text-orange-400">
                            El capital será seleccionado automáticamente: {
                                selectedStrategy === 'best-fit' ? 'Ajustado al gasto' :
                                selectedStrategy === 'largest-available' ? 'Último Capital Grande' :
                                selectedStrategy === 'newest' ? 'Último capital introducido' :
                                selectedStrategy === 'oldest' ? 'Capital más antiguo' : 'Capital Auto'
                            }
                        </p>
                    )}
                </div>

                <div className="pt-2">
                    <button
                        type="button"
                        onClick={() => setIsCameraModalOpen(true)}
                        disabled={isScanning}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400"
                    >
                        <CameraIcon className="w-5 h-5" />
                        Escanear Factura
                    </button>
                </div>
                
                <div className="relative flex items-center pt-2">
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                    <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400 text-sm">O rellenar manualmente</span>
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                </div>

                <div>
                    <label htmlFor="numeroRefGasto" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nº Referencia Gasto</label>
                    <input type="text" name="numeroRefGasto" id="numeroRefGasto" value={formData.numeroRefGasto} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-lg text-center py-3" />
                </div>
                <div>
                    <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
                    <input type="text" name="descripcion" id="descripcion" value={formData.descripcion} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-lg text-center py-3" />
                </div>
                <div>
                    <label htmlFor="importe" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Importe Gastado</label>
                    <input type="number" name="importe" id="importe" value={formData.importe} onChange={handleChange} required min="0.01" step="0.01" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-lg text-center py-3" />
                </div>
                <div className="flex justify-end pt-2">
                    <button type="submit" className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                        {expenseToEdit ? 'Actualizar' : 'Guardar'}
                    </button>
                </div>
            </form>
            <CameraScannerModal
                isOpen={isCameraModalOpen}
                onClose={() => setIsCameraModalOpen(false)}
                onScanSuccess={handleScanSuccess}
                isScanning={isScanning}
                setIsScanning={setIsScanning}
            />
        </>
    );
};

export default ExpenseForm;