import React from 'react';
import { useLocation } from 'react-router-dom';

const HomeIcon = ({ className }: { className: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" /></svg>
);
const HistoryIcon = ({ className }: { className: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.25 2.52.77-1.28-3.52-2.09V8H12z" /></svg>
);
const SettingsIcon = ({ className }: { className: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" /></svg>
);

const navItems = [
    { path: '/', label: 'Home', icon: HomeIcon },
    { path: '/history', label: 'Historial', icon: HistoryIcon },
    { path: '/settings', label: 'Configuración', icon: SettingsIcon },
];

const BottomNav = () => {
    const location = useLocation();

    const navLinkClasses = "flex flex-col items-center justify-center flex-grow text-sm transition-colors duration-200 cursor-pointer";
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
                        >
                            <Icon className="h-6 w-6 mb-1" />
                            <span>{label}</span>
                        </button>
                    )
                })}
            </div>
        </nav>
    );
};

export default BottomNav;