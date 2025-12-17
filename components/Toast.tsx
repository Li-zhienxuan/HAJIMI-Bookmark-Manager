import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { ToastData } from '../types';

interface ToastProps {
  message: string;
  type: ToastData['type'];
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-[100] flex items-center px-4 py-3 rounded-lg shadow-lg transform transition-all duration-500 ease-in-out animate-in slide-in-from-top-5
      ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
      {type === 'success' ? <CheckCircle size={18} className="mr-2"/> : <AlertCircle size={18} className="mr-2"/>}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-4 opacity-70 hover:opacity-100"><X size={14}/></button>
    </div>
  );
};

export default Toast;