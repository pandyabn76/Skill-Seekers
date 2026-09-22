import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// CORS configuration
const corsOriginsRaw = process.env.CORS_ORIGINS || '*';
const corsOrigins = corsOriginsRaw
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

if (!corsOrigins.length || corsOrigins.includes('*')) {
  app.use(cors({ origin: '*', credentials: false }));
} else {
  app.use(cors({ origin: corsOrigins, credentials: true }));
}

app.use(express.json());

// Category and Tag mappings matching Skill Seekers config_analyzer.py
const CATEGORY_MAPPING: Record<string, string[]> = {
  'web-frameworks': ['react', 'vue', 'django', 'fastapi', 'laravel', 'astro', 'hono', 'httpx', 'medusa'],
  'game-engines': ['godot', 'unity', 'unreal', 'blender', 'spine', 'dotween', 'addressables'],
  devops: ['kubernetes', 'ansible', 'docker', 'terraform'],
  'css-frameworks': ['tailwind', 'bootstrap', 'bulma'],
  'development-tools': ['claude-code', 'vscode', 'git'],
  gaming: ['steam'],
  testing: ['pytest', 'jest', 'test'],
};

const TAG_KEYWORDS: Record<string, string[]> = {
  javascript: ['react', 'vue', 'astro', 'hono', 'javascript', 'js', 'node'],
  python: ['django', 'fastapi', 'ansible', 'python', 'flask', 'httpx'],
  php: ['laravel', 'php'],
  frontend: ['react', 'vue', 'astro', 'tailwind', 'frontend', 'ui'],
  backend: ['django', 'fastapi', 'laravel', 'backend', 'server', 'api', 'httpx', 'medusa'],
  css: ['tailwind', 'css', 'styling'],
  'game-development': ['godot', 'unity', 'unreal', 'game', 'blender', 'spine', 'dotween'],
  devops: ['kubernetes', 'ansible', 'docker', 'k8s', 'devops'],
  documentation: ['docs', 'documentation'],
  testing: ['test', 'testing', 'pytest', 'jest'],
};

// Config directory resolution
const CONFIG_DIR = path.join(process.cwd(), 'configs');

function determineType(data: any): 'single-source' | 'unified' {
  if (Array.isArray(data.sources) || data.merge_mode) {
    return 'unified';
  }
  return 'single-source';
}

function getPrimarySource(data: any, type: string): string {
  if (type === 'unified' && Array.isArray(data.sources) && data.sources.length > 0) {
    const first = data.sources[0];
    if (first.type === 'documentation' && first.base_url) return first.base_url;
    if (first.type === 'github' && first.repo) return `github.com/${first.repo}`;
    if (first.type === 'pdf') return first.pdf_url || 'PDF file';
    return 'Multiple sources';
  }
  if (data.base_url) return data.base_url;
  if (data.repo) return `github.com/${data.repo}`;
  if (data.pdf_url || data.pdf) return 'PDF file';
  return 'Unknown';
}

function categorizeConfig(name: string, description: string): string {
  const nameLower = name.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_MAPPING)) {
    if (keywords.some((k) => nameLower.includes(k))) {
      return category;
    }
  }

  const descLower = (description || '').toLowerCase();
  if (descLower.includes('framework') || descLower.includes('library')) {
    if (['web', 'frontend', 'backend', 'api'].some((w) => descLower.includes(w))) {
      return 'web-frameworks';
    }
  }
  if (descLower.includes('game') || descLower.includes('engine') || descLower.includes('3d')) {
    return 'game-engines';
  }
  if (descLower.includes('devops') || descLower.includes('deployment') || descLower.includes('infrastructure')) {
    return 'devops';
  }
  return 'uncategorized';
}

function extractTags(name: string, description: string, data: any, type: string): string[] {
  const tags = new Set<string>();
  const nameLower = name.toLowerCase();
  const descLower = (description || '').toLowerCase();

  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some((k) => nameLower.includes(k) || descLower.includes(k))) {
      tags.add(tag);
    }
  }

  if (type === 'unified') {
    tags.add('multi-source');
  }

  if (data.base_url || (type === 'unified' && data.sources?.some((s: any) => s.type === 'documentation'))) {
    tags.add('documentation');
  }
  if (data.repo || (type === 'unified' && data.sources?.some((s: any) => s.type === 'github'))) {
    tags.add('github');
  }
  if (data.pdf || data.pdf_url || (type === 'unified' && data.sources?.some((s: any) => s.type === 'pdf'))) {
    tags.add('pdf');
  }

  return Array.from(tags).sort();
}

function getMaxPages(data: any): number | null {
  if (typeof data.max_pages === 'number') return data.max_pages;
  if (Array.isArray(data.sources)) {
    for (const source of data.sources) {
      if (source.type === 'documentation' && typeof source.max_pages === 'number') {
        return source.max_pages;
      }
    }
  }
  return null;
}

