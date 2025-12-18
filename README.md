# HAJIMI Bookmark Manager (GitHub Edition)

HAJIMI 是一个现代化的、基于文件的书签管理器。它不再依赖 Firebase，而是将您的书签数据作为一个 JSON 文件保存在您自己的 GitHub 仓库中。

## ✨ 核心优势

- **国内友好**: 彻底移除海外慢速 CDN，访问极速。
- **数据自主**: 数据保存在您的 GitHub 仓库，由您完全掌控。
- **无状态**: 无需服务器，通过 GitHub API 实现多端数据同步。
- **离线优先**: 自动拉取云端数据到本地缓存，即使断网也能浏览。

## 🚀 快速开始

1. **GitHub 配置**:
   - 在设置中填写您的 GitHub Token (需要 `repo` 权限)。
   - 指定仓库名（如 `hajimi-data`）和分支。
2. **立即同步**: 点击“立即同步”即可将本地数据与云端文件双向合并。

## 📝 开发

```bash
npm install
npm run dev
```