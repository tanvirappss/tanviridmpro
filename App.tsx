import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DownloadItem } from './components/DownloadItem';
import { SettingsPanel } from './components/SettingsPanel';
import { SpeedChart } from './components/SpeedChart';
import { AddDownloadModal } from './components/AddDownloadModal';
import { MOCK_DOWNLOADS, DEFAULT_SETTINGS } from './constants';
import { DownloadItem as IDownloadItem, AppSettings, DownloadStatus, ViewMode } from './types';
import { updateDownloads } from './services/mockDownloadService';
import { Monitor, Search, Moon, Sun, Zap, ShieldCheck, Wifi, ShieldAlert, Facebook } from 'lucide-react';

export default function App() {
  const [downloads, setDownloads] = useState<IDownloadItem[]>(MOCK_DOWNLOADS);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Dashboard);
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Simulates download loop
  useEffect(() => {
    const interval = setInterval(() => {
      setDownloads(prev => updateDownloads(prev));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Determine if dark mode is currently active (visual state)
  const isDark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setSettings(prev => ({
      ...prev,
      theme: isDark ? 'light' : 'dark'
    }));
  };

  const toggleProMode = () => {
    setSettings(prev => ({
      ...prev,
      proMode: !prev.proMode
    }));
  };

  const filteredDownloads = downloads.filter(d => {
    const matchesFilter = activeFilter === 'all' || d.status === activeFilter;
    const matchesSearch = d.filename.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handlePause = (id: string) => {
    setDownloads(prev => prev.map(d => d.id === id ? { ...d, status: DownloadStatus.Paused, speed: 0 } : d));
  };

  const handleResume = (id: string) => {
    setDownloads(prev => prev.map(d => d.id === id ? { ...d, status: DownloadStatus.Downloading } : d));
  };

  const handleCancel = (id: string) => {
    if (confirm('Are you sure you want to cancel this download?')) {
      setDownloads(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleStartDownload = (url: string, filename: string) => {
    // If Pro Mode is ON, use max threads (up to 32), otherwise limit to 4 (Standard)
    const activeThreads = settings.proMode ? settings.maxThreadsPerDownload : 4;

    const newItem: IDownloadItem = {
      id: Date.now().toString(),
      filename: filename,
      url: url,
      size: Math.floor(Math.random() * 500000000) + 1000000, // Random size 1MB - 500MB
      downloaded: 0,
      speed: 0,
      progress: 0,
      status: DownloadStatus.Downloading,
      dateAdded: Date.now(),
      type: 'other', // Simply categorize as other for now
      eta: 100,
      threads: activeThreads
    };
    
    // Auto detect type based on extension
    if (filename.match(/\.(mp4|mkv|webm)$/i)) newItem.type = 'video';
    else if (filename.match(/\.(mp3|wav)$/i)) newItem.type = 'audio';
    else if (filename.match(/\.(zip|rar|iso)$/i)) newItem.type = 'archive';
    else if (filename.match(/\.(pdf|doc)$/i)) newItem.type = 'document';

    setDownloads(prev => [newItem, ...prev]);
  };

  const handleClearFinished = () => {
    if (confirm('Clear all completed downloads from list? Files will not be deleted.')) {
      setDownloads(prev => prev.filter(d => d.status !== DownloadStatus.Completed));
    }
  };

  // Popup View (Simulates extension popup)
  if (viewMode === ViewMode.Popup) {
    return (
      <div className="w-[400px] h-[600px] bg-white dark:bg-gray-900 flex flex-col border border-gray-300 dark:border-gray-800 shadow-2xl overflow-hidden mx-auto mt-10">
        <div className={`p-4 bg-gradient-to-r ${settings.proMode ? 'from-blue-600 to-violet-600' : 'from-gray-700 to-gray-800'} flex justify-between items-center text-white`}>
          <h1 className="font-bold flex items-center gap-2">
            <Monitor size={18} /> TanvirIDM {settings.proMode ? 'Pro' : 'Lite'}
          </h1>
          <button onClick={() => setViewMode(ViewMode.Dashboard)} className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition">
            Open Dashboard
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50 dark:bg-gray-900">
          {downloads.length === 0 && <div className="text-center text-gray-400 mt-10 text-sm">No recent downloads</div>}
          {downloads.slice(0, 4).map(item => (
            <DownloadItem key={item.id} item={item} onPause={handlePause} onResume={handleResume} onCancel={handleCancel} />
          ))}
        </div>
        <div className="p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800 text-center">
          <p className={`text-xs font-semibold ${settings.proMode ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
            {settings.proMode ? 'Premium Active • Unthrottled' : 'Standard Mode • 4 Threads'}
          </p>
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-ticker {
          animation: ticker 25s linear infinite;
        }
        .ticker-container:hover .animate-ticker {
          animation-play-state: paused;
        }
      `}</style>
      
      <Sidebar 
        activeFilter={activeFilter} 
        onFilterChange={setActiveFilter}
        onNavigate={setCurrentPage}
        currentPage={currentPage}
        onNewDownload={() => setIsAddModalOpen(true)}
        onClearFinished={handleClearFinished}
        isProMode={settings.proMode}
        onToggleProMode={toggleProMode}
      />

      <main className="flex-1 flex flex-col min-w-0">
        
        {/* News Ticker Bar */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white text-xs font-medium py-2 overflow-hidden relative z-10 border-b border-blue-800 ticker-container shadow-md">
           <div className="animate-ticker whitespace-nowrap inline-flex items-center px-4">
              <span className="mr-3">📢 This extension is Developed by Tanvir Hossain - FullStack Developer from Chittagong,</span>
              <a 
                href="https://www.facebook.com/imtanveeer" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-blue-200 transition-colors group"
                title="Visit Facebook Profile"
              >
                <div className="bg-white rounded-full p-0.5">
                  <Facebook size={12} className="text-blue-600 fill-current" />
                </div>
                <span className="font-bold underline decoration-blue-400/50 group-hover:decoration-blue-200">Tanveer</span>
              </a>
           </div>
        </div>

        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 shrink-0 transition-colors duration-200">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search downloads..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-700/50 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setViewMode(ViewMode.Popup)}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Simulate Popup
            </button>
            <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-700 mx-2"></div>
            <button 
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <button 
              onClick={toggleProMode}
              className="focus:outline-none transform active:scale-95 transition-transform"
              title="Toggle Pro Mode"
            >
              {settings.proMode ? (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-blue-500/30 cursor-pointer">
                  PRO
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold text-xs cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600">
                  LITE
                </div>
              )}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {currentPage === 'settings' ? (
            <SettingsPanel settings={settings} onSave={(s) => { setSettings(s); setCurrentPage('dashboard'); }} />
          ) : (
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Stats & Charts Area */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">Active Downloads</h2>
                    <span className="text-sm text-gray-500">{filteredDownloads.filter(d => d.status === DownloadStatus.Downloading).length} active</span>
                  </div>
                  <div className="space-y-4">
                    {filteredDownloads.length === 0 ? (
                      <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <p className="text-gray-500">No downloads found</p>
                      </div>
                    ) : (
                      filteredDownloads.map(item => (
                        <DownloadItem 
                          key={item.id} 
                          item={item} 
                          onPause={handlePause} 
                          onResume={handleResume} 
                          onCancel={handleCancel}
                        />
                      ))
                    )}
                  </div>
                </div>
                
                <div className="lg:col-span-1 space-y-6">
                  <SpeedChart />
                  
                  {/* Mode Status Card (Pro vs Normal) */}
                  <div className={`rounded-xl p-6 shadow-lg border transition-all duration-300 ${
                    settings.proMode 
                      ? 'bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 text-white border-gray-700' 
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700'
                  }`}>
                    <div className={`flex items-center gap-2 mb-4 ${settings.proMode ? 'text-green-400' : 'text-blue-500'}`}>
                        {settings.proMode ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                        <span className="font-bold text-sm tracking-wide uppercase">
                          {settings.proMode ? 'TanvirIDM Pro: Active' : 'TanvirIDM Lite'}
                        </span>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="opacity-70 flex items-center gap-2"><Zap size={14} /> Engine</span>
                            <span className={`font-semibold ${settings.proMode ? 'text-blue-400' : ''}`}>
                              {settings.proMode ? 'Turbo Multi-Thread' : 'Standard (4 Threads)'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="opacity-70 flex items-center gap-2"><Wifi size={14} /> Bandwidth</span>
                            <span className={`font-semibold ${settings.proMode ? 'text-green-400' : ''}`}>
                              {settings.proMode ? 'Unlimited' : 'Standard'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="opacity-70 flex items-center gap-2"><Monitor size={14} /> License</span>
                            <span className={`font-semibold ${settings.proMode ? 'text-purple-400' : ''}`}>
                              {settings.proMode ? 'Lifetime Premium' : 'Free Version'}
                            </span>
                        </div>
                    </div>

                    <div className={`mt-6 pt-4 border-t ${settings.proMode ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'}`}>
                        <div className={`w-full rounded-full h-1.5 ${settings.proMode ? 'bg-gray-700' : 'bg-gray-200 dark:bg-gray-700'}`}>
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-500 ${settings.proMode ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-400'}`} 
                              style={{ width: settings.proMode ? '100%' : '50%' }}
                            ></div>
                        </div>
                        <p className="text-xs opacity-60 mt-2 text-center">
                          {settings.proMode ? 'All Pro features are free & active' : 'Switch to Pro for max speed'}
                        </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <AddDownloadModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onStart={handleStartDownload}
      />
    </div>
  );
}