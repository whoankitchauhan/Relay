import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file from the frontend directory so VITE_* vars are available here
  const env = loadEnv(mode, process.cwd(), '');

  const backendUrl = env.VITE_API_URL || 'http://localhost:5080';

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: backendUrl,
          ws: true,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
