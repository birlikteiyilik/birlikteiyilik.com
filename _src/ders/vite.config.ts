import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/ders/",
  plugins: [react()],
  build: { outDir: "../../ders", emptyOutDir: true },
});
