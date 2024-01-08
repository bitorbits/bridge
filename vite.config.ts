import { resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/lib/bridge.ts"),
      name: "bridge",
      fileName: "bridge",
      formats: ["es"],
    },
    rollupOptions: {
      external: ["uuid"],
      output: {
        globals: {
          uuid: "uuid",
        },
      },
    },
  },
  plugins: [vue(), dts()],
});
