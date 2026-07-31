import { z } from 'zod'

export const CtaSchema = z.object({
  label: z.string(),
  route: z.string().optional(),
  url: z.string().optional(),
  variant: z.string().optional(),
})

export const HomepageSchema = z.object({
  hero: z.object({
    title: z.string(),
    tagline: z.string(),
    description: z.string(),
    githubHandle: z.string(),
  }),
  ctas: z.array(CtaSchema).default([]),
})

export const ProfileSchema = z.object({
  title: z.string(),
  short_bio: z.string(),
  tone: z.string().optional(),
  contact_path: z.string().optional(),
  availability: z.string().optional(),
  last_edited: z.string().optional(),
})

export const ProjectLinkSchema = z.object({
  label: z.string(),
  url: z.string(),
})

export const ProjectSchema = z.object({
  title: z.string(),
  description: z.string().default(''),
  repo: z.string().optional(),
  updated_at: z.string().optional(),
  slug: z.string(),
  status: z.string().optional(),
  private: z.boolean().optional().default(false),
  fav: z.boolean().optional().default(false),
  priority_score: z.number().optional().default(0),
  tech: z.array(z.string()).default([]),
  links: z.array(ProjectLinkSchema).default([]),
  created_at: z.string().optional(),
  thumbnail: z.string().default(''),
  language: z.string().optional().default(''),
})

export const ProjectsSchema = z.object({
  projects: z.array(ProjectSchema).default([]),
})

export const BlogPostSummarySchema = z.object({
  slug: z.string(),
  title: z.string(),
  date: z.string().default(''),
  excerpt: z.string().default(''),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
})

export const BlogIndexSchema = z.object({
  posts: z.array(BlogPostSummarySchema).default([]),
})

export const BlogPostSchema = z.object({
  slug: z.string(),
  title: z.string(),
  date: z.string().default(''),
  excerpt: z.string().default(''),
  author: z.string().default(''),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  thumbnail: z.string().default(''),
  content: z.string().default(''),
  status: z.string().optional(),
})

export const SocialLinkSchema = z.object({
  label: z.string(),
  url: z.string(),
  icon: z.string().optional(),
})

export const SocialSchema = z.object({
  links: z.array(SocialLinkSchema).default([]),
})

export type Homepage = z.infer<typeof HomepageSchema>
export type Profile = z.infer<typeof ProfileSchema>
export type Project = z.infer<typeof ProjectSchema>
export type BlogPostSummary = z.infer<typeof BlogPostSummarySchema>
export type BlogPost = z.infer<typeof BlogPostSchema>
export type Social = z.infer<typeof SocialSchema>
