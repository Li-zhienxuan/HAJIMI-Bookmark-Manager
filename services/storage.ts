import { Bookmark, GitHubConfig } from '../types';

const PRIVATE_KEY = 'hajimi_bookmarks_private';
const PUBLIC_KEY = 'hajimi_bookmarks_public';
const GITHUB_CONFIG_KEY = 'hajimi_github_config';

export const localDb = {
  saveLocal(mode: 'private' | 'public', bookmarks: Bookmark[]) {
    const key = mode === 'private' ? PRIVATE_KEY : PUBLIC_KEY;
    localStorage.setItem(key, JSON.stringify(bookmarks));
  },

  loadLocal(mode: 'private' | 'public'): Bookmark[] {
    const key = mode === 'private' ? PRIVATE_KEY : PUBLIC_KEY;
    const data = localStorage.getItem(key);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  },

  saveGitHubConfig(config: GitHubConfig) {
    localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(config));
  },

  loadGitHubConfig(): GitHubConfig | null {
    const data = localStorage.getItem(GITHUB_CONFIG_KEY);
    return data ? JSON.parse(data) : null;
  },

  async syncToGitHub(config: GitHubConfig, bookmarks: Bookmark[]) {
    const { token, owner, repo, branch, path } = config;
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    
    // 1. Get the current file SHA (required for updating)
    let sha = '';
    try {
      const res = await fetch(`${url}?ref=${branch}`, {
        headers: { Authorization: `token ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        sha = data.sha;
      }
    } catch (e) {}

    // 2. Push the new data
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(bookmarks, null, 2))));
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Sync bookmarks from HAJIMI',
        content,
        sha: sha || undefined,
        branch
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'GitHub Sync Failed');
    }
  },

  async fetchFromGitHub(config: GitHubConfig): Promise<Bookmark[]> {
    const { token, owner, repo, branch, path } = config;
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
    
    const res = await fetch(url, {
      headers: { Authorization: `token ${token}` }
    });

    if (!res.ok) return [];

    const data = await res.json();
    const content = decodeURIComponent(escape(atob(data.content)));
    return JSON.parse(content);
  },

  generateId() {
    return Math.random().toString(36).substring(2, 15);
  }
};