import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, 'index.html'),
        },
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          assetFileNames: '[name].[ext]'
        }
      }
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      {
        name: 'copy-extension-files',
        closeBundle() {
          // Ensure dist directory exists
          if (!existsSync('dist')) {
            mkdirSync('dist', { recursive: true });
          }
          // Copy manifest.json
          copyFileSync('manifest.json', 'dist/manifest.json');
          // Copy background.js
          copyFileSync('background.js', 'dist/background.js');
          // Copy content.js
          copyFileSync('content.js', 'dist/content.js');
          // Copy icons
          if (!existsSync('dist/icons')) {
            mkdirSync('dist/icons', { recursive: true });
          }
          copyFileSync('icons/icon48.png', 'dist/icons/icon48.png');
        }
      }
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
