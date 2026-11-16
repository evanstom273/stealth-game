import { defineConfig, devices } from '@playwright/test'

const PORT = 5199

export default defineConfig({
  testDir: './tests/e2e',
  // The game renders on the CPU in headless browsers, so give tests room and don't run too many at once.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // One at a time: the game renders on the CPU here, and timing windows (stuns, combos) need the frames.
  workers: 1,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'off',
  },
  projects: [
    // The side-on build (History #92 keeps it at ?view=side), in the browser exactly as before.
    { name: 'side-on', testIgnore: /fps\.spec/, use: { ...devices['Desktop Chrome'] } },
    // First person needs WebGL, which the headless browser only has on the CPU.
    { name: 'first-person', testMatch: /fps\.spec/, use: { ...devices['Desktop Chrome'], launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } } },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
})
