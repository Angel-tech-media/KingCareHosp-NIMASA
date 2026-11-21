import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: ['workspace-nqdadgzw-5dc87b6a9fec8690.v0.build'],
  },
  preview: {
    allowedHosts: ['workspace-nqdadgzw-5dc87b6a9fec8690.v0.build'],
  },
});
