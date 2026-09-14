import {build} from 'esbuild';

await build({
  entryPoints: ['src/player.tsx'],
  bundle: true,
  minify: true,
  sourcemap: false,
  format: 'iife',
  target: ['es2020'],
  outfile: '../motion-player.js',
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});
