
import React, { useState, useEffect } from 'react';
import { Budget } from '../types';
import { useAppContext } from '../context/AppContext';
import { PREDEFINED_COLORS } from '../constants';

interface BudgetFormProps {
    onSave: () => void;
    budgetToEdit?: Budget;
}

const formatMonthYear = (dateString: string) => {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${year}`;
};

const BudgetForm = ({ onSave, budgetToEdit }: BudgetFormProps) => {
    const { addBudget, updateBudget, budgets, addToast } = useAppContext();
    const [formData, setFormData] = useState({
        numeroReferencia: '',
        descripcion: '',
        capitalTotal: '0',
        porcentajeUsable: '50',
        color: '',
    });
    
    useEffect(() => {
        if (budgetToEdit) {
            setFormData({
                numeroReferencia: budgetToEdit.numeroReferencia,
                descripcion: budgetToEdit.descripcion,
                capitalTotal: String(budgetToEdit.capitalTotal),
                porcentajeUsable: String(budgetToEdit.porcentajeUsable),
                color: budgetToEdit.color,
            });
        } else {
             const usedColors = new Set(budgets.map(b => b.color));
             const firstAvailableColor = PREDEFINED_COLORS.find(c => !usedColors.has(c));
             setFormData(prev => ({
                 ...prev,
                 color: firstAvailableColor || PREDEFINED_COLORS[0],
                 numeroReferencia: '',
                 descripcion: '',
                 capitalTotal: '0',
                 porcentajeUsable: '50',
             }));
        }
    }, [budgetToEdit, budgets]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Uniqueness check for numeroReferencia
        const isDuplicateRef = budgets.some(b => 
            b.numeroReferencia.trim().toLowerCase() === formData.numeroReferencia.trim().toLowerCase() && 
            b.id !== budgetToEdit?.id
        );
        if (isDuplicateRef) {
            addToast("El número de referencia ya existe.", 'error');
            return;
        }

        // Uniqueness check for color
        const isDuplicateColor = budgets.some(b => 
            b.color === formData.color && 
            b.id !== budgetToEdit?.id
        );
        if (isDuplicateColor) {
            addToast("Este color ya está en uso. Por favor, elige otro.", 'error');
            return;
        }

        const budgetData = {
            numeroReferencia: formData.numeroReferencia,
            descripcion: formData.descripcion,
            capitalTotal: parseFloat(formData.capitalTotal) || 0,
            porcentajeUsable: parseInt(formData.porcentajeUsable, 10) || 0,
            color: formData.color,
        };

        if (budgetData.capitalTotal <= 0 || !budgetData.descripcion || !budgetData.numeroReferencia) {
            addToast("Por favor, completa los campos y asegúrate que el capital sea mayor a cero.", 'error');
            return;
        }

        if (budgetToEdit) {
            updateBudget({ ...budgetToEdit, ...budgetData });
            addToast('Capital actualizado con éxito', 'success');
        } else {
            addBudget(budgetData);
            addToast('Capital guardado con éxito', 'success');
        }
        onSave();
    };
    
    const usedColors = new Set(budgets.filter(b => b.id !== budgetToEdit?.id).map(b => b.color));

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {budgetToEdit && (
                <div className="text-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Creado: {formatMonthYear(budgetToEdit.fechaCreacion)}
                </div>
            )}
            <div>
                <label htmlFor="numeroReferencia" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nº Referencia</label>
                <input type="text" name="numeroReferencia" id="numeroReferencia" value={formData.numeroReferencia} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-lg text-center py-3" />
            </div>
            <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
                <input type="text" name="descripcion" id="descripcion" value={formData.descripcion} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-lg text-center py-3" />
            </div>
            <div>
                <label htmlFor="capitalTotal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Capital Total</label>
                <input type="number" name="capitalTotal" id="capitalTotal" value={formData.capitalTotal} onChange={handleChange} required min="0.01" step="0.01" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-lg text-center py-3" />
            </div>
            <div>
                <label htmlFor="porcentajeUsable" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Porcentaje Usable (%)</label>
                <input type="number" name="porcentajeUsable" id="porcentajeUsable" value={formData.porcentajeUsable} onChange={handleChange} required min="1" max="100" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-lg text-center py-3" />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
                <div className="mt-2 grid grid-cols-6 gap-2">
                    {PREDEFINED_COLORS.map(color => (
                        <button 
                            key={color} 
                            type="button" 
                            onClick={() => {
                                if (!usedColors.has(color)) {
                                    setFormData(prev => ({ ...prev, color }))
                                }
                            }}
                            className={`w-full h-8 rounded-md border-2 transition-transform transform hover:scale-110 ${formData.color === color ? 'border-primary-500 scale-110' : 'border-transparent'} ${usedColors.has(color) ? 'opacity-30 cursor-not-allowed' : ''}`} 
                            style={{ backgroundColor: color }}
                            disabled={usedColors.has(color)}
                            aria-label={`Select color ${color}`}
                        />
                    ))}
                </div>
            </div>
            <div className="flex justify-end pt-2">
                <button type="submit" className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                    {budgetToEdit ? 'Actualizar' : 'Guardar'}
                </button>
            </div>
        </form>
    );
};

export default BudgetForm;
