import React from 'react';
import { Globe, ExternalLink, X } from 'lucide-react';

interface BrowserPreviewProps {
  url: string;
  onClose: () => void;
  onError: () => void;
}

const BrowserPreview: React.FC<BrowserPreviewProps> = ({ url, onClose, onError }) => {
  return (
    <div className="fixed inset-0 z-[60] bg-slate-950 flex flex-col animate-in slide-in-from-bottom-10 fade-in">
       <div className="h-12 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between">
          <div className="flex items-center overflow-hidden mr-4">
             <Globe size={14} className="text-slate-500 mr-2 flex-shrink-0"/>
             <span className="text-xs text-slate-400 truncate max-w-[200px] md:max-w-md">{url}</span>
          </div>
          <div className="flex space-x-2">
            <a href={url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex items-center transition-colors">
              <ExternalLink size={12} className="mr-1"/> 外部打开
            </a>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"><X size={18}/></button>
          </div>
       </div>
       <iframe 
         src={url} 
         title="preview" 
         className="flex-1 bg-white w-full border-none" 
         sandbox="allow-same-origin allow-scripts allow-forms" 
         onError={onError}
       />
    </div>
  );
};

export default BrowserPreview;