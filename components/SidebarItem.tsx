import React from 'react';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  theme: 'blue' | 'purple';
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick, theme }) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all mb-1 
      ${active 
        ? (theme === 'purple' ? 'bg-purple-900/30 text-purple-300' : 'bg-blue-900/30 text-blue-300') 
        : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
  >
    <span className="mr-3">{icon}</span>{label}
  </button>
);

export default SidebarItem;