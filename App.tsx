import React, { useState, useEffect } from 'react';
import { 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  serverTimestamp, 
  writeBatch 
} from 'firebase/firestore';
import { 
  Book, Globe, Plus, Search, Layout, 
  List as ListIcon, Grid as GridIcon, Menu, 
  Database, Users, Lock
} from 'lucide-react';

import { auth, db, appId } from './services/firebase';
import { Bookmark, ToastData, StorageMode, ViewMode, ActiveTab, FormData } from './types';

// Components
import Toast from './components/Toast';
import BookmarkCard from './components/BookmarkCard';
import SettingsPanel from './components/SettingsPanel';
import AddBookmarkModal from './components/AddBookmarkModal';
import BrowserPreview from './components/BrowserPreview';
import ConfirmModal from './components/ConfirmModal';
import SidebarItem from './components/SidebarItem';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  
  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('grid'); 
  const [activeTab, setActiveTab] = useState<ActiveTab>('all'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  
  // Logic State
  const [isImporting, setIsImporting] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<{ visible: boolean, id: string | null }>({ visible: false, id: null });
  
  // STORAGE MODE: 'private' (users/{uid}) or 'public' (public/data)
  const [storageMode, setStorageMode] = useState<StorageMode>('private');

  // Form State
  const [formData, setFormData] = useState<FormData>({ title: '', url: '', category: 'General', notes: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type });

  // Auth Initialization
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log("HAJIMI: Initializing Firebase Auth...");
        if (typeof window !== 'undefined' && window.__initial_auth_token) {
          await signInWithCustomToken(auth, window.__initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
        console.log("HAJIMI: Auth successful.");
      } catch (error) {
        console.error("Auth failed", error);
        showToast("Authentication failed", "error");
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Data Listener
  useEffect(() => {
    if (!user) return;

    const path = storageMode === 'public'
      ? `artifacts/${appId}/public/data/bookmarks`
      : `artifacts/${appId}/users/${user.uid}/bookmarks`;

    // Modular SDK: collection(db, path)
    const collectionRef = collection(db, path);
    // Use query() to make it cleaner, even if just querying the collection
    const q = query(collectionRef);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bookmark));
      // Sort in memory for simplicity (newest first)
      docs.sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
      });
      setBookmarks(docs);
    }, (error) => {
      console.error("Data error:", error);
      showToast("无法加载数据，请检查网络", "error");
    });

    return () => unsubscribe();
  }, [user, storageMode]);

  const getCollectionRef = () => {
    if (!user) throw new Error("Not authenticated");
    const path = storageMode === 'public'
      ? `artifacts/${appId}/public/data/bookmarks`
      : `artifacts/${appId}/users/${user.uid}/bookmarks`;
    return collection(db, path);
  };

  // CRUD Operations
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.url) return;
    if (!user) return;

    try {
      const collectionRef = getCollectionRef();
      let domain = 'unknown';
      try { domain = new URL(formData.url).hostname; } catch(err) {}
      
      const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      // Modular SDK: serverTimestamp() import
      const payload: any = { ...formData, favicon, updatedAt: serverTimestamp() };

      if (storageMode === 'public') {
        payload.lastEditor = user.uid.slice(0,6);
      }

      if (editingId) {
         // Modular SDK: updateDoc(doc(collectionRef, id), data)
         await updateDoc(doc(collectionRef, editingId), payload);
         showToast("书签已更新");
      } else {
         // Modular SDK: addDoc(collectionRef, data)
         await addDoc(collectionRef, { ...payload, createdAt: serverTimestamp() });
         showToast("新书签已添加");
      }
      closeModal();
    } catch (error: any) {
      console.error(error);
      showToast("保存失败: " + error.message, "error");
    }
  };

  const handleDelete = (id: string) => {
    setShowConfirmModal({ visible: true, id: id });
  };

  const confirmDelete = async () => {
    const id = showConfirmModal.id;
    setShowConfirmModal({ visible: false, id: null });
    if (!id) return;

    try {
       const collectionRef = getCollectionRef();
       // Modular SDK: deleteDoc(doc(collectionRef, id))
       await deleteDoc(doc(collectionRef, id));
       showToast("书签已删除");
    } catch (error) {
      console.error("Deletion failed:", error);
      showToast("删除失败", "error");
    }
  };

  const handleEdit = (bookmark: Bookmark) => {
    setFormData({
      title: bookmark.title,
      url: bookmark.url,
      category: bookmark.category || 'General',
      notes: bookmark.notes || ''
    });
    setEditingId(bookmark.id);
    setShowAddModal(true);
  };

  // Import/Export
  const processImportBatch = async (items: any[]) => {
      let count = 0;
      const CHUNK_SIZE = 400; 
      const existingUrls = new Set(bookmarks.map(b => b.url));
      const newItems = items.filter(i => !existingUrls.has(i.url) && i.url && i.url.startsWith('http'));

      if (newItems.length === 0) {
          showToast("没有发现新书签", "error");
          return;
      }

      const collectionRef = getCollectionRef();
      
      for (let i = 0; i < newItems.length; i += CHUNK_SIZE) {
          const chunk = newItems.slice(i, i + CHUNK_SIZE);
          // Modular SDK: writeBatch(db)
          const batch = writeBatch(db);
          
          chunk.forEach(item => {
              // Modular SDK: doc(collectionRef) creates a new doc reference with auto ID
              const docRef = doc(collectionRef); 
              let domain = 'unknown';
              try { domain = new URL(item.url).hostname; } catch(e) {}
              
              batch.set(docRef, {
                  title: item.title,
                  url: item.url,
                  category: item.category || 'Imported',
                  notes: item.notes || '',
                  favicon: item.favicon || `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
                  createdAt: serverTimestamp()
              });
          });
          
          await batch.commit();
          count += chunk.length;
      }
      showToast(`成功导入 ${count} 个书签！`);
  };

  const handleImportHtml = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const result = event.target?.result as string;
        const parser = new DOMParser();
        const doc = parser.parseFromString(result, "text/html");
        const links = Array.from(doc.querySelectorAll('a'));
        const parsed = links.map(link => {
          let category = 'Imported';
          try {
             let parent = link.parentElement; 
             while (parent && parent.tagName !== 'DL') parent = parent.parentElement;
             if (parent && parent.previousElementSibling?.tagName === 'H3') {
                category = parent.previousElementSibling.textContent || 'Imported';
             }
          } catch(err) {}
          return { title: link.textContent || 'Untitled', url: link.href, category };
        });
        await processImportBatch(parsed);
      } catch (error) {
        showToast("HTML 解析失败", "error");
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(bookmarks, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hajimi_${storageMode}_bookmarks.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(!file) return;
      setIsImporting(true);
      const reader = new FileReader();
      reader.onload = async(ev) => {
          try {
              const result = ev.target?.result as string;
              const items = JSON.parse(result);
              if(Array.isArray(items)) await processImportBatch(items);
          } catch(e) { showToast("JSON 格式错误", "error"); }
          finally { setIsImporting(false); e.target.value = ''; }
      }
      reader.readAsText(file);
  }

  const closeModal = () => {
    setShowAddModal(false);
    setFormData({ title: '', url: '', category: 'General', notes: '' });
    setEditingId(null);
  };

  const filtered = bookmarks.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.notes && b.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const categories = ['all', ...Array.from(new Set(bookmarks.map(b => b.category || 'General')))];
  const themeColor = storageMode === 'public' ? 'purple' : 'blue';

  if (loading) return (
    <div className="flex h-screen bg-slate-950 items-center justify-center text-slate-500">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
      加载中...
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col
      `}>
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${storageMode === 'public' ? 'bg-purple-600' : 'bg-blue-600'}`}>
            {storageMode === 'public' ? <Globe className="w-5 h-5 text-white"/> : <Book className="w-5 h-5 text-white" />}
          </div>
          <div>
            <div className="font-bold text-lg tracking-wide leading-none">HAJIMI</div>
            <div className="text-[10px] text-slate-500 font-mono mt-1 uppercase">
              {storageMode === 'public' ? 'Public Board' : 'Private Space'}
            </div>
          </div>
        </div>

        <div className="px-4 py-4">
           <div className="bg-slate-950/50 p-1 rounded-lg flex text-xs font-medium border border-slate-800">
              <button 
                onClick={() => setStorageMode('private')}
                className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all ${storageMode === 'private' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Lock size={12} className="mr-1.5"/> 私有
              </button>
              <button 
                onClick={() => setStorageMode('public')}
                className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all ${storageMode === 'public' ? 'bg-purple-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Users size={12} className="mr-1.5"/> 公开
              </button>
           </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2">
          <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">Views</div>
          <SidebarItem icon={<Layout size={18} />} label="所有书签" active={activeTab === 'all'} onClick={() => {setActiveTab('all'); setSidebarOpen(false);}} theme={themeColor} />
          <SidebarItem icon={<Database size={18} />} label="数据管理" active={activeTab === 'settings'} onClick={() => {setActiveTab('settings'); setSidebarOpen(false);}} theme={themeColor} />
          
          <div className="px-4 mt-6 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Categories</div>
          {categories.filter(c => c !== 'all').map(cat => (
            <button
              key={cat}
              onClick={() => {setSearchTerm(cat); setActiveTab('all'); setSidebarOpen(false);}}
              className="w-full flex items-center px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-left truncate mb-1"
            >
              <span className={`w-2 h-2 rounded-full mr-3 ${storageMode === 'public' ? 'bg-purple-500' : 'bg-blue-500'}`}></span>
              {cat}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-600">
           {storageMode === 'public' ? (
             <div className="flex items-center text-purple-400 mb-2">
               <Globe size={12} className="mr-1"/> 正在查看公共数据库
             </div>
           ) : (
             <div className="flex items-center text-blue-400 mb-2">
               <Lock size={12} className="mr-1"/> 正在查看私有数据库
             </div>
           )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
          <div className="flex items-center flex-1 mr-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="mr-4 md:hidden p-2 text-slate-400">
              <Menu size={20} />
            </button>
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input 
                type="text" 
                placeholder={storageMode === 'public' ? "搜索公共资源..." : "搜索我的书签..."}
                className="w-full bg-slate-800 border-none rounded-lg py-2 pl-10 pr-4 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
             <div className="hidden md:flex bg-slate-800 rounded-lg p-1">
               <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}><GridIcon size={16} /></button>
               <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}><ListIcon size={16} /></button>
             </div>
             <button 
               onClick={() => setShowAddModal(true)}
               className={`${storageMode === 'public' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'} text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-lg`}
             >
               <Plus size={16} className="mr-1.5" /> 新建
             </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeTab === 'settings' ? (
            <SettingsPanel 
               onExport={handleExportJson} 
               onImportJson={handleImportJson} 
               onImportHtml={handleImportHtml}
               count={bookmarks.length}
               mode={storageMode}
               isImporting={isImporting}
            />
          ) : (
            <>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                  <Search size={48} className="opacity-20 mb-4" />
                  <p>此处空空如也 ({storageMode === 'public' ? '公共' : '私有'})</p>
                </div>
              ) : ( 
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-3"}>
                  {filtered.map(b => (
                    <BookmarkCard 
                      key={b.id} 
                      bookmark={b} 
                      mode={viewMode} 
                      onDelete={handleDelete} 
                      onEdit={handleEdit}
                      onOpen={() => { setCurrentUrl(b.url); setShowBrowser(true); }}
                      isPublic={storageMode === 'public'}
                    />
                  ))}
                </div>
              )}
            </>
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
      />

      {showBrowser && (
        <BrowserPreview 
          url={currentUrl} 
          onClose={() => setShowBrowser(false)}
          onError={() => showToast("无法加载此链接，可能被安全策略阻止", "error")}
        />
      )}
      
      <ConfirmModal 
        isOpen={showConfirmModal.visible}
        onClose={() => setShowConfirmModal({ visible: false, id: null })}
        onConfirm={confirmDelete}
      />
    </div>
  );
}