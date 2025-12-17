import React from 'react';
import { Settings, Globe, Download, FileJson, FileCode } from 'lucide-react';
import { StorageMode } from '../types';

interface SettingsPanelProps {
  onExport: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImportHtml: (e: React.ChangeEvent<HTMLInputElement>) => void;
  count: number;
  mode: StorageMode;
  isImporting: boolean;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onExport, onImportJson, onImportHtml, count, mode, isImporting }) => {
  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <Settings className={`mr-3 ${mode === 'public' ? 'text-purple-500' : 'text-blue-500'}`} />
        {mode === 'public' ? '公共数据库管理' : '私有数据库管理'}
      </h2>
      
      {mode === 'public' && (
         <div className="mb-6 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg text-sm text-purple-200 flex items-start">
            <Globe className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"/>
            <div>
              <p className="font-bold mb-1">您正在操作公共区域</p>
              <p className="opacity-80">此处导入或删除的数据将影响所有用户。请谨慎操作。</p>
            </div>
         </div>
      )}

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden mb-6">
         <div className="p-6 border-b border-slate-800">
            <h3 className="text-lg font-medium text-white mb-1">数据导入/导出</h3>
            <p className="text-slate-400 text-xs">当前操作对象: <span className="font-mono text-white bg-slate-800 px-1 rounded">{mode.toUpperCase()}</span></p>
         </div>
         <div className="p-4 space-y-3">
            <ActionRow 
              icon={<Download className="text-emerald-500"/>} 
              title="导出备份" 
              desc={`下载 ${count} 个书签为 JSON`} 
              action={<button onClick={onExport} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-medium transition-colors">导出</button>}
            />
            <ActionRow 
              icon={<FileJson className="text-blue-500"/>} 
              title="导入备份 (JSON)" 
              desc="恢复 HAJIMI 格式数据" 
              action={<FileBtn onChange={onImportJson} label="导入 JSON" loading={isImporting}/>}
            />
            <ActionRow 
              icon={<FileCode className="text-orange-500"/>} 
              title="从浏览器导入 (HTML)" 
              desc="支持 Chrome/Edge/Firefox" 
              action={<FileBtn onChange={onImportHtml} label="导入 HTML" loading={isImporting}/>}
            />
         </div>
      </div>
    </div>
  );
};

interface ActionRowProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  action: React.ReactNode;
}

const ActionRow: React.FC<ActionRowProps> = ({ icon, title, desc, action }) => (
  <div className="flex items-center justify-between bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
     <div className="flex items-center">
        <div className="p-2 bg-slate-800 rounded-lg mr-3">{icon}</div>
        <div><h4 className="font-medium text-sm text-slate-200">{title}</h4><p className="text-[10px] text-slate-500">{desc}</p></div>
     </div>
     {action}
  </div>
);

interface FileBtnProps {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  loading: boolean;
}

const FileBtn: React.FC<FileBtnProps> = ({ onChange, label, loading }) => (
  <label className={`px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-medium transition-colors cursor-pointer ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
     {loading ? '处理中...' : label}
     <input type="file" accept={label.includes('HTML') ? '.html' : '.json'} onChange={onChange} className="hidden" disabled={loading}/>
  </label>
);

export default SettingsPanel;