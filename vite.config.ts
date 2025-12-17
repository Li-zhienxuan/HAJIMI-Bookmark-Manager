import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  build: {
    // Increase the warning limit slightly as Firebase is large
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split vendor code (React, Firebase) into separate chunks for better caching
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'vendor-ui': ['lucide-react']
        }
      }
    }
  }
});