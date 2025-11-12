import React from 'react';
import Modal from './Modal';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: React.ReactNode;
    confirmButtonText?: string;
    cancelButtonText?: string;
    confirmButtonClass?: string;
}

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmButtonText = 'Confirmar',
    cancelButtonText = 'Cancelar',
    confirmButtonClass = 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
}: ConfirmationModalProps) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                    {message}
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                    <button
                        onClick={onClose}
                        type="button"
                        className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    >
                        {cancelButtonText}
                    </button>
                    <button
                        onClick={onConfirm}
                        type="button"
                        className={`inline-flex justify-center rounded-md border border-transparent py-2 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmButtonClass}`}
                    >
                        {confirmButtonText}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;
