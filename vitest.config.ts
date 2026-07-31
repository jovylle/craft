import { defineConfig } from 'vitest/config'

// Vitest 4 transforms with oxc, which ignores the esbuild jsx block — the
// hono/jsx automatic runtime is configured explicitly via the oxc options.
// JSX lives in `.test.tsx` files (tsc also rejects JSX in a `.ts` extension),
// so the include glob matches both.
export default defineConfig({
  oxc: {
    jsx: {
      runtime: 'automatic',
      importSource: 'hono/jsx',
    },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.{ts,tsx}'],
  },
})
