
import React from 'react';
import { AppTab } from '../types';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-tr from-orange-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
          <i className="fa-solid fa-bolt text-white text-xl"></i>
        </div>
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            ReddiGram AI
          </h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Automation Pipeline</p>
        </div>
      </div>

      <nav className="hidden md:flex items-center gap-1 bg-slate-800/50 p-1 rounded-lg">
        {[
          { id: AppTab.DASHBOARD, label: 'Dashboard', icon: 'fa-chart-pie' },
          { id: AppTab.DISCOVERY, label: 'Discovery', icon: 'fa-magnifying-glass' },
          { id: AppTab.SCHEDULE, label: 'Schedule', icon: 'fa-calendar-days' },
          { id: AppTab.HISTORY, label: 'History', icon: 'fa-clock-rotate-left' },
          { id: AppTab.SETTINGS, label: 'Settings', icon: 'fa-sliders' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === tab.id 
                ? 'bg-slate-700 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <i className={`fa-solid ${tab.icon} text-xs`}></i>
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <div className="flex -space-x-2">
          <img src="https://picsum.photos/seed/user1/32/32" className="w-8 h-8 rounded-full border-2 border-slate-900" alt="avatar" />
        </div>
        <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
          <i className="fa-solid fa-plus"></i>
          <span className="hidden sm:inline">New Pipeline</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
