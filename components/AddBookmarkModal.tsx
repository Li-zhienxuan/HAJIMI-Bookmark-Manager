import React from 'react';
import { X, Globe, Tag } from 'lucide-react';
import { StorageMode, FormData } from '../types';

interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => Promise<void>;
  formData: FormData;
  setFormData: (data: FormData) => void;
  isEditing: boolean;
  storageMode: StorageMode;
  existingCategories: string[];
}

const AddBookmarkModal: React.FC<AddBookmarkModalProps> = ({ 
  isOpen, onClose, onSave, formData, setFormData, isEditing, storageMode, existingCategories 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-800 transform transition-all scale-100 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">
            {isEditing ? '编辑' : '新建'} {storageMode === 'public' ? '公共书签' : '私有书签'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} className="text-slate-400 hover:text-white"/>
          </button>
        </div>
        
        <form onSubmit={onSave} className="p-6 space-y-5 overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">标题</label>
            <input 
              required 
              type="text" 
              placeholder="例如: GitHub 首页" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none placeholder-slate-600 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">网址 (URL)</label>
            <div className="relative">
                <Globe className="absolute left-4 top-3.5 text-slate-600 w-4 h-4" />
                <input 
                  required 
                  type="url" 
                  placeholder="https://..." 
                  value={formData.url} 
                  onChange={e => setFormData({...formData, url: e.target.value})} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none placeholder-slate-600 transition-all"
                />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">分类</label>
            <div className="relative">
              <Tag className="absolute left-4 top-3.5 text-slate-600 w-4 h-4" />
              <input 
                type="text" 
                placeholder="例如: 开发, 工具, 设计" 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})} 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none placeholder-slate-600 transition-all"
              />
            </div>
            {existingCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 px-1">
                <span className="text-[10px] text-slate-600 self-center mr-1">推荐:</span>
                {existingCategories.slice(0, 8).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({...formData, category: cat})}
                    className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-md transition-colors border border-slate-700"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">备注 (可选)</label>
            <textarea 
              placeholder="添加一些描述信息..." 
              value={formData.notes} 
              onChange={e => setFormData({...formData, notes: e.target.value})} 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white h-24 resize-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none placeholder-slate-600 transition-all"
            />
          </div>
        </form>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end space-x-3">
           <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium transition-colors">取消</button>
           <button 
             type="button" 
             onClick={(e) => onSave(e as any)}
             className={`px-8 py-2.5 rounded-xl text-white font-bold shadow-lg transition-all active:scale-95 ${storageMode === 'public' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'}`}
           >
             保存书签
           </button>
        </div>
      </div>
    </div>
  );
};

export default AddBookmarkModal;