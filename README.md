# HAJIMI Bookmark Manager (书签管理器)

HAJIMI 是一个现代化的、跨平台的书签管理器，专为极简主义者设计。它支持公共和私有工作区，具备实时数据同步功能。

## ✨ 功能特性

- **双模式工作区**:
  - 🔒 **私有模式**: 仅您自己可见的个人书签（基于 Firebase Auth）。
  - 🌍 **公共模式**: 所有人共享的公共资源库，适合团队分享或常用资源导航。
- **数据同步**: 基于 Google Firebase Firestore 实现多端实时同步。
- **导入/导出**:
  - 支持从浏览器 (Chrome/Edge/Firefox) 导出的 HTML 文件导入。
  - 支持专属 JSON 格式备份与恢复。
- **现代化 UI**:
  - 响应式设计 (Tailwind CSS)。
  - 网格 (Grid) 与 列表 (List) 视图切换。
  - 沉浸式暗色模式。
- **智能辅助**: 自动提取 URL Favicon。

## 🛠️ 技术栈

- **前端**: React 18, TypeScript, Tailwind CSS
- **图标库**: Lucide React
- **后端/云服务**: Google Firebase (Authentication, Firestore)
- **构建工具**: Vite

## 🚀 本地开发

1. **安装依赖**
   ```bash
   npm install
   ```

2. **配置环境变量**
   在项目根目录创建 `.env` 文件 (参考下文配置)。

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

## 📦 部署到 Cloudflare Pages

本项目已配置为使用 Vite 构建，非常适合部署到 Cloudflare Pages 或 Vercel。

1. 将代码推送到 GitHub。
2. 在 Cloudflare Pages 创建新项目并连接仓库。
3. **构建设置**:
   - **框架预设 (Framework preset)**: Vite
   - **构建命令 (Build command)**: `npm run build`
   - **输出目录 (Output directory)**: `dist`
4. **环境变量**:
   在 Cloudflare 后台设置以下变量：
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

## ⚠️ Firebase 配置重要说明

为了让应用正常工作，您必须在 Firebase Console 中进行以下配置：

1. **启用 Firestore 数据库**: 在 "Build" > "Firestore Database" 中创建数据库。
2. **启用 Authentication**: 在 "Build" > "Authentication" 中点击 "Get started"。
3. **启用匿名登录 (Anonymous)**:
   - 进入 "Authentication" > "Sign-in method" 标签页。
   - 找到 "Anonymous" 提供商。
   - 开启并保存。
   - **如果未开启此项，应用会报错 `auth/configuration-not-found`。**

## 📄 环境变量说明 (.env)

为了安全起见，本地开发请使用 `.env` 文件，生产环境请在部署平台设置。

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 📝 License

MIT