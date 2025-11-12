
import React, { useEffect, useState } from 'react';
import { ToastMessage } from '../../types';

// Icons
const SuccessIcon = ({ className }: { className: string }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>;
const ErrorIcon = ({ className }: { className: string }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>;
const InfoIcon = ({ className }: { className: string }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>;
const CloseIcon = ({ className }: { className:string }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" /></svg>;

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

const toastConfig = {
    success: {
        icon: SuccessIcon,
        bg: 'bg-green-500 dark:bg-green-600',
    },
    error: {
        icon: ErrorIcon,
        bg: 'bg-red-500 dark:bg-red-600',
    },
    info: {
        icon: InfoIcon,
        bg: 'bg-blue-500 dark:bg-blue-600',
    }
};

// FIX: Typed the component with React.FC to resolve type errors when passing the key prop.
const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
    const { id, message, type, onUndo } = toast;
    const [isVisible, setIsVisible] = useState(false);
    
    useEffect(() => {
        setIsVisible(true); // Trigger fade-in
        if (!onUndo) { // Only auto-dismiss if there's no undo action
            const timer = setTimeout(() => {
                handleClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [id, onUndo]);
    
    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => onClose(id), 300); // Wait for fade-out before removing
    }

    const handleUndo = () => {
        if (onUndo) {
            onUndo();
        }
        handleClose();
    };

    const { icon: Icon, bg } = toastConfig[type];

    return (
        <div className={`flex items-center text-white p-4 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'} ${bg}`} role="alert">
            <div className="flex-shrink-0">
                <Icon className="w-6 h-6"/>
            </div>
            <div className="ml-3 text-sm font-medium flex-grow">
                {message}
                {onUndo && (
                    <button onClick={handleUndo} className="ml-2 font-bold underline hover:text-white/80">
                        Deshacer
                    </button>
                )}
            </div>
            <button onClick={handleClose} className="ml-4 -mr-1 p-1 rounded-full hover:bg-black/20 focus:outline-none focus:ring-2 focus:ring-white">
                <CloseIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

export default Toast;