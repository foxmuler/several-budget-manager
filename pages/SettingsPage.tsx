
import React, { useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Theme, BudgetSortOrder, ExpenseSortOrder } from '../types';
import { APP_VERSION, APP_AUTHOR } from '../constants';

const SettingsPage = () => {
    const { theme, setTheme, budgets, expenses, importData, addToast, budgetSortOrder, setBudgetSortOrder, expenseSortOrder, setExpenseSortOrder, zeroBalanceColor, setZeroBalanceColor } = useAppContext();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        const data = {
            meta: {
                version: APP_VERSION,
                createdAt: new Date().toISOString()
            },
            budgets,
            expenses
        };
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
        const link = document.createElement('a');
        link.href = jsonString;
        link.download = `several-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };
    
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target?.result;
                    if (typeof text !== 'string') throw new Error('File could not be read');
                    const data = JSON.parse(text);
                    if (data.budgets && data.expenses) {
                         if (window.confirm('¿Importar datos? Esto sobreescribirá todos los datos actuales.')) {
                            importData({ budgets: data.budgets, expenses: data.expenses });
                            addToast('Datos importados con éxito.', 'success');
                         }
                    } else {
                        throw new Error('Archivo JSON no válido.');
                    }
                } catch (error) {
                    addToast(`Error al importar el archivo: ${error instanceof Error ? error.message : String(error)}`, 'error');
                } finally {
                    // Reset file input
                    if(fileInputRef.current) {
                        fileInputRef.current.value = "";
                    }
                }
            };
            reader.readAsText(file);
        }
    };
    
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Configuración</h1>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                <h2 className="text-lg font-semibold mb-3">Apariencia</h2>
                <div className="space-y-4">
                    <div>
                        <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Tema</h3>
                        <div className="flex space-x-2">
                            {(['light', 'dark', 'system'] as Theme[]).map(t => (
                                <button 
                                    key={t}
                                    onClick={() => setTheme(t)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                                        theme === t
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {t === 'light' ? 'Claro' : t === 'dark' ? 'Oscuro' : 'Sistema'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="zeroBalanceColor" className="block text-md font-medium text-gray-700 dark:text-gray-300">Color para Capitales Agotados</label>
                        <div className="mt-2 flex items-center gap-3">
                            <input
                                type="color"
                                id="zeroBalanceColor"
                                value={zeroBalanceColor}
                                onChange={(e) => setZeroBalanceColor(e.target.value)}
                                className="p-1 h-10 w-14 block bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 cursor-pointer rounded-lg"
                            />
                            <span className="text-sm text-gray-500 dark:text-gray-400">Selecciona el color para capitales con 0€ o menos de restante.</span>
                        </div>
                    </div>
                </div>
            </div>

             <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                <h2 className="text-lg font-semibold mb-3">Ordenación de Capitales</h2>
                <div>
                    <label htmlFor="budgetSortOrder" className="sr-only">Ordenar capitales por</label>
                    <select 
                        id="budgetSortOrder" 
                        value={budgetSortOrder}
                        onChange={(e) => setBudgetSortOrder(e.target.value as BudgetSortOrder)}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                    >
                        <option value="date-desc">Fecha (más reciente)</option>
                        <option value="date-asc">Fecha (más antiguo)</option>
                        <option value="remaining-desc">Capital restante (mayor a menor)</option>
                        <option value="remaining-asc">Capital restante (menor a mayor)</option>
                        <option value="expenses-desc">Nº de gastos (mayor a menor)</option>
                        <option value="expenses-asc">Nº de gastos (menor a mayor)</option>
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                <h2 className="text-lg font-semibold mb-3">Ordenación de Gastos</h2>
                <div>
                    <label htmlFor="expenseSortOrder" className="sr-only">Ordenar gastos por</label>
                    <select 
                        id="expenseSortOrder" 
                        value={expenseSortOrder}
                        onChange={(e) => setExpenseSortOrder(e.target.value as ExpenseSortOrder)}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                    >
                        <option value="date-desc">Fecha (más reciente)</option>
                        <option value="date-asc">Fecha (más antiguo)</option>
                        <option value="amount-desc">Importe (mayor a menor)</option>
                        <option value="amount-asc">Importe (menor a mayor)</option>
                        <option value="description-asc">Descripción (A-Z)</option>
                        <option value="description-desc">Descripción (Z-A)</option>
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                <h2 className="text-lg font-semibold mb-3">Datos</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                        onClick={handleExport}
                        className="w-full sm:w-auto flex-1 text-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        Exportar a JSON
                    </button>
                    <button 
                        onClick={handleImportClick}
                        className="w-full sm:w-auto flex-1 text-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        Importar desde JSON
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
