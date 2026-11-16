import { defineConfig } from 'vitest/config'

// Kept separate from vite.config.ts so unit tests don't start the Workers runtime.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    passWithNoTests: true,
  },
})
