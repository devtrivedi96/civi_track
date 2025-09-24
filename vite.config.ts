import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ["lucide-react"],
    },
    // Add public directory to serve marker images
    publicDir: "public",
    server: {
      host: true,
      port: Number(env.PORT) || 5173,
    },
    preview: {
      host: true,
      port: Number(process.env.PORT) || 3000,
    },
  };
});
