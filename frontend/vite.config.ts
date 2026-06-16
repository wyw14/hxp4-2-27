import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 42052,
    proxy: {
      '/api': {
        target: 'http://localhost:42053',
        changeOrigin: true,
      },
    },
  },
});
