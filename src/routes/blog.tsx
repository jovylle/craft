import { Hono } from 'hono'
import type { DataClient } from '../data/client'
import { sortPosts } from '../data/sort'
import { BlogView } from '../views/blog'

export function blogRoutes(data: DataClient, baseUrl: string): Hono {
  const app = new Hono()

  app.get('/blog', async (c) => {
    const [blogIndex, social] = await Promise.all([data.getBlogIndex(), data.getSocial()])
    const posts = sortPosts(blogIndex)
    return c.html(<BlogView posts={posts} socialLinks={social.links} path="/blog" />)
  })

  return app
}
