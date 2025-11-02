import { defineConfig } from "vite";

export default defineConfig({
  root: "src",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "apples.html") {
            return "apples.html";
          }
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
  publicDir: false,
  css: {
    preprocessorOptions: {
      scss: {},
    },
  },
});
