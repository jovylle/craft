import { Hono } from 'hono'
import type { DataClient } from './data/client'
import { homeRoutes } from './routes/home'
import { projectsRoutes } from './routes/projects'
import { projectDetailRoutes } from './routes/project-detail'
import { blogRoutes } from './routes/blog'
import { postRoutes } from './routes/post'
import { NotFoundView } from './views/not-found'

export interface AppDeps {
  data: DataClient
  baseUrl?: string
}

export function createApp({ data, baseUrl = 'https://content.jovylle.com' }: AppDeps): Hono {
  const app = new Hono()

  app.route('/', homeRoutes(data, baseUrl))
  app.route('/', projectsRoutes(data, baseUrl))
  app.route('/', projectDetailRoutes(data, baseUrl))
  app.route('/', blogRoutes(data, baseUrl))
  app.route('/', postRoutes(data, baseUrl))

  app.notFound((c) => c.html(<NotFoundView path={new URL(c.req.url).pathname} />, 404))

  app.onError((err, c) => {
    console.error('craft error:', err)
    return c.html(
      <NotFoundView path={new URL(c.req.url).pathname} message="Something went wrong — try again shortly." />,
      500,
    )
  })

  return app
}
