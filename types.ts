export interface Bookmark {
  id: string;
  title: string;
  url: string;
  category: string;
  notes?: string;
  favicon?: string;
  createdAt?: { seconds: number; nanoseconds: number };
  updatedAt?: { seconds: number; nanoseconds: number };
  lastEditor?: string;
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

// Augment window for the specific custom token logic mentioned in the prompt
declare global {
  interface Window {
    __firebase_config?: any;
    __app_id?: string;
    __initial_auth_token?: string;
  }
}
