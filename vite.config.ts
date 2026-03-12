import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    rollupOptions: {
      input: {
        'quest-app': './src/quest-app.html'
      }
    },
    outDir: 'dist'
  },
  server: {
    port: 3000
  }
});
