import React from 'react';
import { useLocation } from 'react-router-dom';

const HomeIcon = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.125 1.125 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H18.375c.621 0 1.125-.504 1.125-1.125V9.75" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 21v-6.375a1.125 1.125 0 011.125-1.125h2.25a1.125 1.125 0 011.125 1.125V21" />
    </svg>
);

const HistoryIcon = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

const SettingsIcon = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
);

const navItems = [
    { path: '/', label: 'Home', icon: HomeIcon },
    { path: '/history', label: 'Historial', icon: HistoryIcon },
    { path: '/settings', label: 'Configuración', icon: SettingsIcon },
];

const BottomNav = () => {
    const location = useLocation();

    const navLinkClasses = "flex items-center justify-center flex-grow text-sm transition-colors duration-200 cursor-pointer";
    const activeClasses = "text-primary-600 dark:text-primary-400";
    const inactiveClasses = "text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400";
    
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-[0_-2px_5px_-1px_rgba(0,0,0,0.1)]">
            <div className="container mx-auto flex h-16">
                {navItems.map(({ path, label, icon: Icon }) => {
                    const isActive = location.pathname === path;
                    return (
                        <button
                            key={path}
                            onClick={() => window.location.hash = path}
                            className={`${navLinkClasses} ${isActive ? activeClasses : inactiveClasses}`}
                            aria-label={label}
                        >
                            <Icon className="h-7 w-7" />
                        </button>
                    )
                })}
            </div>
        </nav>
    );
};

export default BottomNav;