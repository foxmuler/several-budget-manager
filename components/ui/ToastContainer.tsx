
import React from 'react';
import { useAppContext } from '../../context/AppContext';
import Toast from './Toast';

// FIX: Removed explicit ReactElement | null return type to allow TypeScript to correctly infer the component's type.
const ToastContainer = () => {
    const { toasts, removeToast } = useAppContext();

    if (!toasts.length) return null;

    return (
        <div className="fixed top-5 right-5 z-[100] w-full max-w-sm space-y-3">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onClose={removeToast} />
            ))}
        </div>
    );
};

export default ToastContainer;