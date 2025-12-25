
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  LayoutDashboard, 
  Briefcase, 
  Layers, 
  CheckSquare, 
  Settings,
  Bell,
  RefreshCw,
  Wifi,
  WifiOff,
  Sun,
  Moon
} from 'lucide-react';
import { useStore } from '../store/useStore';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onViewChange }) => {
  const store = useStore();
  const { isSyncing, lastError, refreshAll } = store;
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('schediq_theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('schediq_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'modules', label: 'Modules', icon: Layers },
    { id: 'members', label: 'Members', icon: Briefcase },
    { id: 'teams', label: 'Teams', icon: Users },
  ];

  return (
    <div className="flex min-h-screen bg-[#F4F5F7] dark:bg-[#0D1117]">
      {/* Sidebar */}
      <aside className="w-60 bg-[#0747A6] dark:bg-[#1D2125] text-white flex flex-col fixed inset-y-0 shadow-lg z-20 border-r dark:border-[#333C4B] transition-colors">
        <div className="p-5 flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center font-bold text-[#0747A6] dark:text-[#1D2125] shadow-sm">S</div>
          <span className="text-xl font-bold tracking-tight">SchedIQ</span>
        </div>
        
        <nav className="flex-1 px-3 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md transition-all duration-150 text-sm font-semibold ${
                activeView === item.id 
                  ? 'bg-white/20 dark:bg-[#0052CC] text-white' 
                  : 'text-blue-100 hover:bg-white/10 dark:hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 dark:border-[#333C4B]">
          <button className="w-full flex items-center space-x-3 px-3 py-2 text-blue-100 hover:text-white text-sm font-semibold transition-colors">
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-60 min-h-screen flex flex-col">
        <header className="h-14 bg-white dark:bg-[#1D2125] border-b border-[#DFE1E6] dark:border-[#333C4B] flex items-center justify-between px-6 sticky top-0 z-30 transition-colors">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-bold text-[#172B4D] dark:text-[#E2E8F0] capitalize">{activeView.replace('-', ' ')}</h1>
            {lastError ? (
              <div className="flex items-center space-x-1.5 text-[#BF2600] bg-[#FFEBE6] dark:bg-[#441C1C] px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide border border-[#FFBDAD] dark:border-[#6C2A2A]">
                <WifiOff size={12} />
                <span>Sync Error</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 text-[#006644] dark:text-[#4ADE80] bg-[#E3FCEF] dark:bg-[#062917] px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide border border-[#ABF5D1] dark:border-[#134D2E]">
                <Wifi size={12} />
                <span>SchedIQ Link Active</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={toggleTheme}
              className="p-2 text-[#42526E] dark:text-[#B3BAC5] hover:bg-[#F4F5F7] dark:hover:bg-[#333C4B] rounded-md transition-all group"
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={18} className="group-hover:rotate-12 transition-transform" /> : <Sun size={18} className="group-hover:rotate-45 transition-transform" />}
            </button>
            <div className="h-6 w-[1px] bg-[#DFE1E6] dark:bg-[#333C4B]"></div>
            <button 
              onClick={() => refreshAll()}
              disabled={isSyncing}
              className={`p-2 text-[#42526E] dark:text-[#B3BAC5] hover:text-[#0052CC] hover:bg-[#F4F5F7] dark:hover:bg-[#333C4B] rounded-md transition-all ${isSyncing ? 'animate-spin text-[#0052CC]' : ''}`}
            >
              <RefreshCw size={16} />
            </button>
            <button className="p-2 text-[#42526E] dark:text-[#B3BAC5] hover:bg-[#F4F5F7] dark:hover:bg-[#333C4B] rounded-md relative">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF5630] rounded-full border-2 border-white dark:border-[#1D2125]"></span>
            </button>
            <div className="h-8 w-8 bg-[#172B4D] dark:bg-[#0052CC] rounded-full flex items-center justify-center text-white font-bold text-[10px] ml-2 border border-white/20">
              JD
            </div>
          </div>
        </header>

        <div className="p-6 max-w-[1600px] w-full mx-auto flex-1">
          {lastError && (
            <div className="mb-4 p-4 bg-[#FFEBE6] dark:bg-[#441C1C] border border-[#FFBDAD] dark:border-[#6C2A2A] rounded-md flex items-center justify-between shadow-sm animate-in slide-in-from-top-2">
              <div className="flex items-center space-x-3">
                <WifiOff size={18} className="text-[#BF2600] dark:text-[#FF8B8B]" />
                <div>
                  <p className="text-xs font-bold text-[#BF2600] dark:text-[#FF8B8B]">Connectivity issue detected</p>
                  <p className="text-[11px] text-[#BF2600]/80 dark:text-[#FF8B8B]/70">{lastError}</p>
                </div>
              </div>
              <button 
                onClick={() => refreshAll()}
                className="px-3 py-1.5 bg-[#BF2600] text-white text-[11px] font-bold rounded hover:bg-[#DE350B] transition-colors shadow-sm"
              >
                Reconnect
              </button>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
