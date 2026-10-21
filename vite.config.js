import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build:artifact` inlines everything into one dist/index.html
// so the prototype can be published as a single page and played on a phone.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: mode === 'artifact' ? [viteSingleFile()] : [],
  build: { outDir: mode === 'artifact' ? 'dist-artifact' : 'dist' },
}));
