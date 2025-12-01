import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  root: './',
  base: './', // Use relative paths for ingress compatibility
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/ghostty-web/ghostty-vt.wasm',
          dest: '.',
        },
      ],
    }),
  ],
  build: {
    outDir: process.env.BUILD_OUT_DIR || '../rootfs/opt/ghostty/public',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
  server: {
    port: 5173,
  },
});

