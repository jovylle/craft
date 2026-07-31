import { jsx } from 'hono/jsx'
import type { Child } from 'hono/jsx'

/** Render a Hono JSX node to an HTML string (test helper). */
export function render(node: unknown): string {
  // hono's jsx() only threads children through its rest args (props.children is
  // ignored for intrinsic elements), so the node goes in as a child.
  const el = jsx('div', null, node as Child) as unknown as { toString(): string }
  return el.toString()
}
