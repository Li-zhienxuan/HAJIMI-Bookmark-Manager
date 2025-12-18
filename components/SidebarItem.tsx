import React from 'react';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  theme: 'blue' | 'purple';
  count?: number;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick, theme, count }) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all mb-1 group
      ${active 
        ? (theme === 'purple' ? 'bg-purple-900/30 text-purple-300 ring-1 ring-purple-500/20' : 'bg-blue-900/30 text-blue-300 ring-1 ring-blue-500/20') 
        : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
  >
    <div className="flex items-center truncate">
      <span className={`mr-3 transition-colors ${active ? (theme === 'purple' ? 'text-purple-400' : 'text-blue-400') : 'text-slate-500 group-hover:text-slate-300'}`}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </div>
    {count !== undefined && (
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full min-w-[20px] text-center
        ${active 
          ? (theme === 'purple' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300') 
          : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700'
        }`}>
        {count}
      </span>
    )}
  </button>
);

export default SidebarItem;