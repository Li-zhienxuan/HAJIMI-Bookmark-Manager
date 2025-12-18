import React, { useMemo, useState } from 'react';
import { 
  BarChart2, Brain, Sprout, Wind, Activity, Shield, 
  Trash2, Globe, Lock, Cpu, FileSpreadsheet, Zap, 
  Flame, Tag, TrendingUp, Info, Copy
} from 'lucide-react';
import { Bookmark, StorageMode } from '../types';

interface AnalyticsPanelProps {
  bookmarks: Bookmark[];
  mode: StorageMode;
  onDelete: (id: string) => void;
}

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ bookmarks, mode, onDelete }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'habits' | 'maintenance' | 'ml'>('overview');

  const stats = useMemo(() => {
    if (!bookmarks.length) return null;

    const domains: Record<string, number> = {};
    const categories: Record<string, number> = {};
    const hours = new Array(24).fill(0);
    const contentTypes = { 'Video': 0, 'Code': 0, 'Design': 0, 'Article': 0, 'Shop': 0 };
    
    let cognitiveHigh = 0; // Docs, Research
    let cognitiveLow = 0;  // Social, Shop, Entertainment
    let cognitiveMed = 0;
    
    let typeGarden = 0; // Reference, Tools
    let typeStream = 0; // News, Social
    
    const urlMap: Record<string, Bookmark[]> = {};
    const privateIPs: Bookmark[] = [];
    const frequentVisits: Bookmark[] = [];

    const heavyKeywords = ['paper', 'pdf', 'course', 'study', 'research', 'docs', 'api', 'reference'];
    const lightKeywords = ['shop', 'buy', 'game', 'play', 'movie', 'video', 'social', 'memes'];
    const gardenKeywords = ['wiki', 'cheatsheet', 'guide', 'tutorial', 'documentation', 'tool', 'library'];

    bookmarks.forEach(b => {
      const lowerTitle = (b.title || '').toLowerCase();
      const rawUrl = b.url || '';
      
      // Duplicate detection
      if (!urlMap[rawUrl]) urlMap[rawUrl] = [];
      urlMap[rawUrl].push(b);

      // Private IP detection
      try {
        const hostname = new URL(rawUrl).hostname;
        const isPrivate = hostname === 'localhost' || hostname === '127.0.0.1' || 
                          hostname.startsWith('192.168.') || hostname.startsWith('10.') || 
                          hostname.endsWith('.local');
        if (isPrivate) privateIPs.push(b);
        
        // Domain stats
        const domain = hostname.replace('www.', '');
        domains[domain] = (domains[domain] || 0) + 1;

        // Content types
        if (hostname.includes('youtube') || hostname.includes('bilibili')) contentTypes['Video']++;
        else if (hostname.includes('github') || hostname.includes('stackoverflow')) contentTypes['Code']++;
        else if (hostname.includes('figma') || hostname.includes('dribbble')) contentTypes['Design']++;
        else if (hostname.includes('amazon') || hostname.includes('taobao')) contentTypes['Shop']++;
        else contentTypes['Article']++;

      } catch (e) {}

      // Frequent
      if (b.clickCount > 0) frequentVisits.push(b);

      // Cognitive load heuristic
      if (heavyKeywords.some(k => lowerTitle.includes(k))) cognitiveHigh++;
      else if (lightKeywords.some(k => lowerTitle.includes(k))) cognitiveLow++;
      else cognitiveMed++;

      // Garden vs Stream
      if (gardenKeywords.some(k => lowerTitle.includes(k))) typeGarden++;
      else typeStream++;

      // Category counts
      const cat = b.category || '未分类';
      categories[cat] = (categories[cat] || 0) + 1;

      // Time patterns
      if (b.createdAt) {
        const hour = new Date(b.createdAt).getHours();
        hours[hour]++;
      }
    });

    const duplicates = Object.entries(urlMap)
      .filter(([_, list]) => list.length > 1)
      .map(([url, list]) => ({ url, items: list }));

    const persona = cognitiveHigh > bookmarks.length * 0.4 ? "学者 (Scholar)" : 
                    contentTypes['Code'] > bookmarks.length * 0.3 ? "极客 (Techie)" :
                    contentTypes['Design'] > bookmarks.length * 0.2 ? "艺术家 (Creative)" : "探索者 (Explorer)";

    return {
      total: bookmarks.length,
      topDomains: Object.entries(domains).sort((a,b) => b[1] - a[1]).slice(0, 5),
      topCategories: Object.entries(categories).sort((a,b) => b[1] - a[1]).slice(0, 5),
      cogRatios: {
        high: Math.round((cognitiveHigh / bookmarks.length) * 100),
        med: Math.round((cognitiveMed / bookmarks.length) * 100),
        low: Math.round((cognitiveLow / bookmarks.length) * 100),
      },
      typeGarden,
      typeStream,
      duplicates,
      privateIPs,
      frequentVisits: frequentVisits.sort((a,b) => b.clickCount - a.clickCount).slice(0, 5),
      persona
    };
  }, [bookmarks]);

  const handleDownloadMLData = () => {
    const headers = "id,title_len,url_len,click_count,category,type";
    const rows = bookmarks.map(b => {
      const type = b.url.includes('github') ? 'code' : b.url.includes('youtube') ? 'video' : 'web';
      return `${b.id},${b.title.length},${b.url.length},${b.clickCount},"${b.category}","${type}"`;
    });
    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hajimi_ml_data_${mode}.csv`;
    a.click();
  };

  if (!stats) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Brain className={`mr-3 ${mode === 'public' ? 'text-purple-500' : 'text-blue-500'}`} />
            习惯与 ML 分析
          </h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-mono">Behavioral Insights Engine</p>
        </div>
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          {(['overview', 'habits', 'maintenance', 'ml'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeSubTab === tab ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {tab === 'overview' && '数据概览'}
              {tab === 'habits' && '深层习惯'}
              {tab === 'maintenance' && '健康维护'}
              {tab === 'ml' && '特征工程'}
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in zoom-in-95 duration-300">
          <StatCard icon={<TrendingUp className="text-emerald-500"/>} label="书签总数" value={stats.total} />
          <StatCard icon={<Flame className="text-orange-500"/>} label="高频访问" value={stats.frequentVisits[0]?.clickCount || 0} />
          <StatCard icon={<Activity className="text-blue-500"/>} label="数字画像" value={stats.persona} />
          <StatCard icon={<Globe className="text-purple-500"/>} label="重复项" value={stats.duplicates.length} />
          
          <div className="md:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center"><Zap size={14} className="mr-2 text-yellow-500"/> 最常访问</h3>
            <div className="space-y-3">
              {stats.frequentVisits.map((b, idx) => (
                <div key={b.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50">
                  <div className="flex items-center truncate mr-2">
                    <span className="text-[10px] font-bold text-slate-600 w-4">#{idx+1}</span>
                    <span className="text-xs text-slate-300 truncate">{b.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-orange-500 font-bold">{b.clickCount} 次</span>
                </div>
              ))}
              {stats.frequentVisits.length === 0 && <p className="text-xs text-slate-600 italic">暂无点击数据</p>}
            </div>
          </div>

          <div className="md:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center"><Tag size={14} className="mr-2 text-blue-500"/> 核心分类</h3>
            <div className="space-y-4">
              {stats.topCategories.map(([name, count]) => (
                <div key={name}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-slate-300 font-bold">{name}</span>
                    <span className="text-slate-500">{count} 项</span>
                  </div>
                  <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
                      style={{ width: `${(count/stats.total)*100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'habits' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center"><Brain size={20} className="mr-3 text-pink-500"/> 认知负荷分析</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <CogMetric label="高认知 (学习/研发)" color="bg-rose-500" pct={stats.cogRatios.high} desc="官方文档、论文、技术教程" />
              <CogMetric label="中认知 (阅读/资讯)" color="bg-blue-500" pct={stats.cogRatios.med} desc="技术博客、新闻、长文" />
              <CogMetric label="低认知 (娱乐/社交)" color="bg-emerald-500" pct={stats.cogRatios.low} desc="社交平台、购物、视频" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <HabitBox icon={<Sprout className="text-emerald-500"/>} label="数字花园 (Garden)" count={stats.typeGarden} desc="具有长期参考价值的工具和文档。" />
            <HabitBox icon={<Wind className="text-blue-500"/>} label="流水资讯 (Stream)" count={stats.typeStream} desc="具有时效性的动态和临时链接。" />
          </div>
        </div>
      )}

      {activeSubTab === 'maintenance' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <h3 className="text-sm font-bold text-rose-500 mb-4 flex items-center"><Copy size={16} className="mr-2"/> 重复书签检测 ({stats.duplicates.length})</h3>
            <div className="space-y-3">
              {stats.duplicates.map((group, idx) => (
                <div key={idx} className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                  <p className="text-[10px] font-mono text-slate-500 mb-2 truncate">{group.url}</p>
                  <div className="space-y-2">
                    {group.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 truncate">{item.title}</span>
                        <button onClick={() => onDelete(item.id)} className="text-rose-500 hover:text-rose-400 p-1"><Trash2 size={14}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {stats.duplicates.length === 0 && <p className="text-xs text-slate-500 italic">环境整洁，未发现重复项。</p>}
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <h3 className="text-sm font-bold text-orange-500 mb-4 flex items-center"><Lock size={16} className="mr-2"/> 私有/内网地址 ({stats.privateIPs.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {stats.privateIPs.map(b => (
                <div key={b.id} className="p-2 bg-slate-950/50 rounded-lg border border-slate-800 flex items-center text-xs">
                  <div className="p-1.5 bg-orange-500/10 rounded mr-2"><Globe size={12} className="text-orange-500"/></div>
                  <span className="text-slate-400 truncate">{b.title}</span>
                </div>
              ))}
              {stats.privateIPs.length === 0 && <p className="text-xs text-slate-500 italic">未检测到本地或内网地址。</p>}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'ml' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-10 text-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Cpu size={40} className="text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">训练数据集导出</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-8">
            系统已将您的书签数据通过“特征工程”处理为结构化数据，包含标题长度、点击频率等 6 个维度的特征。
          </p>
          <button 
            onClick={handleDownloadMLData}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center mx-auto"
          >
            <FileSpreadsheet size={18} className="mr-2"/>
            下载训练集 (.CSV)
          </button>
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
      <p className="text-lg font-bold text-white leading-tight">{value}</p>
    </div>
  </div>
);

const CogMetric = ({ label, color, pct, desc }: { label: string, color: string, pct: number, desc: string }) => (
  <div>
    <div className="flex justify-between items-end mb-2">
      <div>
        <p className="text-xs font-bold text-white">{label}</p>
        <p className="text-[10px] text-slate-500">{desc}</p>
      </div>
      <span className="text-lg font-bold text-white">{pct}%</span>
    </div>
    <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }}></div>
    </div>
  </div>
);

const HabitBox = ({ icon, label, count, desc }: { icon: any, label: string, count: number, desc: string }) => (
  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
      {icon}
    </div>
    <div className="flex items-center mb-3">
      <div className="p-2 bg-slate-950 rounded-lg mr-3">{icon}</div>
      <h4 className="text-sm font-bold text-white">{label}</h4>
    </div>
    <p className="text-2xl font-bold text-white mb-1">{count} <span className="text-xs font-normal text-slate-500">个书签</span></p>
    <p className="text-[10px] text-slate-500">{desc}</p>
  </div>
);

export default AnalyticsPanel;