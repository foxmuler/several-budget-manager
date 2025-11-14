
import React, { useState, useEffect, useMemo } from 'react';
import { Expense } from '../types';
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
    const { budgets, addExpense, updateExpense, getBudgetRemaining, expenses, addToast, budgetSortOrder, getBudgetExpenses } = useAppContext();

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

    const [formData, setFormData] = useState({
        numeroRefGasto: '',
        descripcion: '',
        importe: '0',
        presupuestoId: defaultBudgetId || '',
    });
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
        } else {
             // For new expenses, set the default budget based on the sorted list.
             // This also handles the case where budgets load asynchronously.
            setFormData(prev => ({
                ...prev, // Keep scanned data if any
                presupuestoId: defaultBudgetId || (sortedBudgets.length > 0 ? sortedBudgets[0].id : ''),
            }));
        }
    }, [expenseToEdit, sortedBudgets, defaultBudgetId]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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

        // Uniqueness check for numeroRefGasto
        const isDuplicateRef = expenses.some(exp => 
            exp.numeroRefGasto.trim().toLowerCase() === formData.numeroRefGasto.trim().toLowerCase() && 
            exp.id !== expenseToEdit?.id
        );
        if (isDuplicateRef) {
            addToast("El número de referencia del gasto ya existe.", 'error');
            return;
        }

        const expenseData = {
            numeroRefGasto: formData.numeroRefGasto,
            descripcion: formData.descripcion,
            importe: parseFloat(formData.importe) || 0,
            presupuestoId: formData.presupuestoId,
        };

        if (expenseData.importe <= 0 || !expenseData.descripcion || !expenseData.numeroRefGasto || !expenseData.presupuestoId) {
             addToast("Por favor, completa todos los campos requeridos.", 'error');
            return;
        }

        let availableBudget = getBudgetRemaining(expenseData.presupuestoId);
        // If editing an expense within the same budget, add its original amount back to calculate available funds.
        if (expenseToEdit && expenseToEdit.presupuestoId === expenseData.presupuestoId) {
            availableBudget += expenseToEdit.importe;
        }
        
        if (expenseData.importe > availableBudget) {
            if (!window.confirm(`Este gasto (${expenseData.importe.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}) excede el capital restante (${getBudgetRemaining(expenseData.presupuestoId).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}). ¿Deseas continuar?`)) {
                return;
            }
        }

        if (expenseToEdit) {
            updateExpense({ ...expenseToEdit, ...expenseData });
            addToast('Gasto actualizado con éxito', 'success');
        } else {
            addExpense(expenseData);
            addToast('Gasto guardado con éxito', 'success');
        }
        onSave();
    };
    
    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="presupuestoId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Asociar a Capital</label>
                    <select id="presupuestoId" name="presupuestoId" value={formData.presupuestoId} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 py-3 pl-3 pr-10 text-lg text-center focus:border-primary-500 focus:outline-none focus:ring-primary-500">
                        {sortedBudgets.map(b => (
                            <option key={b.id} value={b.id}>
                                {b.descripcion} ({getBudgetRemaining(b.id).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} restante)
                            </option>
                        ))}
                    </select>
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
