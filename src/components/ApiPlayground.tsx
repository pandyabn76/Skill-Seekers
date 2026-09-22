import React, { useState } from 'react';
import { Play, Copy, Check, Terminal, ExternalLink, RefreshCw } from 'lucide-react';

interface EndpointDef {
  method: 'GET';
  path: string;
  description: string;
  params?: { name: string; placeholder: string; default?: string }[];
}

const ENDPOINTS: EndpointDef[] = [
  {
    method: 'GET',
    path: '/health',
    description: 'Health check endpoint for container monitoring and uptime verification.',
  },
  {
    method: 'GET',
    path: '/api/info',
    description: 'Returns API metadata, version, and official repository links.',
  },
  {
    method: 'GET',
    path: '/api/configs',
    description: 'List all available configs with optional filters for category, tag, or type.',
    params: [
      { name: 'category', placeholder: 'e.g. web-frameworks, game-engines' },
      { name: 'tag', placeholder: 'e.g. javascript, python, frontend' },
      { name: 'type', placeholder: 'single-source or unified' },
    ],
  },
  {
    method: 'GET',
    path: '/api/categories',
    description: 'List all categories with their respective config counts.',
  },
  {
    method: 'GET',
    path: '/api/configs/{name}',
    description: 'Retrieve detailed metadata for a specific config by name.',
    params: [{ name: 'name', placeholder: 'e.g. react, godot, claude-code', default: 'react' }],
  },
  {
    method: 'GET',
    path: '/api/download/{config_name}',
    description: 'Download the config file directly as a JSON payload.',
    params: [{ name: 'config_name', placeholder: 'e.g. react.json or react', default: 'react.json' }],
  },
];

export const ApiPlayground: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDef>(ENDPOINTS[2]);
  const [paramValues, setParamValues] = useState<Record<string, string>>({
    name: 'react',
    config_name: 'react.json',
  });
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const getComputedPath = () => {
    let p = selectedEndpoint.path;
    const queryParams = new URLSearchParams();

    if (selectedEndpoint.params) {
      for (const param of selectedEndpoint.params) {
        const val = paramValues[param.name];
        if (p.includes(`{${param.name}}`)) {
          p = p.replace(`{${param.name}}`, val || param.default || '');
        } else if (val) {
          queryParams.set(param.name, val);
        }
      }
    }

    const qs = queryParams.toString();
    return qs ? `${p}?${qs}` : p;
  };

  const handleExecute = async () => {
    setIsLoading(true);
    setResponseData(null);
    setResponseStatus(null);
    setResponseTime(null);

    const path = getComputedPath();
    const startTime = performance.now();

    try {
      const res = await fetch(path);
      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));
      setResponseStatus(res.status);

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        setResponseData(json);
      } else {
        const text = await res.text();
        setResponseData(text);
      }
    } catch (err: any) {
      setResponseStatus(500);
      setResponseData({ error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const computedUrl = `${window.location.origin}${getComputedPath()}`;
  const curlCommand = `curl -X GET "${computedUrl}"`;

  const copyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Interactive API Console</h2>
        <p className="text-xs text-slate-600 mb-6">
          Test live Skill Seekers Config API endpoints, inspect headers and payloads, and export curl commands.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Endpoint selector */}
          <div className="space-y-2 border-r border-slate-100 pr-0 lg:pr-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
              Endpoints
            </span>
            <div className="space-y-1">
              {ENDPOINTS.map((ep, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedEndpoint(ep);
                    setResponseData(null);
                    setResponseStatus(null);
                  }}
                  className={`w-full text-left p-3 rounded-lg text-xs font-mono transition-all flex items-center justify-between ${
                    selectedEndpoint.path === ep.path
                      ? 'bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold'
                      : 'hover:bg-slate-50 border border-transparent text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {ep.method}
                    </span>
                    <span className="truncate">{ep.path}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Request builder & response */}
          <div className="lg:col-span-2 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Request Configuration
                </span>
                <span className="text-xs text-slate-500">{selectedEndpoint.description}</span>
              </div>

              {/* Endpoint bar */}
              <div className="flex items-center bg-slate-100 rounded-lg p-2 border border-slate-200 font-mono text-xs">
                <span className="px-2 py-1 rounded bg-emerald-600 text-white font-bold mr-2 text-[11px]">
                  {selectedEndpoint.method}
                </span>
                <span className="flex-1 text-slate-800 truncate">{getComputedPath()}</span>
                <button
                  id="execute-api-btn"
                  onClick={handleExecute}
                  disabled={isLoading}
                  className="ml-2 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-medium rounded-md shadow-xs transition-colors"
                >
                  {isLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  <span>{isLoading ? 'Executing...' : 'Send'}</span>
                </button>
              </div>
            </div>

            {/* Parameters if any */}
            {selectedEndpoint.params && selectedEndpoint.params.length > 0 && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <span className="text-xs font-semibold text-slate-700 block">Query & Path Parameters</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedEndpoint.params.map((param) => (
                    <div key={param.name}>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        {param.name}
                      </label>
                      <input
                        type="text"
                        placeholder={param.placeholder}
                        value={paramValues[param.name] ?? param.default ?? ''}
                        onChange={(e) =>
                          setParamValues({ ...paramValues, [param.name]: e.target.value })
                        }
                        className="w-full text-xs font-mono bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Curl snippet */}
            <div className="flex items-center justify-between bg-slate-900 text-slate-200 rounded-lg px-3 py-2 text-xs font-mono">
              <span className="truncate pr-3">{curlCommand}</span>
              <button
                onClick={copyCurl}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white shrink-0"
                title="Copy curl"
              >
                {copiedCurl ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Response pane */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Response</span>
                {responseStatus && (
                  <div className="flex items-center space-x-3 text-xs">
                    <span
                      className={`font-semibold px-2 py-0.5 rounded ${
                        responseStatus >= 200 && responseStatus < 300
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      Status: {responseStatus}
                    </span>
                    {responseTime !== null && (
                      <span className="text-slate-500">Latency: {responseTime}ms</span>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-slate-900 rounded-xl p-4 min-h-[180px] max-h-[380px] overflow-auto text-xs font-mono text-slate-100 border border-slate-800">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32 text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                    <span>Executing request...</span>
                  </div>
                ) : responseData ? (
                  <pre className="leading-relaxed">
                    {typeof responseData === 'object'
                      ? JSON.stringify(responseData, null, 2)
                      : responseData}
                  </pre>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                    <Terminal className="w-6 h-6 mb-2 opacity-50" />
                    <span>Click "Send" above to execute this endpoint live</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
