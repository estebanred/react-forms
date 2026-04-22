import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss(), basicSsl()],
    server: {
      proxy: {
        "/marketo-api": {
          target: env.VITE_MARKETO_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/marketo-api/, ""),
        },
      },
    },
  };
});
