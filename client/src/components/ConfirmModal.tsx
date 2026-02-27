import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDanger = true,
    onConfirm,
    onCancel,
}) => {
    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onCancel}
            />

            {/* Modal Panel */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md transform transition-all animate-slide-up-fade overflow-hidden border border-slate-200">
                {/* Close button */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
                >
                    <X size={18} />
                </button>

                <div className="p-6">
                    <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-4 ${isDanger ? 'bg-red-50 text-red-600 border-red-50' : 'bg-blue-50 text-blue-600 border-blue-50'}`}>
                            <AlertTriangle size={24} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-1">
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                {title}
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                    <button
                        onClick={onCancel}
                        className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white rounded-xl shadow-sm transition-all ${isDanger
                                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20 hover:shadow-red-600/30'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 hover:shadow-blue-600/30'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
