import React, { useMemo, useState } from 'react';
import { 
  BarChart2, Brain, Sprout, Wind, Activity, Shield, 
  Trash2, Globe, Lock, Cpu, FileSpreadsheet, Zap, 
  Flame, Tag, TrendingUp, Info, Copy, Wand2, Loader2
} from 'lucide-react';
import { Bookmark, StorageMode } from '../types';
import { aiService, BatchSuggestion } from '../services/ai';

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
    
    let cognitiveHigh = 0;
    let cognitiveLow = 0;
    let cognitiveMed = 0;
    
    const urlMap: Record<string, Bookmark[]> = {};
    const privateIPs: Bookmark[] = [];
    const frequentVisits: Bookmark[] = [];

    bookmarks.forEach(b => {
      const lowerTitle = (b.title || '').toLowerCase();
      const rawUrl = b.url || '';
      
      // 1. 重复项检测 (标准化 URL)
      // 移除末尾斜杠、转小写、移除协议头进行更严格的重复对比
      const normUrl = rawUrl.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
      if (!urlMap[normUrl]) urlMap[normUrl] = [];
      urlMap[normUrl].push(b);

      // 2. 内网 IP 检测 (支持更多私有网段)
      try {
        const hostname = new URL(rawUrl).hostname;
        const isPrivate = 
          hostname === 'localhost' || 
          hostname === '127.0.0.1' || 
          hostname.startsWith('192.168.') || 
          hostname.startsWith('10.') || 
          hostname.startsWith('172.16.') || 
          hostname.startsWith('172.17.') || 
          hostname.startsWith('172.18.') || 
          hostname.startsWith('172.19.') || 
          hostname.startsWith('172.2') || 
          hostname.startsWith('172.3') || 
          hostname.endsWith('.local') ||
          hostname.endsWith('.test');
        
        if (isPrivate) privateIPs.push(b);
        
        const domain = hostname.replace('www.', '');
        domains[domain] = (domains[domain] || 0) + 1;
      } catch (e) {}

      // 3. 点击频率 (记录有点击的书签)
      if (b.clickCount && b.clickCount > 0) frequentVisits.push(b);

      // 4. 认知负荷
      if (['paper', 'pdf', 'docs', 'api', 'course', 'wiki', 'learn'].some(k => lowerTitle.includes(k))) cognitiveHigh++;
      else if (['shop', 'buy', 'game', 'play', 'movie', 'social', 'entertainment'].some(k => lowerTitle.includes(k))) cognitiveLow++;
      else cognitiveMed++;

      const cat = b.category || '未分类';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    const duplicates = Object.entries(urlMap)
      .filter(([_, list]) => list.length > 1)
      .map(([url, list]) => ({ url, items: list }));

    const persona = cognitiveHigh > bookmarks.length * 0.4 ? "硬核学者" : 
                    domains['github.com'] || domains['stackoverflow.com'] ? "资深开发者" : "全域探索者";

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
      frequentVisits: frequentVisits.sort((a,b) => b.clickCount - a.clickCount).slice(0, 8),
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
      const batchSize = 10;
      // Fix: Explicitly type allSuggestions to BatchSuggestion[]
      const allSuggestions: BatchSuggestion[] = [];
      
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
      alert("全库智能整理完成！书签已根据类型自动归档到对应文件夹。");
    } catch (e) {
      alert("AI 整理过程中出现错误，请检查网络或 API 配置。");
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
            智能整理与分析
          </h2>
          <p className="text-xs text-slate-500 mt-1 uppercase font-mono tracking-wider">Automated Folder Management & Insights</p>
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
              {tab === 'maintenance' && '整理维护'}
              {tab === 'ml' && '特征工程'}
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in zoom-in-95">
          <StatCard icon={<Flame className="text-orange-500"/>} label="数字灵魂" value={stats.persona} />
          <StatCard icon={<TrendingUp className="text-emerald-500"/>} label="资产总额" value={`${stats.total} 条书签`} />
          
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center"><Zap size={14} className="mr-2 text-yellow-500"/> 高频生产力 (点击频率)</h3>
            <div className="space-y-3">
              {stats.frequentVisits.map((b, idx) => (
                <div key={b.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 hover:bg-slate-950 transition-colors">
                  <div className="flex items-center truncate">
                    <Flame size={10} className={`mr-2 ${b.clickCount > 10 ? 'text-rose-500' : 'text-orange-400'}`} />
                    <span className="text-xs text-slate-300 truncate">{b.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">{b.clickCount} 次点击</span>
                </div>
              ))}
              {stats.frequentVisits.length === 0 && <p className="text-xs text-slate-600 italic">暂无点击记录，快去开启你的书签吧！</p>}
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center"><Tag size={14} className="mr-2 text-blue-500"/> 文件夹聚类 (Top 5)</h3>
            <div className="space-y-4">
              {stats.topCategories.map(([name, count]) => (
                <div key={name}>
                  <div className="flex justify-between text-[10px] mb-1.5">
                    <span className="text-slate-300 font-medium">{name}</span>
                    <span className="text-slate-500">{count} 项</span>
                  </div>
                  <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full transition-all duration-700" style={{ width: `${(count/stats.total)*100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'maintenance' && (
        <div className="space-y-6 animate-in fade-in">
          {/* AI 智能归档卡片 */}
          <div className="bg-gradient-to-br from-blue-900/10 via-slate-900 to-purple-900/10 rounded-2xl border border-blue-500/20 p-8 text-center shadow-inner">
            <Wand2 className="mx-auto text-blue-400 mb-4" size={48}/>
            <h3 className="text-xl font-bold text-white mb-2">全库智能自动归档</h3>
            <p className="text-sm text-slate-400 max-w-lg mx-auto mb-8">
              书签太多没空整理？AI 会根据每个书签的标题和网址自动识别其所属类型（如：开发、娱乐、购物、文档等），并为您重新创建文件夹分类。
            </p>
            <button 
              onClick={handleDeepOrganize}
              disabled={isOrganizing}
              className="px-10 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-xl shadow-blue-500/20 transition-all flex items-center mx-auto active:scale-95"
            >
              {isOrganizing ? <Loader2 size={18} className="mr-2 animate-spin"/> : <Wand2 size={18} className="mr-2"/>}
              {isOrganizing ? 'AI 正在分析并归档您的书签...' : '一键智能整理全库'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 重复项检测 */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col">
              <h3 className="text-sm font-bold text-rose-500 mb-4 flex items-center"><Copy size={16} className="mr-2"/> 重复书签清理 ({stats.duplicates.length})</h3>
              <div className="space-y-3 flex-1 overflow-y-auto max-h-72 pr-2 custom-scrollbar">
                {stats.duplicates.map((group, idx) => (
                  <div key={idx} className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 hover:border-rose-500/20 transition-colors">
                    <p className="text-[9px] font-mono text-slate-500 mb-2 truncate bg-slate-900 px-1.5 py-0.5 rounded" title={group.url}>{group.url}</p>
                    <div className="space-y-1.5">
                      {group.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between text-xs group">
                          <span className="text-slate-300 truncate" title={item.title}>{item.title}</span>
                          <button onClick={() => onDelete(item.id)} className="text-slate-600 hover:text-rose-500 p-1 transition-colors"><Trash2 size={14}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {stats.duplicates.length === 0 && <p className="text-xs text-slate-500 italic text-center py-8">您的书签非常整洁，没有重复项。</p>}
              </div>
            </div>

            {/* 内网 IP 识别 */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col">
              <h3 className="text-sm font-bold text-orange-500 mb-4 flex items-center"><Lock size={16} className="mr-2"/> 内网/本地测试书签 ({stats.privateIPs.length})</h3>
              <div className="grid grid-cols-1 gap-2 flex-1 overflow-y-auto max-h-72 pr-2 custom-scrollbar">
                {stats.privateIPs.map(b => (
                  <div key={b.id} className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800 flex items-center justify-between group hover:border-orange-500/30 transition-colors">
                    <div className="flex items-center truncate">
                      <div className="p-1.5 bg-orange-500/10 rounded-lg mr-2"><Globe size={12} className="text-orange-500"/></div>
                      <div className="truncate">
                        <p className="text-[11px] text-slate-300 truncate leading-none mb-1">{b.title}</p>
                        <p className="text-[9px] font-mono text-slate-600 truncate leading-none">{b.url}</p>
                      </div>
                    </div>
                    <span className="text-[8px] font-mono bg-orange-500/10 text-orange-500/80 px-1.5 py-0.5 rounded flex-shrink-0">PRIVATE</span>
                  </div>
                ))}
                {stats.privateIPs.length === 0 && <p className="text-xs text-slate-500 italic text-center py-8">未检测到本地开发或内网测试地址。</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'habits' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 space-y-8 animate-in fade-in">
           <h3 className="text-lg font-bold text-white flex items-center"><Brain size={20} className="mr-3 text-pink-500"/> 数字认知地图</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <CogMetric label="深层研习 (高认知)" color="bg-rose-500" pct={stats.cogRatios.high} sub="官方文档、论文、在线课程" />
              <CogMetric label="信息速读 (中认知)" color="bg-blue-500" pct={stats.cogRatios.med} sub="技术博客、新闻推送、长文" />
              <CogMetric label="轻松社交 (低认知)" color="bg-emerald-500" pct={stats.cogRatios.low} sub="流媒体、社交平台、购物" />
           </div>
           <div className="pt-4 border-t border-slate-800 text-xs text-slate-500 leading-relaxed italic">
             提示：该分析基于标题关键字词频及网址域名属性进行启发式推断。
           </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: any, label: string, value: string | number }) => (
  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center shadow-sm hover:shadow-md transition-shadow">
    <div className="p-3 bg-slate-950 rounded-xl mr-4 border border-slate-800/50">{icon}</div>
    <div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-lg font-bold text-white leading-tight">{value}</p>
    </div>
  </div>
);

const CogMetric = ({ label, color, pct, sub }: { label: string, color: string, pct: number, sub: string }) => (
  <div>
    <div className="flex justify-between items-end mb-2">
      <div>
        <p className="text-[12px] font-bold text-slate-200 leading-none">{label}</p>
        <p className="text-[10px] text-slate-500 mt-1 leading-none">{sub}</p>
      </div>
      <span className="text-xs font-bold text-white">{pct}%</span>
    </div>
    <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }}></div>
    </div>
  </div>
);

export default AnalyticsPanel;