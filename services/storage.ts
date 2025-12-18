import { Bookmark, SyncConfig } from '../types';

const PRIVATE_KEY = 'hajimi_bookmarks_private';
const PUBLIC_KEY = 'hajimi_bookmarks_public';
const SYNC_CONFIG_KEY = 'hajimi_sync_config';

export const localDb = {
  saveLocal(mode: 'private' | 'public', bookmarks: Bookmark[]) {
    const key = mode === 'private' ? PRIVATE_KEY : PUBLIC_KEY;
    localStorage.setItem(key, JSON.stringify(bookmarks));
  },

  loadLocal(mode: 'private' | 'public'): Bookmark[] {
    const key = mode === 'private' ? PRIVATE_KEY : PUBLIC_KEY;
    const data = localStorage.getItem(key);
    if (!data) return [];
    try { return JSON.parse(data); } catch (e) { return []; }
  },

  saveSyncConfig(config: SyncConfig) {
    localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(config));
  },

  loadSyncConfig(): SyncConfig | null {
    const data = localStorage.getItem(SYNC_CONFIG_KEY);
    return data ? JSON.parse(data) : null;
  },

  async syncToCloud(config: SyncConfig, bookmarks: Bookmark[]) {
    const { provider, token, owner, repo, branch, path } = config;
    
    // CNB 的 API 地址与 GitHub 非常类似
    const baseUrl = provider === 'github'
      ? `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
      : `https://api.cnb.cool/repos/${owner}/${repo}/contents/${path}`;

    const headers: any = {
      'Content-Type': 'application/json',
      'Authorization': `token ${token}`
    };

    // 1. 获取现有文件 SHA (为了更新文件)
    let sha = '';
    try {
      const getUrl = `${baseUrl}?ref=${branch}`;
      const res = await fetch(getUrl, { headers });
      if (res.ok) {
        const data = await res.json();
        sha = data.sha;
      }
    } catch (e) {
      console.log('File does not exist yet, creating new one.');
    }

    // 2. 推送数据
    // 使用 UTF-8 处理中文字符编码
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(bookmarks, null, 2))));
    const body: any = {
      message: 'Sync from HAJIMI',
      content,
      branch
    };
    if (sha) body.sha = sha;

    const res = await fetch(baseUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || `${provider.toUpperCase()} 同步失败`);
    }
  },

  async fetchFromCloud(config: SyncConfig): Promise<Bookmark[]> {
    const { provider, token, owner, repo, branch, path } = config;
    
    const url = provider === 'github'
      ? `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
      : `https://api.cnb.cool/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
    
    const headers = { 'Authorization': `token ${token}` };
    const res = await fetch(url, { headers });

    if (!res.ok) {
      if (res.status === 404) return []; // 文件不存在返回空
      throw new Error('云端文件读取失败');
    }

    const data = await res.json();
    // 解码 Base64
    const content = decodeURIComponent(escape(atob(data.content)));
    return JSON.parse(content);
  },

  generateId() {
    return Math.random().toString(36).substring(2, 11);
  }
};