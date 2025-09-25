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
    build: {
      outDir: "dist",
      sourcemap: true,
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              return "vendor";
            }
          },
        },
      },
    },
    define: {
      "import.meta.env.VITE_FIREBASE_API_KEY": JSON.stringify(
        env.VITE_FIREBASE_API_KEY
      ),
      "import.meta.env.VITE_FIREBASE_AUTH_DOMAIN": JSON.stringify(
        env.VITE_FIREBASE_AUTH_DOMAIN
      ),
      "import.meta.env.VITE_FIREBASE_PROJECT_ID": JSON.stringify(
        env.VITE_FIREBASE_PROJECT_ID
      ),
      "import.meta.env.VITE_FIREBASE_STORAGE_BUCKET": JSON.stringify(
        env.VITE_FIREBASE_STORAGE_BUCKET
      ),
      "import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID": JSON.stringify(
        env.VITE_FIREBASE_MESSAGING_SENDER_ID
      ),
      "import.meta.env.VITE_FIREBASE_APP_ID": JSON.stringify(
        env.VITE_FIREBASE_APP_ID
      ),
      "import.meta.env.VITE_FIREBASE_MEASUREMENT_ID": JSON.stringify(
        env.VITE_FIREBASE_MEASUREMENT_ID
      ),
      "process.env.VITE_FIREBASE_AUTH_DOMAIN": JSON.stringify(
        process.env.VITE_FIREBASE_AUTH_DOMAIN
      ),
      "process.env.VITE_FIREBASE_PROJECT_ID": JSON.stringify(
        process.env.VITE_FIREBASE_PROJECT_ID
      ),
      "process.env.VITE_FIREBASE_STORAGE_BUCKET": JSON.stringify(
        process.env.VITE_FIREBASE_STORAGE_BUCKET
      ),
      "process.env.VITE_FIREBASE_MESSAGING_SENDER_ID": JSON.stringify(
        process.env.VITE_FIREBASE_MESSAGING_SENDER_ID
      ),
      "process.env.VITE_FIREBASE_APP_ID": JSON.stringify(
        process.env.VITE_FIREBASE_APP_ID
      ),
      "process.env.VITE_FIREBASE_MEASUREMENT_ID": JSON.stringify(
        process.env.VITE_FIREBASE_MEASUREMENT_ID
      ),
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
