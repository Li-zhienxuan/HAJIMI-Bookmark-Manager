import React, { useState, useEffect } from 'react';
import { Settings, Download, FileJson, FileCode, Save, RefreshCw, HelpCircle, ExternalLink, Info } from 'lucide-react';
import { StorageMode, SyncConfig, ProviderType } from '../types';
import { localDb } from '../services/storage';

interface SettingsPanelProps {
  onExport: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImportHtml: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSync: () => Promise<void>;
  count: number;
  mode: StorageMode;
  isImporting: boolean;
  isSyncing: boolean;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  onExport, onImportJson, onImportHtml, onSync, count, mode, isImporting, isSyncing 
}) => {
  const [config, setConfig] = useState<SyncConfig>({
    provider: 'cnb', token: '', owner: '', repo: '', branch: 'main', path: 'bookmarks.json'
  });
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const saved = localDb.loadSyncConfig();
    if (saved) setConfig(saved);
  }, []);

  const handleSaveConfig = () => {
    localDb.saveSyncConfig(config);
    alert('配置已保存在本地');
  };

  const isConfigValid = config.token && config.owner && config.repo;

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center">
          <Settings className={`mr-3 ${mode === 'public' ? 'text-purple-500' : 'text-blue-500'}`} />
          同步与设置
        </h2>
        <button 
          onClick={() => setShowGuide(!showGuide)}
          className="text-xs flex items-center text-slate-400 hover:text-white transition-colors"
        >
          <HelpCircle size={14} className="mr-1"/> 引导说明
        </button>
      </div>

      {showGuide && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-5 text-sm text-slate-300 space-y-3 animate-in zoom-in-95">
          <h4 className="font-bold text-blue-400 flex items-center"><Info size={16} className="mr-2"/> CNB 使用指南 (国内推荐)</h4>
          <ol className="list-decimal list-inside space-y-2 leading-relaxed">
            <li><strong>注册登录</strong>：访问 <a href="https://cnb.cool" target="_blank" rel="noreferrer" className="text-blue-400 underline">cnb.cool</a>。</li>
            <li><strong>创建仓库</strong>：新建一个私有或公开仓库（如：<code className="text-blue-300 bg-blue-500/10 px-1">bookmarks</code>）。</li>
            <li><strong>用户名 (Owner)</strong>：您的 CNB 账号名。</li>
            <li><strong>获取 Token</strong>：进入 [设置] -> [访问令牌]，创建一个 Token。</li>
            <li><strong>权限勾选</strong>：至少勾选 <code className="text-slate-300">repo</code> 权限以允许文件读写。</li>
          </ol>
          <div className="pt-2 flex space-x-4">
             <a href="https://cnb.cool/-/settings/tokens" target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline flex items-center"><ExternalLink size={12} className="mr-1"/> 前往获取 CNB Token</a>
          </div>
        </div>
      )}

      {/* Sync Section */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
             <select 
               className="bg-slate-800 border-none rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 cursor-pointer"
               value={config.provider}
               onChange={(e) => setConfig({...config, provider: e.target.value as ProviderType})}
             >
               <option value="cnb">CNB (国内极速)</option>
               <option value="github">GitHub</option>
             </select>
             <div>
               <h3 className="text-base font-medium text-white">云端同步</h3>
               <p className="text-slate-500 text-[10px] mt-0.5">数据实时同步到您的 Git 仓库</p>
             </div>
          </div>
          <button 
            onClick={onSync}
            disabled={isSyncing || !isConfigValid}
            className={`flex items-center justify-center px-6 py-2 rounded-lg text-sm font-medium transition-all ${isSyncing || !isConfigValid ? 'bg-slate-800 text-slate-500 opacity-50' : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'}`}
          >
            {isSyncing ? <RefreshCw size={16} className="mr-2 animate-spin" /> : <RefreshCw size={16} className="mr-2" />}
            {isSyncing ? '同步中...' : '立即同步'}
          </button>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="col-span-1 md:col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">访问令牌 (Token / PAT)</label>
            <input 
              type="password" 
              placeholder="请输入您的令牌..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 placeholder-slate-700"
              value={config.token}
              onChange={e => setConfig({...config, token: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">用户名 (Owner)</label>
            <input 
              type="text" 
              placeholder="e.g. zhangsan"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 placeholder-slate-700"
              value={config.owner}
              onChange={e => setConfig({...config, owner: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">仓库名 (Repo)</label>
            <input 
              type="text" 
              placeholder="e.g. my-bookmarks"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 placeholder-slate-700"
              value={config.repo}
              onChange={e => setConfig({...config, repo: e.target.value})}
            />
          </div>
          <div className="col-span-1 md:col-span-2 flex justify-between items-center bg-slate-800/20 p-3 rounded-lg border border-slate-800/50">
             <div className="text-[10px] text-slate-500">提示：Token 仅保存在浏览器缓存中，不会经过任何中转。</div>
             <button 
              onClick={handleSaveConfig}
              className="flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Save size={14} className="mr-2" /> 保存配置
            </button>
          </div>
        </div>
      </div>
      
      {/* Local Backup */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl p-6">
         <h3 className="text-lg font-medium text-white mb-4">手动导入/导出</h3>
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button onClick={onExport} className="flex flex-col items-center justify-center p-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700">
               <Download className="text-emerald-500 mb-2" size={20}/>
               <span className="text-xs font-medium">导出备份 (JSON)</span>
            </button>
            <label className="flex flex-col items-center justify-center p-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700 cursor-pointer">
               <FileJson className="text-blue-500 mb-2" size={20}/>
               <span className="text-xs font-medium">导入数据 (JSON)</span>
               <input type="file" accept=".json" onChange={onImportJson} className="hidden" />
            </label>
            <label className="flex flex-col items-center justify-center p-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700 cursor-pointer">
               <FileCode className="text-orange-500 mb-2" size={20}/>
               <span className="text-xs font-medium">从浏览器导入 (HTML)</span>
               <input type="file" accept=".html" onChange={onImportHtml} className="hidden" />
            </label>
         </div>
      </div>
    </div>
  );
};

export default SettingsPanel;