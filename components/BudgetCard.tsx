import React, { useRef, useState } from 'react';
import { Budget } from '../types';
import { useAppContext } from '../context/AppContext';

interface BudgetCardProps {
    budget: Budget;
    onDeleteRequest: (budget: Budget) => void;
}

const DeleteIcon = ({ className }: { className: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
    </svg>
);

// FIX: Typed the component with React.FC to resolve type errors when passing the 'key' prop.
const BudgetCard: React.FC<BudgetCardProps> = ({ budget, onDeleteRequest }) => {
    const { getBudgetRemaining, getBudgetExpenses } = useAppContext();
    const remaining = getBudgetRemaining(budget.id);
    const initialAvailable = (budget.capitalTotal * budget.porcentajeUsable) / 100;
    const spent = initialAvailable - remaining;
    const spentPercentage = initialAvailable > 0 ? Math.max(0, Math.min(100, (spent / initialAvailable) * 100)) : 0;
    
    const expenseCount = getBudgetExpenses(budget.id).length;

    const [translateX, setTranslateX] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const touchStartX = useRef(0);
    const cardRef = useRef<HTMLDivElement>(null);
    const isSwiping = useRef(false);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        isSwiping.current = false;
        if(cardRef.current) {
            cardRef.current.style.transition = 'none';
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const currentX = e.touches[0].clientX;
        const deltaX = currentX - touchStartX.current;
        
        if (Math.abs(deltaX) > 10) {
            isSwiping.current = true;
        }

        if (isSwiping.current) {
            setTranslateX(deltaX);
        }
    };
    
    const handleTouchEnd = () => {
        if (!isSwiping.current) return;
        
         if(cardRef.current) {
            cardRef.current.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
            const threshold = cardRef.current.offsetWidth / 3;

            if (Math.abs(translateX) > threshold) {
                const finalTranslateX = translateX > 0 ? cardRef.current.offsetWidth : -cardRef.current.offsetWidth;
                setTranslateX(finalTranslateX);
                setIsDeleting(true);
                setTimeout(() => {
                    onDeleteRequest(budget);
                    setTimeout(() => {
                        if (cardRef.current) {
                            cardRef.current.style.transition = 'none';
                            setTranslateX(0);
                            setIsDeleting(false);
                        }
                    }, 350);
                }, 300);
            } else {
                setTranslateX(0);
            }
        }
        setTimeout(() => {
            isSwiping.current = false;
        }, 100);
    };

    const handleNavigate = () => {
        if (!isSwiping.current && Math.abs(translateX) < 10) {
            window.location.hash = `/budget/${budget.id}`;
        }
    };

    return (
        <div className="relative overflow-hidden rounded-lg">
             <div className="absolute inset-0 bg-red-500 flex items-center justify-between px-6 text-white font-bold rounded-lg">
                <DeleteIcon className="w-7 h-7"/>
                <span>Eliminar</span>
                <DeleteIcon className="w-7 h-7"/>
            </div>
            <div
                ref={cardRef}
                onClick={handleNavigate}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ transform: `translateX(${translateX}px)` }}
                className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-transform transform hover:scale-105 hover:shadow-xl cursor-pointer"
            >
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg truncate text-gray-800 dark:text-gray-100">{budget.descripcion}</h3>
                    <div className="flex items-center">
                        {budget.isRestored && <span className="text-xs font-bold mr-1.5 text-gray-500 dark:text-gray-400" title="Restaurado">R</span>}
                        {expenseCount > 0 && (
                            <span className="text-xs font-bold mr-1.5 text-gray-500 dark:text-gray-400">
                                {expenseCount}
                            </span>
                        )}
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: budget.color }}></div>
                    </div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{budget.numeroReferencia}</div>
                <div className="mt-4">
                    <div className="flex justify-between items-baseline mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Restante</span>
                        <span className="font-semibold text-lg" style={{color: budget.color}}>
                            {remaining.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ width: `${spentPercentage}%`, backgroundColor: budget.color }}></div>
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">
                        Total: {initialAvailable.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BudgetCard;