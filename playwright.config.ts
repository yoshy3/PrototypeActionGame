import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60000,
  workers: 1,
  use: { baseURL: "http://127.0.0.1:5173", viewport: { width: 1920, height: 1080 }, headless: true },
  webServer: { command: "npm run dev -- --port 5173 --strictPort", url: "http://127.0.0.1:5173", reuseExistingServer: !process.env.CI }
});
