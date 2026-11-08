import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: false,
    treeshake: true,
    target: 'es2020',
    outDir: 'dist',
    external: ['react', 'react-dom', 'react-native', /^@dloizides\/ui-/],
  },
  {
    entry: { 'photo-studio-worker': 'src/engine/workerEntry.ts' },
    format: ['iife'],
    dts: false,
    splitting: false,
    sourcemap: false,
    clean: false,
    minify: true,
    target: 'es2020',
    outDir: 'dist',
    noExternal: [/.*/],
    outExtension: () => ({ js: '.js' }),
  },
]);
