
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { APP_VERSION, APP_AUTHOR } from '../../constants';
import { Budget, Expense } from '../../types';
import FeaturesModal from '../ui/FeaturesModal';

const CloseIcon = ({ className }: { className: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24" fill="currentColor"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" /></svg>
);
const SearchIcon = ({className}: {className: string}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
);
const FolderIcon = ({ className }: { className: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24" fill="currentColor"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
);

const formatMonthYear = (dateString: string) => {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${year}`;
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchResult = {
    budgets: Budget[],
    expenses: (Expense & { budgetDescripcion: string })[],
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const { budgets, expenses, getBudgetExpenses } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ year: '', month: '', day: '' });
    const location = useLocation();
    const [isFeaturesModalOpen, setIsFeaturesModalOpen] = useState(false);

    useEffect(() => {
        if(isOpen) {
            onClose();
        }
    }, [location]);

    const budgetMap = useMemo(() => new Map(budgets.map(b => [b.id, b])), [budgets]);

    const { years } = useMemo(() => {
        const yearSet = new Set<string>();
        [...budgets, ...expenses].forEach(item => {
            const date = new Date('fecha' in item ? item.fecha : item.fechaCreacion);
            if (!isNaN(date.getTime())) {
                yearSet.add(date.getFullYear().toString());
            }
        });
        return { 
            years: Array.from(yearSet).sort((a,b) => parseInt(b) - parseInt(a)), 
        };
    }, [budgets, expenses]);

    const archivedBudgetsByYear = useMemo(() => {
        return budgets
            .filter(b => b.isArchived)
            .reduce((acc, budget) => {
                const year = new Date(budget.fechaModificacion).getFullYear().toString();
                if (!acc[year]) {
                    acc[year] = [];
                }
                acc[year].push(budget);
                return acc;
            }, {} as Record<string, Budget[]>);
    }, [budgets]);
    
    const searchResults = useMemo((): SearchResult => {
        if (!searchTerm.trim() && !filters.year && !filters.month && !filters.day) {
            return { budgets: [], expenses: [] };
        }
        const lowercasedFilter = searchTerm.toLowerCase();

        const filteredBudgets = budgets.filter(b => {
             const date = new Date(b.fechaCreacion);
             if (isNaN(date.getTime())) return false;
             const yearMatch = !filters.year || date.getFullYear().toString() === filters.year;
             const monthMatch = !filters.month || (date.getMonth() + 1).toString() === filters.month;
             const dayMatch = !filters.day || date.getDate().toString() === filters.day;
             const termMatch = !searchTerm.trim() || b.descripcion.toLowerCase().includes(lowercasedFilter) || b.numeroReferencia.toLowerCase().includes(lowercasedFilter);
            
            return termMatch && yearMatch && monthMatch && dayMatch;
        });

        const filteredExpenses = expenses
            .filter(e => {
                const date = new Date(e.fecha);
                if (isNaN(date.getTime())) return false;
                const yearMatch = !filters.year || date.getFullYear().toString() === filters.year;
                const monthMatch = !filters.month || (date.getMonth() + 1).toString() === filters.month;
                const dayMatch = !filters.day || date.getDate().toString() === filters.day;

                const termMatch = !searchTerm.trim() || e.descripcion.toLowerCase().includes(lowercasedFilter) || e.numeroRefGasto.toLowerCase().includes(lowercasedFilter);

                return termMatch && yearMatch && dayMatch;
            })
            .map(e => ({...e, budgetDescripcion: budgetMap.get(e.presupuestoId)?.descripcion || 'N/A' }));

        return { budgets: filteredBudgets, expenses: filteredExpenses };
    }, [searchTerm, filters, budgets, expenses, budgetMap]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const currentYear = new Date().getFullYear();
    const hasActiveSearch = searchTerm.trim().length > 0 || filters.year || filters.month || filters.day;

    return (
        <>
            <div 
                className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
                onClick={onClose} 
                aria-hidden="true"
            />
            <aside 
                className={`fixed top-0 left-0 h-full w-full max-w-sm bg-white dark:bg-gray-800 shadow-lg z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="sidebar-title"
            >
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 id="sidebar-title" className="text-lg font-semibold text-gray-800 dark:text-gray-100">Menú</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                            <CloseIcon className="w-6 h-6 text-gray-600 dark:text-gray-300"/>
                        </button>
                    </div>

                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="relative">
                             <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <SearchIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="search"
                                placeholder="Buscar por referencia, descripción..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 pl-10 py-3 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            />
                             {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                                    aria-label="Clear search"
                                >
                                    <CloseIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-4">
                            <select name="year" value={filters.year} onChange={handleFilterChange} aria-label="Filtrar por año" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500">
                                <option value="">Año</option>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <select name="month" value={filters.month} onChange={handleFilterChange} aria-label="Filtrar por mes" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500">
                                <option value="">Mes</option>
                                {Array.from({length: 12}, (_, i) => i+1).map(m => <option key={m} value={m}>{new Date(2000, m-1, 1).toLocaleString('es-ES', {month: 'long'})}</option>)}
                            </select>
                            <select name="day" value={filters.day} onChange={handleFilterChange} aria-label="Filtrar por día" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500">
                                <option value="">Día</option>
                                {Array.from({length: 31}, (_, i) => i+1).map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        {hasActiveSearch ? (
                            <>
                                {searchResults.budgets.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold text-gray-600 dark:text-gray-300 mb-2">Resultados de Capitales</h3>
                                        <div className="space-y-2">
                                            {searchResults.budgets.map(b => (
                                                <div key={b.id} onClick={() => window.location.hash = `/budget/${b.id}`} className="block p-2 rounded-md bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1 truncate">
                                                            <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{b.descripcion}</p>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">{b.numeroReferencia}</p>
                                                        </div>
                                                        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2 pt-1">
                                                            {new Date(b.fechaCreacion).toLocaleDateString('es-ES')}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {searchResults.expenses.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold text-gray-600 dark:text-gray-300 mb-2">Resultados de Gastos</h3>
                                        <div className="space-y-2">
                                            {searchResults.expenses.map(e => (
                                                <div key={e.id} onClick={() => window.location.hash = `/budget/${e.presupuestoId}`} className="block p-2 rounded-md bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1 truncate">
                                                            <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{e.descripcion}</p>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{e.numeroRefGasto} - <span className="italic">{e.budgetDescripcion}</span></p>
                                                        </div>
                                                        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2 pt-1">
                                                            {new Date(e.fecha).toLocaleDateString('es-ES')}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {searchResults.budgets.length === 0 && searchResults.expenses.length === 0 && (
                                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">No se encontraron resultados.</p>
                                )}
                            </>
                        ) : (
                             <div>
                                <h3 className="font-semibold text-gray-600 dark:text-gray-300 mb-2">Capitales Archivados (BackOffice)</h3>
                                {Object.keys(archivedBudgetsByYear).length > 0 ? (
                                    Object.keys(archivedBudgetsByYear).sort((a,b) => parseInt(b) - parseInt(a)).map(year => (
                                        <details key={year} className="group" open={year === currentYear.toString()}>
                                            <summary className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50">
                                                <FolderIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                                <span className="font-medium">{year}</span>
                                            </summary>
                                            <div className="pl-6 pt-2 space-y-2">
                                                {archivedBudgetsByYear[year].map(b => {
                                                    const expenseCount = getBudgetExpenses(b.id).length;
                                                    return (
                                                        <div key={b.id} onClick={() => window.location.hash = `/budget/${b.id}`} className="block p-2 rounded-md bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                                                            <div className="flex items-center gap-2">
                                                                {expenseCount > 0 && (
                                                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                                                        {expenseCount}
                                                                    </span>
                                                                )}
                                                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: b.color }}></div>
                                                                <div className="flex-1 truncate">
                                                                    <p className="font-medium text-gray-800 dark:text-gray-100 truncate">
                                                                        {b.descripcion}
                                                                        <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                                                                            {formatMonthYear(b.fechaCreacion)}
                                                                        </span>
                                                                    </p>
                                                                    <div className="flex justify-between items-center">
                                                                        <p className="text-sm text-gray-500 dark:text-gray-400">{b.numeroReferencia}</p>
                                                                        <p className="text-xs text-gray-400 dark:text-gray-500 italic">Off {formatMonthYear(b.fechaModificacion)}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 pl-5">
                                                                Total Gastado: {
                                                                    (b.capitalTotal * b.porcentajeUsable / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR'})
                                                                }
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </details>
                                    ))
                                ) : (
                                     <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">No hay capitales archivados.</p>
                                )}
                             </div>
                        )}
                    </div>
                    
                    <div 
                        onDoubleClick={() => setIsFeaturesModalOpen(true)}
                        title="Doble clic para ver las características"
                        className="p-4 mt-auto border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500 dark:text-gray-400 cursor-pointer"
                    >
                        <p>Several V 1.0</p>
                        <p>By {APP_AUTHOR}{currentYear}</p>
                    </div>
                </div>
            </aside>
            <FeaturesModal isOpen={isFeaturesModalOpen} onClose={() => setIsFeaturesModalOpen(false)} />
        </>
    );
};

export default Sidebar;
