import React from 'react';
import { X, Globe } from 'lucide-react';
import { StorageMode, FormData } from '../types';

interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => Promise<void>;
  formData: FormData;
  setFormData: (data: FormData) => void;
  isEditing: boolean;
  storageMode: StorageMode;
}

const AddBookmarkModal: React.FC<AddBookmarkModalProps> = ({ 
  isOpen, onClose, onSave, formData, setFormData, isEditing, storageMode 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-700 transform transition-all scale-100">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">
            {isEditing ? '编辑' : '新建'} {storageMode === 'public' ? '公共书签' : '私有书签'}
          </h3>
          <button onClick={onClose}><X size={24} className="text-slate-400 hover:text-white"/></button>
        </div>
        <form onSubmit={onSave} className="p-6 space-y-4">
          <input 
            required 
            type="text" 
            placeholder="标题" 
            value={formData.title} 
            onChange={e => setFormData({...formData, title: e.target.value})} 
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
          />
          <div className="relative">
              <Globe className="absolute left-3 top-3 text-slate-500 w-4 h-4" />
              <input 
                required 
                type="url" 
                placeholder="URL (https://...)" 
                value={formData.url} 
                onChange={e => setFormData({...formData, url: e.target.value})} 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
              />
          </div>
          <input 
            type="text" 
            placeholder="分类 (如: Dev, Design)" 
            value={formData.category} 
            onChange={e => setFormData({...formData, category: e.target.value})} 
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
          />
          <textarea 
            placeholder="备注..." 
            value={formData.notes} 
            onChange={e => setFormData({...formData, notes: e.target.value})} 
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white h-24 resize-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
          />
          <div className="flex justify-end space-x-3 pt-2">
             <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors">取消</button>
             <button type="submit" className={`px-4 py-2 rounded-lg text-white transition-colors ${storageMode === 'public' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}>保存</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBookmarkModal;