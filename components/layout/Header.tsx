
import React from 'react';

const MenuIcon = ({ className }: { className: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

interface HeaderProps {
    onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 grid grid-cols-3 items-center">
        <div className="justify-self-start">
            <button 
                onClick={onMenuClick} 
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                aria-label="Abrir menú"
            >
                <MenuIcon className="w-6 h-6" />
            </button>
        </div>
        
        <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400 justify-self-center text-center">Several</h1>

        <div className="justify-self-end">
            {/* Placeholder for right-side icons if needed later */}
        </div>
      </div>
    </header>
  );
};

export default Header;