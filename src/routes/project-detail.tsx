import { Hono } from 'hono'
import type { DataClient } from '../data/client'
import { ProjectDetailView } from '../views/project-detail'
import { NotFoundView } from '../views/not-found'

export function projectDetailRoutes(data: DataClient, baseUrl: string): Hono {
  const app = new Hono()

  app.get('/projects/:slug', async (c) => {
    const slug = c.req.param('slug')
    const [project, social] = await Promise.all([data.getProject(slug), data.getSocial()])
    if (!project) return c.html(<NotFoundView path={c.req.path} />, 404)
    return c.html(
      <ProjectDetailView project={project} socialLinks={social.links} baseUrl={baseUrl} path={c.req.path} />,
    )
  })

  return app
}
