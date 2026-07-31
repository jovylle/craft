import type { DataClient } from '../src/data/client'
import type { Homepage, Profile, Project, BlogPostSummary, BlogPost, Social } from '../src/data/schemas'

export const homepageFixture: Homepage = {
  hero: {
    title: "It's me, Jovylle",
    tagline: 'A Full-Stack Web Developer',
    description: 'Building modern web experiences with clean code and thoughtful design',
    githubHandle: 'jovylle',
  },
  ctas: [],
}

export const profileFixture: Profile = {
  title: 'Full-Stack Web Developer',
  short_bio: 'Builds modern, performant web experiences and developer tools.',
  availability: 'Open to opportunities',
}

export const projectsFixture: Project[] = [
  {
    title: 'SFL Digging Assistant',
    description: 'A fast, free, and visual tool for Sunflower Land players.',
    slug: 'sfl-crab',
    fav: true,
    private: false,
    priority_score: 600,
    language: '',
    tech: ['Vue', 'Nuxt'],
    thumbnail: 'https://content.jovylle.com/images/post/sfl-crab.png',
    links: [{ label: 'Repo', url: 'https://github.com/jovylle/sfl-crab' }, { label: 'Live', url: 'https://d1g.uk/' }],
  },
  {
    title: 'Chat Assistant Box',
    description: 'A fast, modern AI chat interface with markdown support.',
    slug: 'chat',
    fav: false,
    private: false,
    priority_score: 340,
    language: '',
    tech: ['JS', 'Node', 'AI'],
    thumbnail: 'https://content.jovylle.com/images/post/chat.png',
    links: [],
  },
  {
    title: 'LoopGallery',
    description: 'Social gallery for loops and creative shares.',
    slug: 'loop-gallery-space',
    fav: false,
    private: false,
    priority_score: 430,
    language: '',
    tech: ['Nuxt 3', 'D1'],
    thumbnail: 'https://content.jovylle.com/images/loop-gallery-space.png',
    links: [],
  },
]

export const blogIndexFixture: BlogPostSummary[] = [
  { slug: 'project-factory-500-autonomous-ai-apps', title: 'Project Factory: 500 Apps Built by Underpaid AI', date: '2026-07-17', excerpt: '500 small web apps built entirely by AI.', tags: ['ai', 'pipeline'], featured: true },
  { slug: 'why-i-used-cursor-ide-for-a-year', title: 'Why I Used Cursor IDE for a Year', date: '2026-07-07', excerpt: "It's the only editor that felt like everything I needed was already there.", tags: ['cursor', 'tools'], featured: false },
  { slug: 'blog-post', title: 'blog-post', date: '', excerpt: '', tags: [], featured: false },
]

export const postFixture: BlogPost = {
  slug: 'project-factory-500-autonomous-ai-apps',
  title: 'Project Factory: 500 Apps Built by Underpaid AI',
  date: '2026-07-17',
  excerpt: '500 small web apps built entirely by AI.',
  author: 'Jovylle Bermudez',
  tags: ['ai', 'pipeline'],
  featured: true,
  thumbnail: 'https://content.jovylle.com/images/post/factory-hero.png',
  content: '# Project Factory\n\nSome **bold** content.',
}

export const socialFixture: Social = {
  links: [
    { label: 'Email', url: 'mailto:me@jovylle.com', icon: 'email' },
    { label: 'GitHub', url: 'https://github.com/jovylle', icon: 'github' },
    { label: 'LinkedIn', url: 'https://linkedin.com/in/jovylle', icon: 'linkedin' },
  ],
}

export interface MockClientOptions {
  projects?: Project[]
  posts?: BlogPostSummary[]
  post?: BlogPost | undefined
  failProjects?: boolean
}

export function createMockClient(opts: MockClientOptions = {}): DataClient {
  const { projects = projectsFixture, posts = blogIndexFixture, post = postFixture, failProjects = false } = opts
  return {
    getHomepage: async () => homepageFixture,
    getProfile: async () => profileFixture,
    getProjects: async () => {
      if (failProjects) throw new Error('vault down')
      return projects
    },
    getBlogIndex: async () => posts,
    getPost: async (slug) => (post && post.slug === slug ? post : undefined),
    getSocial: async () => socialFixture,
  }
}
