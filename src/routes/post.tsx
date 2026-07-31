import { Hono } from 'hono'
import type { DataClient } from '../data/client'
import { PostView } from '../views/post'
import { NotFoundView } from '../views/not-found'
import { renderMarkdown } from '../lib/markdown'

export function postRoutes(data: DataClient, baseUrl: string): Hono {
  const app = new Hono()

  app.get('/blog/:slug', async (c) => {
    const slug = c.req.param('slug')
    const [post, social] = await Promise.all([data.getPost(slug), data.getSocial()])
    if (!post) return c.html(<NotFoundView path={c.req.path} />, 404)
    const bodyHtml = await renderMarkdown(post.content)
    return c.html(
      <PostView post={post} bodyHtml={bodyHtml} socialLinks={social.links} path={c.req.path} />,
    )
  })

  return app
}
