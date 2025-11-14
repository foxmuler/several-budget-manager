
import React from 'react';
import { Budget } from '../types';
import { useAppContext } from '../context/AppContext';

interface BudgetCardProps {
    budget: Budget;
    onDeleteRequest: (budget: Budget) => void;
}

// FIX: Typed the component with React.FC to resolve type errors when passing the 'key' prop.
const BudgetCard: React.FC<BudgetCardProps> = ({ budget, onDeleteRequest }) => {
    const { getBudgetRemaining, getBudgetEffectiveColor } = useAppContext();
    const remaining = getBudgetRemaining(budget.id);
    const initialAvailable = (budget.capitalTotal * budget.porcentajeUsable) / 100;
    const spent = initialAvailable - remaining;
    const spentPercentage = initialAvailable > 0 ? Math.max(0, Math.min(100, (spent / initialAvailable) * 100)) : 0;
    const effectiveColor = getBudgetEffectiveColor(budget);
    
    const handleNavigate = () => {
        window.location.hash = `/budget/${budget.id}`;
    };

    return (
        <div
            onClick={handleNavigate}
            className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-transform transform hover:scale-105 hover:shadow-xl cursor-pointer"
        >
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg truncate text-gray-800 dark:text-gray-100">{budget.descripcion}</h3>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: effectiveColor }}></div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{budget.numeroReferencia}</div>
            <div className="mt-4">
                <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Restante</span>
                    <span className="font-semibold text-lg" style={{color: effectiveColor}}>
                        {remaining.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${spentPercentage}%`, backgroundColor: effectiveColor }}></div>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">
                    Total: {initialAvailable.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </div>
            </div>
        </div>
    );
};

export default BudgetCard;
