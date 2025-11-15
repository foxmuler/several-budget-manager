

import React, { useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Theme, BudgetSortOrder, ExpenseSortOrder, AppConfig, AppData } from '../types';
import { APP_VERSION } from '../constants';

const SettingsPage = () => {
    const { 
        theme, setTheme, budgets, expenses, addToast, 
        budgetSortOrder, setBudgetSortOrder, 
        expenseSortOrder, setExpenseSortOrder, 
        archivedBudgetColor, setArchivedBudgetColor,
        manualBudgetOrder, importFullBackup
    } = useAppContext();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        const data = {
            meta: {
                version: APP_VERSION,
                createdAt: new Date().toISOString()
            },
            data: {
                budgets,
                expenses,
                manualBudgetOrder,
            },
            config: {
                theme,
                budgetSortOrder,
                expenseSortOrder,
                archivedBudgetColor,
            }
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

    const compareVersions = (v1: string, v2: string): number => {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        const len = Math.max(parts1.length, parts2.length);

        for (let i = 0; i < len; i++) {
            const p1 = isNaN(parts1[i]) ? 0 : parts1[i];
            const p2 = isNaN(parts2[i]) ? 0 : parts2[i];
            if (p1 > p2) return 1;
            if (p1 < p2) return -1;
        }
        return 0;
    };


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target?.result;
                    if (typeof text !== 'string') throw new Error('No se pudo leer el archivo.');
                    
                    const importedJson = JSON.parse(text);

                    let dataToImport: AppData;
                    let configToImport: Partial<AppConfig>;
                    
                    // Check for new structured format
                    if (importedJson.meta && importedJson.data && importedJson.config) {
                        const { meta, data, config } = importedJson;
                        if (!meta.version || !data.budgets || !data.expenses) {
                             throw new Error('Archivo de backup (formato nuevo) no válido o corrupto.');
                        }
                        
                        dataToImport = data;
                        const backupVersion = meta.version;
                        const currentVersion = APP_VERSION;
                        const KNOWN_CONFIG_KEYS_CURRENT = ['theme', 'budgetSortOrder', 'expenseSortOrder', 'archivedBudgetColor'];
                        
                        let finalConfig: Partial<AppConfig> = {};

                        if (compareVersions(backupVersion, currentVersion) > 0) {
                            // Backup is from a newer version
                            const unsupportedKeys = Object.keys(config).filter(key => !KNOWN_CONFIG_KEYS_CURRENT.includes(key));
                            if (unsupportedKeys.length > 0) {
                                addToast(
                                    `Backup v${backupVersion} > App v${currentVersion}. No se importarán: ${unsupportedKeys.join(', ')}`,
                                    'info'
                                );
                            }
                            // Filter config to only include known keys
                            KNOWN_CONFIG_KEYS_CURRENT.forEach(key => {
                                if (key in config) {
                                    (finalConfig as any)[key] = config[key];
                                }
                            });
                        } else {
                            finalConfig = config;
                        }
                        configToImport = finalConfig;

                    } else if (importedJson.budgets && importedJson.expenses) {
                        // Handle old flat format for backward compatibility
                        addToast('Importando desde un formato de backup antiguo. Solo se importarán datos.', 'info');
                        dataToImport = {
                            budgets: importedJson.budgets,
                            expenses: importedJson.expenses,
                            manualBudgetOrder: importedJson.budgets.map((b: any) => b.id) // Recreate order
                        };
                        configToImport = {}; // No config in old backups
                    } else {
                        throw new Error('Formato de archivo de backup no reconocido.');
                    }

                    if (window.confirm('¿Importar datos? Esto sobreescribirá todos los datos actuales.')) {
                        importFullBackup({ data: dataToImport, config: configToImport });
                        addToast('Datos importados con éxito.', 'success');
                    }
                } catch (error) {
                    addToast(`Error al importar el archivo: ${error instanceof Error ? error.message : String(error)}`, 'error');
                } finally {
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
                <h2 className="text-lg font-semibold mb-3">Tema</h2>
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

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                <h2 className="text-lg font-semibold mb-3">Apariencia</h2>
                 <div className="flex items-center justify-between">
                    <label htmlFor="archivedBudgetColor" className="text-sm font-medium text-gray-700 dark:text-gray-300">Color para capitales archivados</label>
                    <input 
                        type="color" 
                        id="archivedBudgetColor" 
                        value={archivedBudgetColor}
                        onChange={(e) => setArchivedBudgetColor(e.target.value)}
                        className="w-10 h-10 p-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"
                    />
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
                        <option value="manual">Orden Manual</option>
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
