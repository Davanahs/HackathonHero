import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load environment variables from the system/shell (Netlify sets these)
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // This correctly replaces process.env.API_KEY with the actual value from Netlify
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: './index.html'
      }
    },
    server: {
      port: 3000
    }
  };
});