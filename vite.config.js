import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'anim2d',
      fileName: 'anim2d',
      formats: ['es', 'umd']
    },
    outDir: 'dist'
  },
  test: {
    environment: 'jsdom',
    globals: true
  }
});
