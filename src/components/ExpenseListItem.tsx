
import React, { useMemo, useRef, useState } from 'react';
import { Expense } from '../types';
import { useAppContext } from '../context/AppContext';

interface ExpenseListItemProps {
    expense: Expense;
    onEdit: () => void;
    onDelete: (expense: Expense) => void;
    onMoveRequest: (expense: Expense) => void;
    showBudgetInfo?: boolean;
}
const EditIcon = ({ className }: { className: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
    </svg>
);

const DeleteIcon = ({ className }: { className: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
    </svg>
);

// FIX: Typed the component with React.FC to resolve type errors when passing the key prop.
const ExpenseListItem: React.FC<ExpenseListItemProps> = ({ expense, onEdit, onDelete, onMoveRequest, showBudgetInfo = false }) => {
    const { budgets } = useAppContext();
    const budget = useMemo(() => budgets.find(b => b.id === expense.presupuestoId), [budgets, expense.presupuestoId]);

    const [translateX, setTranslateX] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const touchStartX = useRef(0);
    const itemRef = useRef<HTMLDivElement>(null);
    const isSwiping = useRef(false);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        isSwiping.current = true;
        if(itemRef.current) {
            itemRef.current.style.transition = 'none';
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isSwiping.current) return;
        const currentX = e.touches[0].clientX;
        const deltaX = currentX - touchStartX.current;
        setTranslateX(deltaX);
    };
    
    const handleTouchEnd = () => {
        if (!isSwiping.current) return;
        isSwiping.current = false;
         if(itemRef.current) {
            itemRef.current.style.transition = 'transform 0.3s ease-out, max-height 0.3s ease-out, opacity 0.3s ease-out';
            const threshold = itemRef.current.offsetWidth / 3;

            if (Math.abs(translateX) > threshold) {
                const finalTranslateX = translateX > 0 ? itemRef.current.offsetWidth : -itemRef.current.offsetWidth;
                setTranslateX(finalTranslateX);
                setIsDeleting(true);
                setTimeout(() => {
                    onDelete(expense);
                }, 300);
            } else {
                setTranslateX(0);
            }
        }
    };


    return (
        <div className="relative overflow-hidden rounded-lg">
             <div className="absolute inset-0 bg-red-500 flex items-center justify-between px-6">
                
            </div>

            <div 
                ref={itemRef}
                onDoubleClick={() => onMoveRequest(expense)}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ transform: `translateX(${translateX}px)` }}
                className={`flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 relative ${isDeleting ? 'opacity-0' : 'opacity-100'} cursor-pointer`}
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline">
                        <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{expense.descripcion}</p>
                        <span className="ml-3 text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">{expense.numeroRefGasto}</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <span>{new Date(expense.fecha).toLocaleDateString('es-ES')}</span>
                         {showBudgetInfo && budget && (
                             <div className="flex items-center truncate ml-2 pl-2 border-l border-gray-300 dark:border-gray-600 min-w-0">
                                <span className="truncate">{budget.descripcion}</span>
                                <span className="ml-2 text-gray-400 dark:text-gray-500 flex-shrink-0">{budget.numeroReferencia}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center ml-4">
                    <span className="font-semibold text-red-500 dark:text-red-400 mr-4">
                        -{expense.importe.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </span>
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                if (Math.abs(translateX) < 10) onEdit();
                            }}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            aria-label="Editar Gasto"
                        >
                            <EditIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExpenseListItem;