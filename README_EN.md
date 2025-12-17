# HAJIMI Bookmark Manager

HAJIMI is a robust, cross-platform bookmark manager designed for minimalists. It supports both public and private workspaces with real-time data synchronization.

## ✨ Features

- **Dual Workspace Modes**:
  - 🔒 **Private Mode**: Personal bookmarks visible only to you (secured via Firebase Auth).
  - 🌍 **Public Mode**: A shared repository for team resources or public navigation.
- **Real-time Sync**: Powered by Google Firebase Firestore for instant updates across devices.
- **Import/Export**:
  - Import bookmarks from standard HTML files (Chrome/Edge/Firefox).
  - Backup and restore using a dedicated JSON format.
- **Modern UI**:
  - Fully responsive design built with Tailwind CSS.
  - Toggle between Grid and List views.
  - Immersive Dark Mode interface.
- **Smart Utilities**: Automatic Favicon extraction.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Icons**: Lucide React
- **Backend/Cloud**: Google Firebase (Authentication, Firestore)
- **Build Tool**: Vite

## 🚀 Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file in the root directory (see configuration below).

3. **Start Server**
   ```bash
   npm run dev
   ```

## 📦 Deploy to Cloudflare Pages

This project is configured with Vite, making it ready for Cloudflare Pages or Vercel.

1. Push your code to GitHub.
2. Create a new project in Cloudflare Pages and connect your repository.
3. **Build Settings**:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
4. **Environment Variables**:
   Set the following variables in the Cloudflare dashboard:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

## 📄 Environment Variables (.env)

Use a `.env` file for local development and platform settings for production.

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