function analyzeAllConfigs() {
  if (!fs.existsSync(CONFIG_DIR)) {
    return [];
  }

  const files = fs.readdirSync(CONFIG_DIR).filter((f) => f.endsWith('.json')).sort();
  const configs: any[] = [];

  for (const file of files) {
    try {
      const filePath = path.join(CONFIG_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      if (!data.name) continue;

      const stats = fs.statSync(filePath);
      const type = determineType(data);
      const primarySource = getPrimarySource(data, type);
      const category = categorizeConfig(data.name, data.description || '');
      const tags = extractTags(data.name, data.description || '', data, type);
      const maxPages = getMaxPages(data);

      configs.push({
        name: data.name,
        description: data.description || '',
        type,
        category,
        tags,
        primary_source: primarySource,
        max_pages: maxPages,
        file_size: stats.size,
        last_updated: stats.mtime.toISOString(),
        download_url: `/api/download/${file}`,
        config_file: file,
      });
    } catch (err) {
      console.warn(`Failed to parse config file ${file}:`, err);
    }
  }

  return configs;
}

const API_INFO = {
  name: 'Skill Seekers Config API',
  version: '1.0.0',
  endpoints: {
    '/api/configs': 'List all available configs',
    '/api/configs/{name}': 'Get specific config details',
    '/api/categories': 'List all categories',
    '/api/download/{name}': 'Download config file',
    '/api/raw/{name}': 'Get raw config JSON content',
    '/docs': 'API documentation',
  },
  repository: 'https://github.com/yusufkaraaslan/Skill_Seekers',
  configs_repository: 'https://github.com/yusufkaraaslan/skill-seekers-configs',
  website: 'https://api.skillseekersweb.com',
};

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'skill-seekers-api' });
});

// API Info endpoint
app.get('/api/info', (req: Request, res: Response) => {
  res.json(API_INFO);
});

// List all configs
app.get('/api/configs', (req: Request, res: Response) => {
  try {
    const { category, tag, type } = req.query;
    let configs = analyzeAllConfigs();
    const filtersApplied: Record<string, string> = {};

    if (typeof category === 'string' && category.trim()) {
      configs = configs.filter((c) => c.category === category.trim());
      filtersApplied.category = category.trim();
    }

    if (typeof tag === 'string' && tag.trim()) {
      configs = configs.filter((c) => c.tags.includes(tag.trim()));
      filtersApplied.tag = tag.trim();
    }

    if (typeof type === 'string' && type.trim()) {
      configs = configs.filter((c) => c.type === type.trim());
      filtersApplied.type = type.trim();
    }

    res.json({
      version: '1.0.0',
      total: configs.length,
      filters: Object.keys(filtersApplied).length > 0 ? filtersApplied : null,
      configs,
    });
  } catch (err: any) {
    res.status(500).json({ error: `Error analyzing configs: ${err.message}` });
  }
});

// List all categories
app.get('/api/categories', (req: Request, res: Response) => {
  try {
    const configs = analyzeAllConfigs();
    const categories: Record<string, number> = {};

    for (const c of configs) {
      const cat = c.category || 'uncategorized';
      categories[cat] = (categories[cat] || 0) + 1;
    }

    res.json({
      total_categories: Object.keys(categories).length,
      categories,
    });
  } catch (err: any) {
    res.status(500).json({ error: `Error analyzing categories: ${err.message}` });
  }
});

// Get specific config metadata
app.get('/api/configs/:name', (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const configs = analyzeAllConfigs();
    const found = configs.find(
      (c) => c.name.toLowerCase() === name.toLowerCase() || c.config_file === `${name}.json`
    );

    if (!found) {
      return res.status(404).json({ error: `Config '${name}' not found` });
    }

    res.json(found);
  } catch (err: any) {
    res.status(500).json({ error: `Error loading config: ${err.message}` });
  }
});

// Download config file
app.get('/api/download/:config_name', (req: Request, res: Response) => {
  try {
    let { config_name } = req.params;
    if (config_name.includes('..') || config_name.includes('/') || config_name.includes('\\')) {
      return res.status(400).json({ error: 'Invalid config name' });
    }

    if (!config_name.endsWith('.json')) {
      config_name = `${config_name}.json`;
    }

    const filePath = path.join(CONFIG_DIR, config_name);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `Config file '${config_name}' not found` });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${config_name}"`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err: any) {
    res.status(500).json({ error: `Error downloading config: ${err.message}` });
  }
});

// Raw config file content (for viewing in UI)
app.get('/api/raw/:config_name', (req: Request, res: Response) => {
  try {
    let { config_name } = req.params;
    if (config_name.includes('..') || config_name.includes('/') || config_name.includes('\\')) {
      return res.status(400).json({ error: 'Invalid config name' });
    }

    if (!config_name.endsWith('.json')) {
      config_name = `${config_name}.json`;
    }

    const filePath = path.join(CONFIG_DIR, config_name);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `Config file '${config_name}' not found` });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    res.json(JSON.parse(content));
  } catch (err: any) {
    res.status(500).json({ error: `Error reading config: ${err.message}` });
  }
});

// Root handler: return JSON if accept header indicates application/json or format=json query
app.get('/', (req: Request, res: Response, next: NextFunction) => {
  if (req.query.format === 'json' || req.headers.accept?.startsWith('application/json')) {
    return res.json(API_INFO);
  }
  next();
});

// Documentation page endpoint
app.get('/docs', (req: Request, res: Response, next: NextFunction) => {
  if (req.query.format === 'json') {
    return res.json({
      openapi: '3.0.0',
      info: { title: 'Skill Seekers Config API', version: '1.0.0' },
      paths: {
        '/health': { get: { summary: 'Health check' } },
        '/api/configs': { get: { summary: 'List all available configs' } },
        '/api/configs/{name}': { get: { summary: 'Get specific config details' } },
        '/api/categories': { get: { summary: 'List all categories' } },
        '/api/download/{config_name}': { get: { summary: 'Download config file' } },
      },
    });
  }
  // Let Vite serve the docs view within the UI
  next();
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Skill Seekers Config API server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
