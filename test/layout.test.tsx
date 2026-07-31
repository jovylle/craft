import { describe, it, expect } from 'vitest'
import { Layout } from '../src/views/layout'
import { render } from '../src/lib/test-render'

describe('Layout', () => {
  it('renders the html shell with title, fonts, stylesheet and script', () => {
    const html = render(<Layout title="Home" description="desc" path="/" socialLinks={[{ label: 'GitHub', url: 'https://github.com/jovylle' }]}><p>content</p></Layout>)
    expect(html).toContain('<!doctype html>')
    expect(html).toContain('<title>Home — craft</title>')
    expect(html).toContain('fonts.googleapis.com')
    expect(html).toContain('href="/styles.css"')
    expect(html).toContain('src="/app.js"')
    expect(html).toContain('class="aurora')
    expect(html).toContain('Skip to content')
    expect(html).toContain('<p>content</p>')
    expect(html).toContain('https://github.com/jovylle')
  })

  it('marks the active nav link', () => {
    const html = render(<Layout title="Projects" description="" path="/projects" socialLinks={[]}><p>x</p></Layout>)
    expect(html).toContain('class="nav-link active"')
    expect(html).toContain('href="/projects"')
  })
})
