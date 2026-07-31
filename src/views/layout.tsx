import { html } from 'hono/html'
import type { Child } from 'hono/jsx'

// Task 2's schemas.ts does not export a SocialLink type (only SocialLinkSchema),
// so the shape is defined here — structurally identical to z.infer of it.
export interface SocialLink {
  label: string
  url: string
  icon?: string
}

const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap'

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/projects', label: 'Projects' },
  { href: '/blog', label: 'Blog' },
]

function isActive(path: string, href: string): boolean {
  if (href === '/') return path === '/'
  return path === href || path.startsWith(href + '/')
}

interface HeaderProps {
  path: string
}

function Header({ path }: HeaderProps) {
  return (
    <header class="site-header">
      <a class="brand" href="/">
        craft<span class="brand-dot">.</span>
      </a>
      <nav class="site-nav" aria-label="Primary">
        {NAV.map((item) => (
          <a href={item.href} class={isActive(path, item.href) ? 'nav-link active' : 'nav-link'}>
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  )
}

interface FooterProps {
  socialLinks: SocialLink[]
}

function Footer({ socialLinks }: FooterProps) {
  return (
    <footer class="site-footer">
      <p class="footer-note">
        © {new Date().getFullYear()} Jovylle · Built with Hono on Cloudflare Workers
      </p>
      <div class="footer-social">
        {socialLinks.map((link) => (
          <a class="social-link" href={link.url} rel="noopener noreferrer" key={link.label}>
            {link.label}
          </a>
        ))}
      </div>
    </footer>
  )
}

export interface LayoutProps {
  title: string
  description?: string
  path: string
  socialLinks?: SocialLink[]
  children?: Child
}

export function Layout({ title, description = '', path, socialLinks = [], children }: LayoutProps) {
  return (
    <>
      {html`<!doctype html>`}
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title} — craft</title>
        <meta name="description" content={description} />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
        <link href={FONTS_URL} rel="stylesheet" />
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <div class="aurora aurora--a" aria-hidden="true" />
        <div class="aurora aurora--b" aria-hidden="true" />
        <a class="skip-link" href="#main">
          Skip to content
        </a>
        <Header path={path} />
        <main id="main">{children}</main>
        <Footer socialLinks={socialLinks} />
        <script src="/app.js" defer />
      </body>
      </html>
    </>
  )
}
