import React, { useState, useEffect, useRef } from 'react';
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
  Database, Users, Lock, Settings, ShieldAlert
} from 'lucide-react';

import { auth, db, appId, isConfigured } from './services/firebase';
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
  
  // Error States
  const [authSetupError, setAuthSetupError] = useState<string | null>(null);
  
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
  
  // Refs to track mounting status to prevent setting state on unmounted components
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Auth Initialization
  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    let unsubscribe = () => {};

    const initAuth = async () => {
      try {
        console.log("HAJIMI: Initializing Firebase Auth...");
        
        // Listen to auth state changes FIRST
        unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          if (!isMounted.current) return;
          setUser(currentUser);
          // If we have a user, or if we determined we are not loading anymore
          if (currentUser) {
            setLoading(false);
            setAuthSetupError(null);
          }
        });

        if (typeof window !== 'undefined' && window.__initial_auth_token) {
          await signInWithCustomToken(auth, window.__initial_auth_token);
        } else {
          // Attempt sign in. If this throws (e.g. config error), we catch it below.
          await signInAnonymously(auth);
        }
        console.log("HAJIMI: Auth successful or pending...");
      } catch (error: any) {
        console.error("Auth failed", error);
        
        if (!isMounted.current) return;

        // Specific handling for common setup errors
        if (error?.code === 'auth/configuration-not-found' || error?.code === 'auth/operation-not-allowed') {
          setAuthSetupError("Anonymous Authentication is disabled in Firebase Console.");
          setLoading(false);
          return;
        }
        
        if (error?.code === 'auth/api-key-not-valid') {
           setAuthSetupError("API Key is invalid.");
           setLoading(false);
           return;
        }

        showToast("Authentication failed: " + error.message, "error");
        setLoading(false); 
      }
    };

    initAuth();

    return () => {
      unsubscribe();
    };
  }, []);

  // Data Listener
  useEffect(() => {
    if (!user || !isConfigured || authSetupError) return;

    const path = storageMode === 'public'
      ? `artifacts/${appId}/public/data/bookmarks`
      : `artifacts/${appId}/users/${user.uid}/bookmarks`;

    const collectionRef = collection(db, path);
    const q = query(collectionRef);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!isMounted.current) return;
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bookmark));
      docs.sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
      });
      setBookmarks(docs);
    }, (error) => {
      console.error("Data error:", error);
      if (error.code !== 'permission-denied') {
        showToast("无法加载数据，请检查网络", "error");
      }
    });

    return () => unsubscribe();
  }, [user, storageMode, authSetupError]);

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
      const payload: any = { ...formData, favicon, updatedAt: serverTimestamp() };

      if (storageMode === 'public') {
        payload.lastEditor = user.uid.slice(0,6);
      }

      if (editingId) {
         await updateDoc(doc(collectionRef, editingId), payload);
         showToast("书签已更新");
      } else {
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
          const batch = writeBatch(db);
          
          chunk.forEach(item => {
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

  if (!isConfigured) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-slate-300 p-6 text-center">
         <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 max-w-md shadow-2xl animate-in fade-in slide-in-from-bottom-4">
           <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Settings size={32} className="text-red-500"/>
           </div>
           <h1 className="text-2xl font-bold text-white mb-4">Configuration Required</h1>
           <p className="mb-6 text-slate-400 text-sm">
             Firebase connection settings are missing. Please configure your environment variables to continue.
           </p>
           <div className="bg-slate-950 p-4 rounded-lg text-left text-[10px] font-mono overflow-x-auto border border-slate-800 mb-6 whitespace-pre text-slate-500">
              <div className="text-slate-400 font-bold mb-2">.env or Cloudflare Pages Variables</div>
              VITE_FIREBASE_API_KEY=...{"\n"}
              VITE_FIREBASE_AUTH_DOMAIN=...{"\n"}
              VITE_FIREBASE_PROJECT_ID=...{"\n"}
              VITE_FIREBASE_STORAGE_BUCKET=...{"\n"}
              VITE_FIREBASE_MESSAGING_SENDER_ID=...{"\n"}
              VITE_FIREBASE_APP_ID=...
           </div>
           <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
             Go to Firebase Console
           </a>
         </div>
      </div>
    );
  }

  if (authSetupError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-slate-300 p-6 text-center">
         <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 max-w-md shadow-2xl animate-in fade-in slide-in-from-bottom-4">
           <div className="w-16 h-16 bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert size={32} className="text-amber-500"/>
           </div>
           <h1 className="text-2xl font-bold text-white mb-4">Authentication Setup Required</h1>
           <p className="mb-6 text-slate-400 text-sm">
             The app is connected to Firebase, but <b>Anonymous Authentication</b> is disabled.
           </p>
           <div className="text-left bg-slate-950 p-4 rounded-lg border border-slate-800 mb-6">
             <ol className="list-decimal list-inside text-sm text-slate-400 space-y-2">
               <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Firebase Console</a></li>
               <li>Select your project and click <b>Build &gt; Authentication</b></li>
               <li>Click the <b>Sign-in method</b> tab</li>
               <li>Enable the <b>Anonymous</b> provider</li>
             </ol>
           </div>
           <button onClick={() => window.location.reload()} className="block w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors">
             I've Enabled It, Reload App
           </button>
         </div>
      </div>
    );
  }

  if (loading) return (
    <div className="flex h-screen bg-slate-950 items-center justify-center text-slate-500">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
      Loading...
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