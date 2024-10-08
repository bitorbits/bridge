import { resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";
import * as packageJson from "./package.json";

export default defineConfig({
  define: {
    __VERSION__: JSON.stringify(packageJson.version),
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/bridge.ts"),
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
  plugins: [vue(), dts({ rollupTypes: true })],
});
