// vite.config.js
import { fileURLToPath, URL } from "url";
import react from "file:///mnt/c/Users/aryan/Desktop/TheFolder/some/blockchain-internship/project/Hospital_Chain/node_modules/@vitejs/plugin-react/dist/index.js";
import { defineConfig } from "file:///mnt/c/Users/aryan/Desktop/TheFolder/some/blockchain-internship/project/Hospital_Chain/node_modules/vite/dist/node/index.js";
import environment from "file:///mnt/c/Users/aryan/Desktop/TheFolder/some/blockchain-internship/project/Hospital_Chain/node_modules/vite-plugin-environment/dist/index.js";
import dotenv from "file:///mnt/c/Users/aryan/Desktop/TheFolder/some/blockchain-internship/project/Hospital_Chain/node_modules/dotenv/lib/main.js";
var __vite_injected_original_import_meta_url = "file:///mnt/c/Users/aryan/Desktop/TheFolder/some/blockchain-internship/project/Hospital_Chain/src/Hospital_Chain_frontend/vite.config.js";
dotenv.config({ path: "../../.env" });
var vite_config_default = defineConfig({
  build: {
    emptyOutDir: true
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis"
      }
    }
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true
      }
    }
  },
  plugins: [
    react(),
    environment("all", { prefix: "CANISTER_" }),
    environment("all", { prefix: "DFX_" })
  ],
  test: {
    environment: "jsdom",
    setupFiles: "src/setupTests.js"
  },
  resolve: {
    alias: [
      {
        find: "declarations",
        replacement: fileURLToPath(
          new URL("../declarations", __vite_injected_original_import_meta_url)
        )
      }
    ],
    dedupe: ["@dfinity/agent"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvbW50L2MvVXNlcnMvYXJ5YW4vRGVza3RvcC9UaGVGb2xkZXIvc29tZS9ibG9ja2NoYWluLWludGVybnNoaXAvcHJvamVjdC9Ib3NwaXRhbF9DaGFpbi9zcmMvSG9zcGl0YWxfQ2hhaW5fZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9tbnQvYy9Vc2Vycy9hcnlhbi9EZXNrdG9wL1RoZUZvbGRlci9zb21lL2Jsb2NrY2hhaW4taW50ZXJuc2hpcC9wcm9qZWN0L0hvc3BpdGFsX0NoYWluL3NyYy9Ib3NwaXRhbF9DaGFpbl9mcm9udGVuZC92aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vbW50L2MvVXNlcnMvYXJ5YW4vRGVza3RvcC9UaGVGb2xkZXIvc29tZS9ibG9ja2NoYWluLWludGVybnNoaXAvcHJvamVjdC9Ib3NwaXRhbF9DaGFpbi9zcmMvSG9zcGl0YWxfQ2hhaW5fZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjsvLy8gPHJlZmVyZW5jZSB0eXBlcz1cInZpdGVzdFwiIC8+XG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoLCBVUkwgfSBmcm9tICd1cmwnO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IGVudmlyb25tZW50IGZyb20gJ3ZpdGUtcGx1Z2luLWVudmlyb25tZW50JztcbmltcG9ydCBkb3RlbnYgZnJvbSAnZG90ZW52JztcblxuZG90ZW52LmNvbmZpZyh7IHBhdGg6ICcuLi8uLi8uZW52JyB9KTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgYnVpbGQ6IHtcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgZXNidWlsZE9wdGlvbnM6IHtcbiAgICAgIGRlZmluZToge1xuICAgICAgICBnbG9iYWw6IFwiZ2xvYmFsVGhpc1wiLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBwcm94eToge1xuICAgICAgXCIvYXBpXCI6IHtcbiAgICAgICAgdGFyZ2V0OiBcImh0dHA6Ly8xMjcuMC4wLjE6NDk0M1wiLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIGVudmlyb25tZW50KFwiYWxsXCIsIHsgcHJlZml4OiBcIkNBTklTVEVSX1wiIH0pLFxuICAgIGVudmlyb25tZW50KFwiYWxsXCIsIHsgcHJlZml4OiBcIkRGWF9cIiB9KSxcbiAgXSxcbiAgdGVzdDoge1xuICAgIGVudmlyb25tZW50OiAnanNkb20nLFxuICAgIHNldHVwRmlsZXM6ICdzcmMvc2V0dXBUZXN0cy5qcycsXG4gIH0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczogW1xuICAgICAge1xuICAgICAgICBmaW5kOiBcImRlY2xhcmF0aW9uc1wiLFxuICAgICAgICByZXBsYWNlbWVudDogZmlsZVVSTFRvUGF0aChcbiAgICAgICAgICBuZXcgVVJMKFwiLi4vZGVjbGFyYXRpb25zXCIsIGltcG9ydC5tZXRhLnVybClcbiAgICAgICAgKSxcbiAgICAgIH0sXG4gICAgXSxcbiAgICBkZWR1cGU6IFsnQGRmaW5pdHkvYWdlbnQnXSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsZUFBZSxXQUFXO0FBQ25DLE9BQU8sV0FBVztBQUNsQixTQUFTLG9CQUFvQjtBQUM3QixPQUFPLGlCQUFpQjtBQUN4QixPQUFPLFlBQVk7QUFMeVQsSUFBTSwyQ0FBMkM7QUFPN1gsT0FBTyxPQUFPLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFFcEMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsT0FBTztBQUFBLElBQ0wsYUFBYTtBQUFBLEVBQ2Y7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLGdCQUFnQjtBQUFBLE1BQ2QsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLE1BQ1Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFlBQVksT0FBTyxFQUFFLFFBQVEsWUFBWSxDQUFDO0FBQUEsSUFDMUMsWUFBWSxPQUFPLEVBQUUsUUFBUSxPQUFPLENBQUM7QUFBQSxFQUN2QztBQUFBLEVBQ0EsTUFBTTtBQUFBLElBQ0osYUFBYTtBQUFBLElBQ2IsWUFBWTtBQUFBLEVBQ2Q7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMO0FBQUEsUUFDRSxNQUFNO0FBQUEsUUFDTixhQUFhO0FBQUEsVUFDWCxJQUFJLElBQUksbUJBQW1CLHdDQUFlO0FBQUEsUUFDNUM7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsUUFBUSxDQUFDLGdCQUFnQjtBQUFBLEVBQzNCO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
