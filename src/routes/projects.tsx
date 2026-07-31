import { Hono } from 'hono'
import type { DataClient } from '../data/client'
import { ProjectsView } from '../views/projects'
import { collectTags } from '../client/project-filter'

export function projectsRoutes(data: DataClient, baseUrl: string): Hono {
  const app = new Hono()

  app.get('/projects', async (c) => {
    const [projects, social] = await Promise.all([data.getProjects(), data.getSocial()])
    const sorted = [...projects].sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0))
    return c.html(
      <ProjectsView
        projects={sorted}
        tags={collectTags(sorted)}
        socialLinks={social.links}
        baseUrl={baseUrl}
        path="/projects"
      />,
    )
  })

  return app
}
