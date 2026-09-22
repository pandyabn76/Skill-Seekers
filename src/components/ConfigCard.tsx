import React, { useState } from 'react';
import { ConfigMetadata } from '../types';
import { Download, ExternalLink, Eye, Copy, Check, FileJson, Layers } from 'lucide-react';

interface ConfigCardProps {
  config: ConfigMetadata;
  onInspect: (config: ConfigMetadata) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'web-frameworks': 'bg-blue-50 text-blue-700 border-blue-200',
  'game-engines': 'bg-purple-50 text-purple-700 border-purple-200',
  devops: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'css-frameworks': 'bg-teal-50 text-teal-700 border-teal-200',
  'development-tools': 'bg-amber-50 text-amber-700 border-amber-200',
  gaming: 'bg-rose-50 text-rose-700 border-rose-200',
  uncategorized: 'bg-slate-50 text-slate-700 border-slate-200',
};

export const ConfigCard: React.FC<ConfigCardProps> = ({ config, onInspect }) => {
  const [copied, setCopied] = useState(false);

  const copyCommand = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cmd = `skill-seekers create --config ${config.config_file}`;
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categoryStyle = CATEGORY_COLORS[config.category] || CATEGORY_COLORS.uncategorized;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div
      id={`config-card-${config.name}`}
      className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between group"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
              {config.name}
            </h3>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                config.type === 'unified'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {config.type}
            </span>
          </div>

          <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${categoryStyle}`}>
            {config.category}
          </span>
        </div>

        <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
          {config.description || 'No description provided.'}
        </p>

        <div className="space-y-2 mb-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2 truncate">
            <span className="font-medium text-slate-700">Source:</span>
            <span className="truncate text-slate-600 font-mono text-[11px]">
              {config.primary_source}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span>Size: {formatFileSize(config.file_size)}</span>
            {config.max_pages ? (
              <span className="text-slate-500">Max pages: ~{config.max_pages}</span>
            ) : (
              <span className="text-slate-400">Dynamic depth</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {config.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200"
            >
              #{tag}
            </span>
          ))}
          {config.tags.length > 4 && (
            <span className="text-[10px] px-1.5 py-0.5 text-slate-400">
              +{config.tags.length - 4} more
            </span>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          id={`inspect-btn-${config.name}`}
          onClick={() => onInspect(config)}
          className="inline-flex items-center space-x-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2.5 py-1.5 rounded-md transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Inspect</span>
        </button>

        <div className="flex items-center space-x-1">
          <button
            id={`copy-cmd-btn-${config.name}`}
            onClick={copyCommand}
            title="Copy CLI command"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <a
            id={`download-link-${config.name}`}
            href={config.download_url}
            download={config.config_file}
            className="inline-flex items-center space-x-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1.5 rounded-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </a>
        </div>
      </div>
    </div>
  );
};
