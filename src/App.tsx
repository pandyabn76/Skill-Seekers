import React, { useEffect, useState, useMemo } from 'react';
import { ConfigMetadata, CategoriesResponse, ConfigsResponse } from './types';
import { Header } from './components/Header';
import { ConfigCard } from './components/ConfigCard';
import { ConfigDetailModal } from './components/ConfigDetailModal';
import { ApiPlayground } from './components/ApiPlayground';
import {
  Search,
  Filter,
  Layers,
  FileJson,
  FolderTree,
  Terminal,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  Cpu,
  RefreshCw,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'explorer' | 'docs' | 'about'>('explorer');
  const [configs, setConfigs] = useState<ConfigMetadata[]>([]);
  const [categories, setCategories] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Selected config for modal inspection
  const [selectedConfig, setSelectedConfig] = useState<ConfigMetadata | null>(null);

  const fetchConfigs = () => {
    setLoading(true);
    setError(null);

    Promise.all([
      fetch('/api/configs').then((r) => {
        if (!r.ok) throw new Error('Failed to load configs');
        return r.json() as Promise<ConfigsResponse>;
      }),
      fetch('/api/categories').then((r) => {
        if (!r.ok) throw new Error('Failed to load categories');
        return r.json() as Promise<CategoriesResponse>;
      }),
    ])
      .then(([configsData, categoriesData]) => {
        setConfigs(configsData.configs);
        setCategories(categoriesData.categories);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  // Compute unique tags from configs
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    configs.forEach((c) => c.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [configs]);

  // Filtered configs
  const filteredConfigs = useMemo(() => {
    return configs.filter((c) => {
      // Category filter
      if (selectedCategory !== 'all' && c.category !== selectedCategory) {
        return false;
      }
      // Type filter
      if (selectedType !== 'all' && c.type !== selectedType) {
        return false;
      }
      // Tag filter
      if (selectedTag !== 'all' && !c.tags.includes(selectedTag)) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesDesc = c.description.toLowerCase().includes(q);
        const matchesSource = c.primary_source.toLowerCase().includes(q);
        const matchesTag = c.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesSource && !matchesTag) {
          return false;
        }
      }
      return true;
    });
  }, [configs, selectedCategory, selectedType, selectedTag, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalConfigs={configs.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'explorer' && (
          <div className="space-y-6">
            {/* Top Banner with Stats */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Skill Seekers Configuration Repository
                  </h1>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                    Discover, inspect, and download official configuration presets for converting documentation sites,
                    codebases, and APIs into AI-ready skills.
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-center">
                    <span className="block text-base font-bold text-indigo-700 leading-none">
                      {configs.length}
                    </span>
                    <span className="text-[10px] text-indigo-600 font-medium">Configs</span>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-purple-50 border border-purple-100 text-center">
                    <span className="block text-base font-bold text-purple-700 leading-none">
                      {Object.keys(categories).length}
                    </span>
                    <span className="text-[10px] text-purple-600 font-medium">Categories</span>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                    <span className="block text-base font-bold text-emerald-700 leading-none">
                      {configs.filter((c) => c.type === 'unified').length}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium">Unified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="search-configs-input"
                    type="text"
                    placeholder="Search by name, framework, tag, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Type select */}
                <select
                  id="filter-type-select"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="all">All Types</option>
                  <option value="unified">Unified (Multi-source)</option>
                  <option value="single-source">Single-source</option>
                </select>

                {/* Tag select */}
                <select
                  id="filter-tag-select"
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="all">All Tags ({allTags.length})</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      #{tag}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 pt-1 text-xs">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                  Categories:
                </span>
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap text-xs transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-slate-900 text-white font-medium'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({configs.length})
                </button>
                {Object.entries(categories).map(([cat, count]) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-full whitespace-nowrap text-xs transition-colors ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                ))}
              </div>
            </div>

            {/* Configs Grid */}
            {loading ? (
              <div className="py-24 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
                <p className="text-sm text-slate-600">Loading Skill Seekers configurations...</p>
              </div>
            ) : error ? (
              <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center">
                <p className="text-sm font-semibold text-rose-700">Error loading configs: {error}</p>
                <button
                  onClick={fetchConfigs}
                  className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded text-xs"
                >
                  Retry
                </button>
              </div>
            ) : filteredConfigs.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-xl border border-slate-200 p-8">
                <FolderTree className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-900 mb-1">No matching configurations</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Try adjusting your search terms or clearing your category and tag filters.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedType('all');
                    setSelectedTag('all');
                  }}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-md text-xs font-medium hover:bg-slate-800"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-3 px-1">
                  <span>
                    Showing {filteredConfigs.length} of {configs.length} configs
                  </span>
                  {(selectedCategory !== 'all' ||
                    selectedType !== 'all' ||
                    selectedTag !== 'all' ||
                    searchQuery) && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                        setSelectedType('all');
                        setSelectedTag('all');
                      }}
                      className="text-indigo-600 hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredConfigs.map((config) => (
                    <ConfigCard
                      key={config.name}
                      config={config}
                      onInspect={(c) => setSelectedConfig(c)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'docs' && <ApiPlayground />}

        {activeTab === 'about' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">About Skill Seekers</h2>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Skill Seekers is an open-source framework and Python CLI tool that converts documentation sites,
                  GitHub repositories, PDFs, videos, notebooks, and wikis into AI-ready skills for 21+ LLM platforms
                  and RAG pipelines.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Supported Source Types (17)</span>
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Documentation websites, GitHub repos, PDFs, Word docs, EPUBs, videos, local codebases, Jupyter
                    notebooks, HTML, OpenAPI specs, AsciiDoc, PowerPoint, Confluence, Notion, RSS feeds, man pages,
                    and chat exports.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-indigo-600" />
                    <span>Target Platforms (21)</span>
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Claude, Gemini, OpenAI, MiniMax, OpenCode, Kimi, DeepSeek, Qwen, OpenRouter, Together AI, Fireworks
                    AI, Markdown, LangChain, LlamaIndex, Haystack, Weaviate, ChromaDB, FAISS, Qdrant, and Pinecone.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">CLI Quickstart</h3>
                <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs space-y-2">
                  <p className="text-slate-400"># Install Skill Seekers CLI</p>
                  <p>pip install skill-seekers</p>
                  <p className="text-slate-400 mt-2"># Create skill using an official config</p>
                  <p>skill-seekers create --config react.json</p>
                  <p className="text-slate-400 mt-2"># Auto-detect and build from any URL</p>
                  <p>skill-seekers create https://react.dev</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <ConfigDetailModal
        config={selectedConfig}
        onClose={() => setSelectedConfig(null)}
      />

      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© Skill Seekers. Open-source configuration repository and API.</p>
          <div className="flex items-center space-x-4">
            <a
              href="/api/configs"
              target="_blank"
              rel="noreferrer"
              className="text-slate-600 hover:text-indigo-600 flex items-center space-x-1"
            >
              <span>Raw API /api/configs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="/health"
              target="_blank"
              rel="noreferrer"
              className="text-slate-600 hover:text-indigo-600 flex items-center space-x-1"
            >
              <span>/health</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://github.com/yusufkaraaslan/Skill_Seekers"
              target="_blank"
              rel="noreferrer"
              className="text-slate-600 hover:text-indigo-600 flex items-center space-x-1"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
