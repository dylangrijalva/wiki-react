import { defineConfig } from '@playwright/test'

const apiPort = process.env.E2E_API_PORT ?? '4319'
const webPort = process.env.E2E_WEB_PORT ?? '4320'
const apiOrigin = 'http://127.0.0.1:' + apiPort
const baseURL = 'http://127.0.0.1:' + webPort

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 3,
  use: {
    baseURL,
    channel: process.env.PLAYWRIGHT_CHANNEL,
    viewport: { width: 1440, height: 940 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'pnpm --filter @rendered/api exec tsx ../../tests/api-server.mjs',
      url: apiOrigin + '/api/health',
      env: { PORT: apiPort, HOST: '127.0.0.1', NODE_ENV: 'test' },
      gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 },
    },
    {
      command: 'pnpm --filter @rendered/web dev --port ' + webPort,
      url: baseURL,
      env: { API_ORIGIN: apiOrigin },
      gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 },
    },
  ],
})
