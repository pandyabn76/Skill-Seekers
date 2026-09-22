import React, { useEffect, useState } from 'react';
import { ConfigMetadata } from '../types';
import { X, Download, Copy, Check, ExternalLink, Code2, Layers, Globe, Github, FileText } from 'lucide-react';

interface ConfigDetailModalProps {
  config: ConfigMetadata | null;
  onClose: () => void;
}

export const ConfigDetailModal: React.FC<ConfigDetailModalProps> = ({ config, onClose }) => {
  const [rawJson, setRawJson] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'json'>('overview');

  useEffect(() => {
    if (!config) {
      setRawJson(null);
      return;
    }

    setLoading(true);
    fetch(`/api/raw/${config.config_file}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch config details');
        return res.json();
      })
      .then((data) => {
        setRawJson(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [config]);

  if (!config) return null;

  const copyJson = () => {
    if (!rawJson) return;
    navigator.clipboard.writeText(JSON.stringify(rawJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="config-detail-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-bold text-slate-900">{config.name}</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
              {config.type}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-200">
              {config.category}
            </span>
          </div>

          <button
            id="close-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View toggle tabs */}
        <div className="px-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Structured Overview
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center space-x-1.5 ${
                activeTab === 'json'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Raw JSON</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 py-2">
            <button
              id="copy-json-btn"
              onClick={copyJson}
              disabled={!rawJson}
              className="inline-flex items-center space-x-1 text-xs font-medium text-slate-700 hover:bg-slate-100 px-2.5 py-1.5 rounded-md border border-slate-200 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
            </button>

            <a
              id="modal-download-btn"
              href={config.download_url}
              download={config.config_file}
              className="inline-flex items-center space-x-1 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'overview' ? (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Description</h4>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  {config.description || 'No description available'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
                  <span className="text-xs text-slate-500 block mb-1">Primary Source</span>
                  <div className="flex items-center space-x-1.5 text-sm font-medium text-slate-900 truncate">
                    {config.primary_source.startsWith('http') ? (
                      <a
                        href={config.primary_source}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline flex items-center space-x-1 truncate"
                      >
                        <span className="truncate">{config.primary_source}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ) : (
                      <span>{config.primary_source}</span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
                  <span className="text-xs text-slate-500 block mb-1">Max Pages (Estimate)</span>
                  <span className="text-sm font-medium text-slate-900">
                    {config.max_pages ? `${config.max_pages} pages` : 'Not constrained / dynamic'}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
                  <span className="text-xs text-slate-500 block mb-1">File Size</span>
                  <span className="text-sm font-medium text-slate-900">
                    {config.file_size} bytes ({(config.file_size / 1024).toFixed(1)} KB)
                  </span>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
                  <span className="text-xs text-slate-500 block mb-1">Last Modified</span>
                  <span className="text-sm font-medium text-slate-900">
                    {new Date(config.last_updated).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1.5">
                  {config.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sources overview if available in raw json */}
              {rawJson?.sources && Array.isArray(rawJson.sources) && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Configured Sources ({rawJson.sources.length})
                  </h4>
                  <div className="space-y-2">
                    {rawJson.sources.map((source: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold uppercase text-slate-700 px-2 py-0.5 rounded bg-white border border-slate-200">
                              {source.type}
                            </span>
                            {source.base_url && (
                              <a
                                href={source.base_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-indigo-600 hover:underline flex items-center space-x-1"
                              >
                                <span>{source.base_url}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {source.repo && (
                              <span className="text-xs font-mono text-slate-800">
                                github.com/{source.repo}
                              </span>
                            )}
                          </div>
                          {source.rate_limit && (
                            <span className="text-xs text-slate-500 block">
                              Rate limit: {source.rate_limit}s
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CLI usage snippet */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Command Line Usage
                </h4>
                <div className="bg-slate-900 text-slate-100 rounded-lg p-3 font-mono text-xs overflow-x-auto flex items-center justify-between">
                  <code>skill-seekers create --config {config.config_file}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`skill-seekers create --config ${config.config_file}`);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="ml-3 p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {loading ? (
                <div className="py-12 text-center text-slate-500 text-sm">Loading config JSON...</div>
              ) : (
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-[50vh] leading-relaxed">
                  {JSON.stringify(rawJson, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
