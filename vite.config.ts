import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load environment variables from the system/shell (Netlify sets these)
  // Casting process to any to resolve Property 'cwd' does not exist on type 'Process' TS error.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // This correctly replaces process.env.API_KEY with the actual value from Netlify/env
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