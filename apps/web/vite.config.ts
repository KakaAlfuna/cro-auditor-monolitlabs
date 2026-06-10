import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://b977-103-247-23-87.ngrok-free.app",
        changeOrigin: true,
        secure: false,
      },
    },
    allowedHosts: ["b977-103-247-23-87.ngrok-free.app"],
  },
});
