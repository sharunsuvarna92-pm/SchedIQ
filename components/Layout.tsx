
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
  Moon,
  Menu,
  X
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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

  const handleNavClick = (id: string) => {
    onViewChange(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#020617]">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 bg-white dark:bg-[#0F172A] border-r border-slate-200/60 dark:border-slate-800/60 flex-col fixed inset-y-0 z-40 transition-colors">
        <div className="p-8 flex items-center space-x-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">S</div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">SchedIQ</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold ${
                activeView === item.id 
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <item.icon size={20} className={activeView === item.id ? 'animate-pulse' : ''} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-200/60 dark:border-slate-800/60">
          <button className="w-full flex items-center space-x-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-indigo-600 text-sm font-semibold transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50">
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[50] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-white dark:bg-[#0F172A] z-[60] transform transition-transform duration-300 lg:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white">S</div>
             <span className="text-lg font-extrabold tracking-tight dark:text-white">SchedIQ</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-500"><X size={24}/></button>
        </div>
        <nav className="flex-1 px-4 space-y-2 pt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-4 rounded-xl transition-all text-base font-bold ${
                activeView === item.id 
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' 
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <item.icon size={22} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col w-full">
        <header className="h-16 lg:h-20 glass border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between px-4 lg:px-10 sticky top-0 z-30 transition-all">
          <div className="flex items-center space-x-3 lg:space-x-6">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 dark:text-white capitalize tracking-tight">{activeView.replace('-', ' ')}</h1>
            <div className="hidden sm:flex">
              {lastError ? (
                <div className="flex items-center space-x-2 text-rose-600 bg-rose-50 dark:bg-rose-950/30 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border border-rose-200 dark:border-rose-900/50">
                  <WifiOff size={12} />
                  <span>Sync Error</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border border-emerald-200 dark:border-emerald-900/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>
                  <span className="hidden md:inline">Network Active</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-1 lg:space-x-4">
            <button 
              onClick={toggleTheme}
              className="p-2 lg:p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button 
              onClick={() => refreshAll()}
              disabled={isSyncing}
              className={`p-2 lg:p-2.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 rounded-xl transition-all ${isSyncing ? 'animate-spin' : ''}`}
            >
              <RefreshCw size={20} />
            </button>
            <div className="h-8 w-8 lg:h-10 lg:w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-indigo-500/20 border-2 border-white dark:border-slate-800">
              JD
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-10 max-w-[1600px] w-full mx-auto flex-1 overflow-x-hidden">
          {lastError && (
            <div className="mb-6 lg:mb-8 p-4 lg:p-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center justify-between shadow-xl shadow-rose-500/5 animate-in slide-in-from-top-4">
              <div className="flex items-center space-x-3 lg:space-x-4">
                <WifiOff size={20} className="text-rose-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs lg:text-sm font-bold text-rose-900 dark:text-rose-100 truncate">Sync Interrupted</p>
                  <p className="hidden md:block text-xs text-rose-600/80 dark:text-rose-400/80 font-medium truncate">{lastError}</p>
                </div>
              </div>
              <button 
                onClick={() => refreshAll()}
                className="px-4 lg:px-5 py-2 lg:py-2.5 bg-rose-600 text-white text-[10px] lg:text-xs font-bold rounded-xl hover:bg-rose-700 transition-all whitespace-nowrap"
              >
                Retry
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