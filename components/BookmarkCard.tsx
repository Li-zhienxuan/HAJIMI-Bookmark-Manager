import React from 'react';
import { Globe, Edit2, Trash2 } from 'lucide-react';
import { Bookmark, ViewMode } from '../types';

interface BookmarkCardProps {
  bookmark: Bookmark;
  mode: ViewMode;
  onDelete: (id: string) => void;
  onEdit: (bookmark: Bookmark) => void;
  onOpen: () => void;
  isPublic: boolean;
}

const BookmarkCard: React.FC<BookmarkCardProps> = ({ bookmark, mode, onDelete, onEdit, onOpen, isPublic }) => {
  let domain = 'unknown';
  try {
    domain = new URL(bookmark.url).hostname;
  } catch (e) {
    // invalid url fallback
  }
  
  if (mode === 'list') {
    return (
      <div 
        onClick={onOpen}
        className={`group bg-slate-900 border hover:bg-slate-800 rounded-lg p-3 flex items-center justify-between cursor-pointer transition-all ${isPublic ? 'border-slate-800 hover:border-purple-500/30' : 'border-slate-800 hover:border-blue-500/30'}`}
      >
        <div className="flex items-center space-x-4 overflow-hidden">
          <div className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center flex-shrink-0 border border-slate-700 relative overflow-hidden">
             <img src={bookmark.favicon} className="w-4 h-4 relative z-10" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} alt=""/>
             <Globe size={14} className="text-slate-600 absolute z-0"/>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-slate-200 font-medium truncate text-sm">{bookmark.title}</h3>
            <p className="text-[10px] text-slate-500 font-mono truncate">{domain}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 pl-4">
           <span className={`text-[10px] px-2 py-0.5 rounded-full hidden sm:inline-block ${isPublic ? 'bg-purple-900/30 text-purple-400' : 'bg-blue-900/30 text-blue-400'}`}>
             {bookmark.category}
           </span>
           <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(bookmark); }} 
                className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-blue-400"
              >
                <Edit2 size={14}/>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(bookmark.id); }} 
                className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400"
              >
                <Trash2 size={14}/>
              </button>
           </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className={`group bg-slate-900 border hover:border-slate-600 rounded-xl p-4 flex flex-col relative overflow-hidden transition-all hover:shadow-xl ${isPublic ? 'border-slate-800 hover:ring-1 hover:ring-purple-500/50' : 'border-slate-800 hover:ring-1 hover:ring-blue-500/50'}`}>
      <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 rounded-full p-1 z-10">
         <button onClick={(e) => {e.stopPropagation(); onEdit(bookmark)}} className="p-1.5 hover:bg-slate-700 rounded-full text-slate-400 hover:text-blue-400"><Edit2 size={14}/></button>
         <button onClick={(e) => {e.stopPropagation(); onDelete(bookmark.id)}} className="p-1.5 hover:bg-slate-700 rounded-full text-slate-400 hover:text-red-400"><Trash2 size={14}/></button>
      </div>
      <div className="flex items-start space-x-3 cursor-pointer mb-3" onClick={onOpen}>
        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0 border border-slate-700 relative overflow-hidden">
             <img src={bookmark.favicon} className="w-5 h-5 relative z-10" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} alt=""/>
             <Globe size={16} className="text-slate-600 absolute z-0"/>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-slate-200 font-medium truncate text-sm leading-tight mb-1">{bookmark.title}</h3>
          <p className="text-[10px] text-slate-500 font-mono truncate">{domain}</p>
        </div>
      </div>
      {bookmark.notes && <p className="text-xs text-slate-400 line-clamp-2 mb-3">{bookmark.notes}</p>}
      <div className="mt-auto pt-3 border-t border-slate-800/50 flex justify-between items-center">
         <span className={`text-[10px] px-1.5 py-0.5 rounded ${isPublic ? 'bg-purple-900/30 text-purple-400' : 'bg-blue-900/30 text-blue-400'}`}>{bookmark.category}</span>
         {isPublic && bookmark.lastEditor && <span className="text-[9px] text-slate-600">By: {bookmark.lastEditor}</span>}
      </div>
    </div>
  );
};

export default BookmarkCard;