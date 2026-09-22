export interface ConfigSource {
  type: string;
  base_url?: string;
  repo?: string;
  pdf_url?: string;
  extract_api?: boolean;
  selectors?: Record<string, string>;
  url_patterns?: {
    include?: string[];
    exclude?: string[];
  };
  categories?: Record<string, string[]>;
  rate_limit?: number;
  [key: string]: unknown;
}

export interface ConfigMetadata {
  name: string;
  description: string;
  type: 'single-source' | 'unified';
  category: string;
  tags: string[];
  primary_source: string;
  max_pages: number | null;
  file_size: number;
  last_updated: string;
  download_url: string;
  config_file: string;
}

export interface ConfigsResponse {
  version: string;
  total: number;
  filters: Record<string, string> | null;
  configs: ConfigMetadata[];
}

export interface CategoriesResponse {
  total_categories: number;
  categories: Record<string, number>;
}

export interface ApiInfoResponse {
  name: string;
  version: string;
  endpoints: Record<string, string>;
  repository: string;
  configs_repository: string;
  website: string;
}
