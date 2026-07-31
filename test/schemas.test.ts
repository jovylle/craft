import { describe, it, expect } from 'vitest'
import {
  HomepageSchema,
  ProfileSchema,
  ProjectsSchema,
  BlogIndexSchema,
  BlogPostSchema,
  SocialSchema,
} from '../src/data/schemas'

const realHomepage = {
  hero: { title: "It's me, Jovylle", tagline: 'A Full-Stack Web Developer', description: 'Building modern web experiences with clean code and thoughtful design', githubHandle: 'jovylle' },
  ctas: [{ label: 'Get in touch', route: '/contact', variant: 'primary' }],
}

const realProject = {
  title: 'SFL Digging Assistant',
  description: 'Daily 300 Visitors. d1g.uk is a fast, free, and visual tool.',
  repo: 'https://github.com/jovylle/sfl-crab',
  updated_at: '2026-02-28T00:35:15Z',
  slug: 'sfl-crab',
  status: 'published',
  private: false,
  fav: true,
  priority_score: 600,
  tech: ['JS', 'Vue', 'Nuxt', 'Serverless'],
  links: [{ label: 'Repo', url: 'https://github.com/jovylle/sfl-crab' }],
  created_at: '2025-04-22T12:22:50Z',
  thumbnail: '/images/post/sfl-crab.png',
  language: 'JS, Vue, Nuxt, Serverless',
}

const realPostSummary = {
  slug: 'project-factory-500-autonomous-ai-apps',
  title: 'Project Factory: 500 Apps Built by Underpaid AI',
  date: '2026-07-17',
  excerpt: '500 small web apps built entirely by AI.',
  tags: ['ai', 'automation'],
  featured: true,
}

const realPost = {
  ...realPostSummary,
  author: 'Jovylle Bermudez',
  thumbnail: 'https://content.jovylle.com/images/post/factory-hero.png',
  content: '# Hello\n\nSome **markdown** body.',
}

const realSocial = {
  links: [
    { label: 'Email', url: 'mailto:me@jovylle.com', icon: 'email' },
    { label: 'GitHub', url: 'https://github.com/jovylle', icon: 'github' },
  ],
}

describe('schemas accept real vault payloads', () => {
  it('homepage', () => expect(HomepageSchema.parse(realHomepage).hero.title).toBe("It's me, Jovylle"))
  it('profile', () => expect(ProfileSchema.parse({ title: 'Full-Stack Web Developer', short_bio: 'Builds modern web experiences.', availability: 'Open to opportunities' }).short_bio).toContain('modern'))
  it('projects', () => expect(ProjectsSchema.parse({ projects: [realProject] }).projects[0].priority_score).toBe(600))
  it('blog index', () => expect(BlogIndexSchema.parse({ posts: [realPostSummary] }).posts[0].featured).toBe(true))
  it('blog post', () => expect(BlogPostSchema.parse(realPost).content).toContain('markdown'))
  it('social', () => expect(SocialSchema.parse(realSocial).links).toHaveLength(2))
})

describe('schemas reject malformed payloads', () => {
  it('project missing slug', () => {
    const bad = { ...realProject }
    delete (bad as { slug?: string }).slug
    expect(() => ProjectsSchema.parse({ projects: [bad] })).toThrow()
  })
  it('homepage missing hero.title', () => {
    expect(() => HomepageSchema.parse({ hero: { tagline: 'x' } })).toThrow()
  })
  it('post with non-string content', () => {
    expect(() => BlogPostSchema.parse({ ...realPost, content: 42 })).toThrow()
  })
})
