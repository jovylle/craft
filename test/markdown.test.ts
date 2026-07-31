import { describe, it, expect } from 'vitest'
import { renderMarkdown } from '../src/lib/markdown'

describe('renderMarkdown', () => {
  it('renders headings, bold and links', async () => {
    const html = await renderMarkdown('# Title\n\nSome **bold** text and a [link](https://x.com).')
    expect(html).toContain('<h1>Title</h1>')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<a href="https://x.com">link</a>')
  })

  it('renders code blocks and tables', async () => {
    const html = await renderMarkdown('```ts\nconst x = 1\n```\n\n| a | b |\n|---|---|\n| 1 | 2 |')
    expect(html).toContain('<pre><code class="language-ts">')
    expect(html).toContain('<table>')
    expect(html).toContain('<td>1</td>')
  })

  it('sanitizes raw html from the markdown source', async () => {
    const html = await renderMarkdown('hello\n\n<script>alert(1)</script>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('hello')
  })

  it('breaks on single newlines', async () => {
    const html = await renderMarkdown('line one\nline two')
    expect(html).toContain('line one<br>')
  })
})
