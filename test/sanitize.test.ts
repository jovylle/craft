import { describe, it, expect } from 'vitest'
import { sanitizeHtml } from '../src/lib/sanitize'

describe('sanitizeHtml', () => {
  it('keeps allowed formatting', () => {
    const html = '<h2>Title</h2><p>Hello <strong>bold</strong> and <a href="https://x.com">link</a>.</p>'
    expect(sanitizeHtml(html)).toBe('<h2>Title</h2><p>Hello <strong>bold</strong> and <a href="https://x.com">link</a>.</p>')
  })

  it('drops script blocks including their content', () => {
    expect(sanitizeHtml('<p>ok</p><script>alert(1)</script><p>after</p>')).toBe('<p>ok</p><p>after</p>')
  })

  it('drops style and iframe', () => {
    expect(sanitizeHtml('<style>body{}</style><iframe src="https://evil"></iframe><p>x</p>')).toBe('<p>x</p>')
  })

  it('strips dangerous attributes', () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)" onclick="x()">bad</a>')).toBe('<a>bad</a>')
  })

  it('blocks javascript: links on img', () => {
    expect(sanitizeHtml('<img src="javascript:alert(1)">')).toBe('')
  })

  it('removes comments', () => {
    expect(sanitizeHtml('<p>a</p><!-- comment --><p>b</p>')).toBe('<p>a</p><p>b</p>')
  })

  it('escapes attribute values', () => {
    expect(sanitizeHtml('<a href="https://x.com?a=1&amp;b=2">x</a>')).toBe('<a href="https://x.com?a=1&amp;b=2">x</a>')
  })

  it('keeps markdown-generated structure', () => {
    const html = '<ul><li>one</li><li>two</li></ul><pre><code class="language-ts">const x = 1</code></pre>'
    expect(sanitizeHtml(html)).toBe(html)
  })
})
