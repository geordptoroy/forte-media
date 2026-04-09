import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Visualizar tamanho do bundle
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },

  build: {
    // Otimizações de build
    target: "esnext",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },

    // Code splitting otimizado
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar dependências grandes em chunks
          "react-vendor": ["react", "react-dom"],
          "ui-vendor": ["@radix-ui/react-dialog", "@radix-ui/react-popover"],
          "trpc-vendor": ["@trpc/client", "@trpc/react-query"],
          "utils": ["date-fns", "clsx", "tailwind-merge"],
        },
      },
    },

    // Otimizações de CSS
    cssCodeSplit: true,
    cssMinify: true,

    // Limites de warning
    chunkSizeWarningLimit: 500,
    reportCompressedSize: true,

    // Source maps apenas em desenvolvimento
    sourcemap: process.env.NODE_ENV === "development",
  },

  // Otimizações de desenvolvimento
  server: {
    middlewareMode: false,
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 5173,
    },
  },

  // Otimizações de dependências
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@trpc/client",
      "@trpc/react-query",
      "framer-motion",
      "sonner",
    ],
    exclude: ["@vite/client"],
  },
});
