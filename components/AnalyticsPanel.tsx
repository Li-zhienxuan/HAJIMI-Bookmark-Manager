import React, { useMemo, useState } from 'react';
import { 
  BarChart2, Brain, Sprout, Wind, Activity, Shield, 
  Trash2, Globe, Lock, Cpu, FileSpreadsheet, Zap, 
  Flame, Tag, TrendingUp, Info, Copy, Wand2, Loader2
} from 'lucide-react';
import { Bookmark, StorageMode } from '../types';
import { aiService } from '../services/ai';

interface AnalyticsPanelProps {
  bookmarks: Bookmark[];
  mode: StorageMode;
  onDelete: (id: string) => void;
  onUpdateBookmarks: (updated: Bookmark[]) => void;
}

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ bookmarks, mode, onDelete, onUpdateBookmarks }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'habits' | 'maintenance' | 'ml'>('overview');
  const [isOrganizing, setIsOrganizing] = useState(false);

  const stats = useMemo(() => {
    if (!bookmarks.length) return null;

    const domains: Record<string, number> = {};
    const categories: Record<string, number> = {};
    const contentTypes = { 'Video': 0, 'Code': 0, 'Design': 0, 'Article': 0, 'Shop': 0 };
    
    let cognitiveHigh = 0;
    let cognitiveLow = 0;
    let cognitiveMed = 0;
    
    const urlMap: Record<string, Bookmark[]> = {};
    const privateIPs: Bookmark[] = [];
    const frequentVisits: Bookmark[] = [];

    bookmarks.forEach(b => {
      const lowerTitle = (b.title || '').toLowerCase();
      const rawUrl = b.url || '';
      
      // 重复项检测 (Normalized URL)
      const normUrl = rawUrl.replace(/\/$/, '').toLowerCase();
      if (!urlMap[normUrl]) urlMap[normUrl] = [];
      urlMap[normUrl].push(b);

      // 内网 IP 检测
      try {
        const hostname = new URL(rawUrl).hostname;
        const isPrivate = hostname === 'localhost' || hostname === '127.0.0.1' || 
                          hostname.startsWith('192.168.') || hostname.startsWith('10.') || 
                          hostname.endsWith('.local') || hostname.startsWith('172.');
        if (isPrivate) privateIPs.push(b);
        
        const domain = hostname.replace('www.', '');
        domains[domain] = (domains[domain] || 0) + 1;
      } catch (e) {}

      if (b.clickCount > 0) frequentVisits.push(b);

      // 认知负荷与花园分类
      if (['paper', 'pdf', 'docs', 'api', 'course'].some(k => lowerTitle.includes(k))) cognitiveHigh++;
      else if (['shop', 'buy', 'game', 'play', 'movie', 'social'].some(k => lowerTitle.includes(k))) cognitiveLow++;
      else cognitiveMed++;

      const cat = b.category || '未分类';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    const duplicates = Object.entries(urlMap)
      .filter(([_, list]) => list.length > 1)
      .map(([url, list]) => ({ url, items: list }));

    const persona = cognitiveHigh > bookmarks.length * 0.4 ? "深度学者" : 
                    domains['github.com'] ? "硬核开发者" : "知识探索者";

    return {
      total: bookmarks.length,
      topCategories: Object.entries(categories).sort((a,b) => b[1] - a[1]).slice(0, 5),
      cogRatios: {
        high: Math.round((cognitiveHigh / bookmarks.length) * 100),
        med: Math.round((cognitiveMed / bookmarks.length) * 100),
        low: Math.round((cognitiveLow / bookmarks.length) * 100),
      },
      duplicates,
      privateIPs,
      frequentVisits: frequentVisits.sort((a,b) => b.clickCount - a.clickCount).slice(0, 5),
      persona,
      categoriesList: Object.keys(categories)
    };
  }, [bookmarks]);

  // AI 智能全库整理逻辑
  const handleDeepOrganize = async () => {
    if (!stats || isOrganizing) return;
    if (!confirm("AI 将会扫描全库并尝试将书签重新放入合适的文件夹（分类）。这会更新您的现有分类，是否继续？")) return;

    setIsOrganizing(true);
    try {
      const messyOnes = bookmarks.map(b => ({ id: b.id, url: b.url, title: b.title }));
      // 分批整理，避免 API 限制
      const batchSize = 10;
      const allSuggestions = [];
      
      for (let i = 0; i < messyOnes.length; i += batchSize) {
        const chunk = messyOnes.slice(i, i + batchSize);
        const suggestions = await aiService.batchSuggest(chunk, stats.categoriesList);
        allSuggestions.push(...suggestions);
      }

      const updatedBookmarks = bookmarks.map(b => {
        const suggestion = allSuggestions.find(s => s.id === b.id);
        return suggestion ? { ...b, category: suggestion.category } : b;
      });

      onUpdateBookmarks(updatedBookmarks);
      alert("全库智能整理完成！");
    } catch (e) {
      alert("AI 整理过程中出现错误");
    } finally {
      setIsOrganizing(false);
    }
  };

  if (!stats) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Brain className={`mr-3 ${mode === 'public' ? 'text-purple-500' : 'text-blue-500'}`} />
            智能分析与整理
          </h2>
          <p className="text-xs text-slate-500 mt-1 uppercase font-mono tracking-wider">Storage Health & Intelligence</p>
        </div>
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          {(['overview', 'habits', 'maintenance', 'ml'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeSubTab === tab ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {tab === 'overview' && '概览'}
              {tab === 'habits' && '习惯'}
              {tab === 'maintenance' && '整理'}
              {tab === 'ml' && '特征'}
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in zoom-in-95">
          <StatCard icon={<Flame className="text-orange-500"/>} label="用户画像" value={stats.persona} />
          <StatCard icon={<TrendingUp className="text-emerald-500"/>} label="数据密度" value={`${stats.total} 书签`} />
          
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center"><Zap size={14} className="mr-2 text-yellow-500"/> 点击频率墙 (高频项)</h3>
            <div className="space-y-3">
              {stats.frequentVisits.map((b, idx) => (
                <div key={b.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50">
                  <div className="flex items-center truncate">
                    <Flame size={10} className="mr-2 text-rose-500" />
                    <span className="text-xs text-slate-300 truncate">{b.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{b.clickCount} 击</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center"><Tag size={14} className="mr-2 text-blue-500"/> 文件夹分布 (Top 5)</h3>
            <div className="space-y-4">
              {stats.topCategories.map(([name, count]) => (
                <div key={name}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-slate-300">{name}</span>
                    <span className="text-slate-500">{count} 项</span>
                  </div>
                  <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(count/stats.total)*100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'maintenance' && (
        <div className="space-y-6 animate-in fade-in">
          {/* AI 深度整理按钮 */}
          <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-2xl border border-blue-500/20 p-8 text-center">
            <Wand2 className="mx-auto text-blue-400 mb-4" size={40}/>
            <h3 className="text-lg font-bold text-white mb-2">AI 深度全库整理</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              您的书签是否乱七八糟？AI 会扫描每个链接的内容和标题，并为您自动创建最合适的文件夹分类。
            </p>
            <button 
              onClick={handleDeepOrganize}
              disabled={isOrganizing}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-lg transition-all flex items-center mx-auto"
            >
              {isOrganizing ? <Loader2 size={16} className="mr-2 animate-spin"/> : <Wand2 size={16} className="mr-2"/>}
              {isOrganizing ? 'AI 正在思考文件夹结构...' : '开启全库智能归档'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 重复项 */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
              <h3 className="text-sm font-bold text-rose-500 mb-4 flex items-center"><Copy size={16} className="mr-2"/> 检测到重复项 ({stats.duplicates.length})</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                {stats.duplicates.map((group, idx) => (
                  <div key={idx} className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                    <p className="text-[9px] font-mono text-slate-500 mb-2 truncate">{group.url}</p>
                    <div className="space-y-1">
                      {group.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-300 truncate">{item.title}</span>
                          <button onClick={() => onDelete(item.id)} className="text-rose-500 hover:text-white p-1"><Trash2 size={12}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {stats.duplicates.length === 0 && <p className="text-xs text-slate-500 italic">全库无重复 URL，非常健康！</p>}
              </div>
            </div>

            {/* 内网 IP */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
              <h3 className="text-sm font-bold text-orange-500 mb-4 flex items-center"><Lock size={16} className="mr-2"/> 内网/测试节点 ({stats.privateIPs.length})</h3>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                {stats.privateIPs.map(b => (
                  <div key={b.id} className="p-2 bg-slate-950/50 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center truncate">
                      <div className="p-1 bg-orange-500/10 rounded mr-2"><Globe size={10} className="text-orange-500"/></div>
                      <span className="text-[10px] text-slate-400 truncate">{b.title}</span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-600">INTRANET</span>
                  </div>
                ))}
                {stats.privateIPs.length === 0 && <p className="text-xs text-slate-500 italic">未检测到任何本地/测试链接。</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'habits' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 space-y-8 animate-in fade-in">
           <h3 className="text-lg font-bold text-white flex items-center"><Brain size={20} className="mr-3 text-pink-500"/> 认知负荷与花园分析</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <CogMetric label="高认知 (生产力/研发)" color="bg-rose-500" pct={stats.cogRatios.high} />
              <CogMetric label="中认知 (资讯/阅读)" color="bg-blue-500" pct={stats.cogRatios.med} />
              <CogMetric label="低认知 (娱乐/休闲)" color="bg-emerald-500" pct={stats.cogRatios.low} />
           </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: any, label: string, value: string | number }) => (
  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center">
    <div className="p-2.5 bg-slate-950 rounded-xl mr-4">{icon}</div>
    <div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
      <p className="text-base font-bold text-white leading-tight">{value}</p>
    </div>
  </div>
);

const CogMetric = ({ label, color, pct }: { label: string, color: string, pct: number }) => (
  <div>
    <div className="flex justify-between items-center mb-2">
      <p className="text-[11px] font-bold text-slate-300">{label}</p>
      <span className="text-xs font-bold text-white">{pct}%</span>
    </div>
    <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }}></div>
    </div>
  </div>
);

export default AnalyticsPanel;