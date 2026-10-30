import { defineConfig } from "@playwright/test";

const python = process.platform === "win32" ? "..\\.venv\\Scripts\\python.exe" : "../.venv/bin/python";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  use: { baseURL: "http://localhost:3000" },
  webServer: [
    {
      command: `${python} -m uvicorn app.main:app --app-dir ../backend --port 8000`,
      url: "http://localhost:8000/health",
      reuseExistingServer: true,
      env: { DATABASE_URL: "sqlite:///../backend/e2e.db" },
    },
    { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: true, timeout: 120_000 },
  ],
});
