import React, { useState, useEffect } from 'react';
import { Settings, Download, FileJson, FileCode, Github, Save, RefreshCw } from 'lucide-react';
import { StorageMode, GitHubConfig } from '../types';
import { localDb } from '../services/storage';

interface SettingsPanelProps {
  onExport: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImportHtml: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGitHubSync: () => Promise<void>;
  count: number;
  mode: StorageMode;
  isImporting: boolean;
  isSyncing: boolean;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  onExport, onImportJson, onImportHtml, onGitHubSync, count, mode, isImporting, isSyncing 
}) => {
  const [ghConfig, setGhConfig] = useState<GitHubConfig>({
    token: '', owner: '', repo: '', branch: 'main', path: 'bookmarks.json'
  });

  useEffect(() => {
    const saved = localDb.loadGitHubConfig();
    if (saved) setGhConfig(saved);
  }, []);

  const handleSaveConfig = () => {
    localDb.saveGitHubConfig(ghConfig);
    alert('GitHub 配置已保存到本地浏览器');
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 space-y-6 pb-20">
      <h2 className="text-2xl font-bold flex items-center">
        <Settings className={`mr-3 ${mode === 'public' ? 'text-purple-500' : 'text-blue-500'}`} />
        数据管理 ({mode === 'private' ? '私有' : '共享'})
      </h2>

      {/* GitHub Sync Section */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-white flex items-center">
              <Github size={20} className="mr-2 text-slate-400" /> GitHub 云同步
            </h3>
            <p className="text-slate-500 text-xs mt-1">将您的书签作为 JSON 文件保存在 GitHub 仓库中</p>
          </div>
          <button 
            onClick={onGitHubSync}
            disabled={isSyncing || !ghConfig.token}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${isSyncing ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            {isSyncing ? <RefreshCw size={16} className="mr-2 animate-spin" /> : <RefreshCw size={16} className="mr-2" />}
            {isSyncing ? '同步中...' : '立即同步'}
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-1 md:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Personal Access Token</label>
            <input 
              type="password" 
              placeholder="ghp_xxxxxxxxxxxx"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500"
              value={ghConfig.token}
              onChange={e => setGhConfig({...ghConfig, token: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Owner (用户名)</label>
            <input 
              type="text" 
              placeholder="e.g. your-github-name"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500"
              value={ghConfig.owner}
              onChange={e => setGhConfig({...ghConfig, owner: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Repository (仓库名)</label>
            <input 
              type="text" 
              placeholder="e.g. hajimi-data"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500"
              value={ghConfig.repo}
              onChange={e => setGhConfig({...ghConfig, repo: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Branch (分支)</label>
            <input 
              type="text" 
              placeholder="main"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500"
              value={ghConfig.branch}
              onChange={e => setGhConfig({...ghConfig, branch: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">File Path (存储路径)</label>
            <input 
              type="text" 
              placeholder="bookmarks.json"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500"
              value={ghConfig.path}
              onChange={e => setGhConfig({...ghConfig, path: e.target.value})}
            />
          </div>
          <div className="col-span-1 md:col-span-2 flex justify-end">
            <button 
              onClick={handleSaveConfig}
              className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors"
            >
              <Save size={16} className="mr-2" /> 保存配置
            </button>
          </div>
        </div>
      </div>
      
      {/* Export/Import Section */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
         <div className="p-6 border-b border-slate-800">
            <h3 className="text-lg font-medium text-white mb-1">手动导入/导出</h3>
            <p className="text-slate-400 text-xs">本地离线备份</p>
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