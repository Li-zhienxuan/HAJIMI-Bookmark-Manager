import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "确认删除", 
  message = "您确定要删除此书签吗？此操作不可撤销。" 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-700 transform transition-all scale-100">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertCircle size={24} className="text-red-500 flex-shrink-0" />
            <h3 className="text-xl font-bold text-white">{title}</h3>
          </div>
          <p className="text-slate-400 mb-6">{message}</p>
          <div className="flex justify-end space-x-3">
            <button 
              onClick={onClose} 
              className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
            >
              取消
            </button>
            <button 
              onClick={onConfirm} 
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              确定删除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;