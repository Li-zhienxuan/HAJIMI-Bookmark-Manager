export interface Bookmark {
  id: string;
  title: string;
  url: string;
  category: string;
  notes?: string;
  favicon?: string;
  createdAt?: number; // Unix timestamp
  updatedAt?: number;
  lastEditor?: string;
}

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  path: string;
}

export interface ToastData {
  msg: string;
  type: 'success' | 'error';
}

export type StorageMode = 'private' | 'public';
export type ViewMode = 'grid' | 'list';
export type ActiveTab = 'all' | 'settings';

export interface FormData {
  title: string;
  url: string;
  category: string;
  notes: string;
}