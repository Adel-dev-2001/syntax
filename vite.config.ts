import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures relative asset paths for seamless GitHub Pages deployment
  server: {
    port: 5173,
    host: true
  }
});
