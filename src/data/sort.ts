import type { BlogPostSummary } from './schemas'

export function isRealPost(p: BlogPostSummary): boolean {
  return Boolean(p.title && p.slug && p.title !== 'blog-post')
}

export function sortPosts(posts: BlogPostSummary[]): BlogPostSummary[] {
  return [...posts]
    .filter(isRealPost)
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1
      return (b.date || '').localeCompare(a.date || '')
    })
}
