import React, { useEffect, useState } from 'react';
import { Activity, BookOpen, Code2, ExternalLink, Terminal } from 'lucide-react';

interface HeaderProps {
  activeTab: 'explorer' | 'docs' | 'about';
  setActiveTab: (tab: 'explorer' | 'docs' | 'about') => void;
  totalConfigs: number;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, totalConfigs }) => {
  const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');

  useEffect(() => {
    fetch('/health')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Health check failed');
      })
      .then((data) => {
        if (data.status === 'healthy') setHealthStatus('healthy');
        else setHealthStatus('unhealthy');
      })
      .catch(() => setHealthStatus('unhealthy'));
  }, []);

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-900 text-lg tracking-tight">Skill Seekers</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium border border-indigo-200">
                  Config API v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500">Universal skill config discovery & repository</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <nav className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
              <button
                id="tab-explorer-btn"
                onClick={() => setActiveTab('explorer')}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'explorer'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Configs ({totalConfigs})
              </button>
              <button
                id="tab-docs-btn"
                onClick={() => setActiveTab('docs')}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'docs'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>API Console</span>
              </button>
              <button
                id="tab-about-btn"
                onClick={() => setActiveTab('about')}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'about'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>About</span>
              </button>
            </nav>

            <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div
                className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full border ${
                  healthStatus === 'healthy'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : healthStatus === 'checking'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                <Activity className="w-3 h-3 animate-pulse" />
                <span className="capitalize">{healthStatus}</span>
              </div>

              <a
                href="https://github.com/yusufkaraaslan/Skill_Seekers"
                target="_blank"
                rel="noreferrer"
                className="text-xs flex items-center space-x-1 text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
              >
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
