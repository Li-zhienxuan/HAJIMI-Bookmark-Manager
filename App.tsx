import React, { useState, useEffect, useMemo } from 'react';
import { 
  Book, Globe, Plus, Search, Layout, 
  List as ListIcon, Grid as GridIcon, Menu, 
  Database, Users, Lock, RefreshCw, Hash, Tag, Sparkles, Brain
} from 'lucide-react';

import { localDb } from './services/storage';
import { Bookmark, ToastData, StorageMode, ViewMode, ActiveTab, FormData } from './types';

// Components
import Toast from './components/Toast';
import BookmarkCard from './components/BookmarkCard';
import SettingsPanel from './components/SettingsPanel';
import AddBookmarkModal from './components/AddBookmarkModal';
import BrowserPreview from './components/BrowserPreview';
import ConfirmModal from './components/ConfirmModal';
import SidebarItem from './components/SidebarItem';
import WelcomeModal from './components/WelcomeModal';
import AnalyticsPanel from './components/AnalyticsPanel';

export default function App() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid'); 
  const [activeTab, setActiveTab] = useState<ActiveTab>('all'); 
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [showBrowser, setShowBrowser] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  
  const [isImporting, setIsImporting] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<{ visible: boolean, id: string | null }>({ visible: false, id: null });
  
  const [storageMode, setStorageMode] = useState<StorageMode>('private');
  const [formData, setFormData] = useState<FormData>({ title: '', url: '', category: '', notes: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isTestMode, setIsTestMode] = useState(() => localStorage.getItem('hajimi_test_mode') === 'true');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type });

  useEffect(() => {
    localStorage.setItem('hajimi_test_mode', String(isTestMode));
  }, [isTestMode]);

  useEffect(() => {
    const data = localDb.loadLocal(storageMode);
    setBookmarks(data);
    setLoading(false);
    
    const syncConfig = localDb.loadSyncConfig();
    if (syncConfig && syncConfig.token) {
      handleCloudSync('pull');
    }
  }, [storageMode]);

  const handleClearDatabase = () => {
    localDb.saveLocal(storageMode, []);
    setBookmarks([]);
    showToast(`${storageMode === 'public' ? '公共' : '私有'}数据库已清空`, "success");
  };

  const handleCloudSync = async (type: 'pull' | 'push' | 'both' = 'both') => {
    const config = localDb.loadSyncConfig();
    if (!config || !config.token) {
      if (type !== 'pull') showToast("请先在设置中完成云端配置", "error");
      return;
    }

    setIsSyncing(true);
    try {
      if (type === 'pull' || type === 'both') {
        const remoteData = await localDb.fetchFromCloud(config);
        if (remoteData && Array.isArray(remoteData)) {
          setBookmarks(remoteData);
          localDb.saveLocal(storageMode, remoteData);
          if (type === 'pull') showToast("同步完成，数据已刷新");
        }
      }
      
      if (type === 'push' || type === 'both') {
        const currentData = localDb.loadLocal(storageMode);
        await localDb.syncToCloud(config, currentData);
        showToast("已备份至云端 (" + config.provider.toUpperCase() + ")");
      }
    } catch (error: any) {
      console.error(error);
      showToast("同步出错：" + error.message, "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBookmarkClick = (bookmark: Bookmark) => {
    setCurrentUrl(bookmark.url);
    setShowBrowser(true);
    
    // Update stats
    const updated = bookmarks.map(b => b.id === bookmark.id ? { 
      ...b, 
      clickCount: (b.clickCount || 0) + 1, 
      lastUsedAt: Date.now() 
    } : b);
    
    setBookmarks(updated);
    localDb.saveLocal(storageMode, updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.url) return;

    try {
      let domain = 'unknown';
      try { domain = new URL(formData.url).hostname; } catch(err) {}
      const favicon = `https://api.iowen.cn/favicon/${domain}.png`;
      const now = Date.now();
      
      const cleanCategory = formData.category.trim() || '未分类';
      
      let newBookmarks = [...bookmarks];
      if (editingId) {
        newBookmarks = newBookmarks.map(b => b.id === editingId ? { ...b, ...formData, category: cleanCategory, favicon, updatedAt: now } : b);
        showToast("书签已更新");
      } else {
        const newBookmark: Bookmark = { 
          id: localDb.generateId(), 
          ...formData, 
          category: cleanCategory, 
          favicon, 
          createdAt: now, 
          updatedAt: now,
          clickCount: 0 
        };
        newBookmarks = [newBookmark, ...newBookmarks];
        showToast("新书签已添加");
      }

      setBookmarks(newBookmarks);
      localDb.saveLocal(storageMode, newBookmarks);
      
      const config = localDb.loadSyncConfig();
      if (config && config.token) handleCloudSync('push');
      closeModal();
    } catch (error: any) {
      showToast("保存失败", "error");
    }
  };

  const handleDelete = (id: string) => setShowConfirmModal({ visible: true, id: id });

  const confirmDelete = () => {
    const id = showConfirmModal.id;
    setShowConfirmModal({ visible: false, id: null });
    if (!id) return;

    const newBookmarks = bookmarks.filter(b => b.id !== id);
    setBookmarks(newBookmarks);
    localDb.saveLocal(storageMode, newBookmarks);
    
    const config = localDb.loadSyncConfig();
    if (config && config.token) handleCloudSync('push');
    showToast("书签已删除");
  };

  const handleEdit = (bookmark: Bookmark) => {
    setFormData({ title: bookmark.title, url: bookmark.url, category: bookmark.category || '未分类', notes: bookmark.notes || '' });
    setEditingId(bookmark.id);
    setShowAddModal(true);
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(bookmarks, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hajimi_bookmarks.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("离线备份已下载");
  };

  const processImport = (items: any[]) => {
    const existingUrls = new Set(bookmarks.map(b => b.url));
    const newItems = items
      .filter(i => !existingUrls.has(i.url) && i.url && i.url.startsWith('http'))
      .map(item => ({
        id: localDb.generateId(),
        title: item.title || 'Untitled',
        url: item.url,
        category: item.category || '未分类',
        notes: item.notes || '',
        favicon: `https://api.iowen.cn/favicon/${new URL(item.url).hostname}.png`,
        createdAt: Date.now(),
        clickCount: 0
      }));

    if (newItems.length === 0) {
      showToast("未发现新书签", "error");
      return;
    }

    const updated = [...newItems, ...bookmarks];
    setBookmarks(updated);
    localDb.saveLocal(storageMode, updated);
    
    const config = localDb.loadSyncConfig();
    if (config && config.token) handleCloudSync('push');
    showToast(`成功导入 ${newItems.length} 个书签！`);
  };

  const handleImportHtml = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const parser = new DOMParser();
        const doc = parser.parseFromString(result, "text/html");
        const links = Array.from(doc.querySelectorAll('a'));
        const parsed = links.map(link => ({ title: link.textContent || '', url: link.href }));
        processImport(parsed);
      } catch (error) {
        showToast("HTML 解析失败", "error");
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(!file) return;
      setIsImporting(true);
      const reader = new FileReader();
      reader.onload = (ev) => {
          try {
              const items = JSON.parse(ev.target?.result as string);
              if(Array.isArray(items)) processImport(items);
          } catch(e) { showToast("JSON 格式错误", "error"); }
          finally { setIsImporting(false); e.target.value = ''; }
      }
      reader.readAsText(file);
  }

  const closeModal = () => {
    setShowAddModal(false);
    setFormData({ title: '', url: '', category: '', notes: '' });
    setEditingId(null);
  };

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    bookmarks.forEach(b => {
      const cat = b.category || '未分类';
      stats[cat] = (stats[cat] || 0) + 1;
    });
    return stats;
  }, [bookmarks]);

  const categories = useMemo(() => {
    return Object.keys(categoryStats).sort();
  }, [categoryStats]);

  const filtered = useMemo(() => {
    return bookmarks.filter(b => {
      const matchesSearch = 
        b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        b.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.notes && b.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = 
        selectedCategory === 'all' || 
        (b.category || '未分类') === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [bookmarks, searchTerm, selectedCategory]);
  
  const themeColor = storageMode === 'public' ? 'purple' : 'blue';

  if (loading) return (
    <div className="flex h-screen bg-slate-950 items-center justify-center text-slate-500 font-sans">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
      Loading...
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      
      <WelcomeModal isOpen={showWelcomeModal} onClose={() => setShowWelcomeModal(false)} />

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col
      `}>
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${storageMode === 'public' ? 'bg-purple-600 shadow-lg shadow-purple-500/20' : 'bg-blue-600 shadow-lg shadow-blue-500/20'}`}>
            <Book className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-lg tracking-wide leading-none text-white">HAJIMI</div>
            <div className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-tighter">AI-Powered Hub</div>
          </div>
        </div>

        <div className="px-4 py-4">
           <div className="bg-slate-950/50 p-1 rounded-xl flex text-xs font-medium border border-slate-800">
              <button onClick={() => setStorageMode('private')} className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-all ${storageMode === 'private' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}><Lock size={12} className="mr-1.5"/> 私有</button>
              <button onClick={() => setStorageMode('public')} className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-all ${storageMode === 'public' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}><Users size={12} className="mr-1.5"/> 共享</button>
           </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 custom-scrollbar">
          <SidebarItem 
            icon={<Layout size={18} />} 
            label="所有书签" 
            active={activeTab === 'all' && selectedCategory === 'all'} 
            onClick={() => {setActiveTab('all'); setSelectedCategory('all'); setSidebarOpen(false);}} 
            theme={themeColor}
            count={bookmarks.length}
          />
          <SidebarItem 
            icon={<Brain size={18} />} 
            label="习惯与 ML 分析" 
            active={activeTab === 'analytics'} 
            onClick={() => {setActiveTab('analytics'); setSidebarOpen(false);}} 
            theme={themeColor} 
          />
          <SidebarItem 
            icon={<Database size={18} />} 
            label="同步与设置" 
            active={activeTab === 'settings'} 
            onClick={() => {setActiveTab('settings'); setSidebarOpen(false);}} 
            theme={themeColor} 
          />
          
          <div className="px-4 mt-6 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">书签分类</span>
            <Tag size={10} className="text-slate-600" />
          </div>

          <div className="space-y-0.5">
            {categories.map(cat => (
              <SidebarItem 
                key={cat}
                icon={<Hash size={16} />} 
                label={cat} 
                active={activeTab === 'all' && selectedCategory === cat} 
                onClick={() => {setActiveTab('all'); setSelectedCategory(cat); setSidebarOpen(false);}} 
                theme={themeColor}
                count={categoryStats[cat]}
              />
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/80">
           <div className="flex items-center text-[10px] text-slate-500 font-medium">
             <RefreshCw size={10} className={`mr-2 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
             {isSyncing ? '正在与云端同步...' : (localDb.loadSyncConfig()?.token ? '云端已连接' : '仅本地模式')}
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 z-10">
          <div className="flex items-center flex-1 mr-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="mr-4 md:hidden p-2 text-slate-400 hover:text-white transition-colors"><Menu size={20} /></button>
            <div className="relative w-full max-w-md group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors w-4 h-4" />
              <input 
                type="text" 
                placeholder={`在 ${selectedCategory === 'all' ? '所有' : selectedCategory} 中搜索...`} 
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
             <div className="hidden md:flex bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
               <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}><GridIcon size={16} /></button>
               <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}><ListIcon size={16} /></button>
             </div>
             <button onClick={() => setShowAddModal(true)} className={`${storageMode === 'public' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'} text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center transition-all active:scale-95 shadow-lg`}>
               <Plus size={18} className="mr-1.5" /> 新建
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {activeTab === 'settings' ? (
            <SettingsPanel 
              onExport={handleExportJson} 
              onImportJson={handleImportJson} 
              onImportHtml={handleImportHtml} 
              onSync={() => handleCloudSync('both')} 
              count={bookmarks.length} 
              mode={storageMode} 
              isImporting={isImporting} 
              isSyncing={isSyncing}
              isTestMode={isTestMode}
              setIsTestMode={setIsTestMode}
              onClearDatabase={handleClearDatabase}
            />
          ) : activeTab === 'analytics' ? (
            <AnalyticsPanel bookmarks={bookmarks} mode={storageMode} onDelete={handleDelete} />
          ) : (
            <div className="animate-in fade-in duration-500">
              <div className="mb-6 flex items-center justify-between">
                <div>
                   <h1 className="text-xl font-bold text-white flex items-center">
                     {selectedCategory === 'all' ? '所有书签' : selectedCategory}
                     <span className="ml-3 text-xs font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{filtered.length} 个结果</span>
                   </h1>
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-80 text-slate-600 bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                    <Search size={24} className="opacity-20" />
                  </div>
                  <p className="text-sm font-medium">未找到匹配的书签</p>
                  <button onClick={() => {setSearchTerm(''); setSelectedCategory('all');}} className="mt-4 text-xs text-blue-500 hover:text-blue-400 transition-colors">重置所有过滤条件</button>
                </div>
              ) : ( 
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-2"}>
                  {filtered.map(b => (
                    <BookmarkCard key={b.id} bookmark={b} mode={viewMode} onDelete={handleDelete} onEdit={handleEdit} onOpen={() => handleBookmarkClick(b)} isPublic={storageMode === 'public'}/>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <AddBookmarkModal 
        isOpen={showAddModal} 
        onClose={closeModal} 
        onSave={handleSave} 
        formData={formData} 
        setFormData={setFormData} 
        isEditing={!!editingId} 
        storageMode={storageMode}
        existingCategories={categories}
      />
      
      {showBrowser && <BrowserPreview url={currentUrl} onClose={() => setShowBrowser(false)} onError={() => showToast("预览受限，请尝试外部打开", "error")} />}
      <ConfirmModal isOpen={showConfirmModal.visible} onClose={() => setShowConfirmModal({ visible: false, id: null })} onConfirm={confirmDelete} />
    </div>
  );
}