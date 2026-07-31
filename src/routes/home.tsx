import { Hono } from 'hono'
import type { DataClient } from '../data/client'
import { sortPosts } from '../data/sort'
import { HomeView } from '../views/home'

export function homeRoutes(data: DataClient, baseUrl: string): Hono {
  const app = new Hono()

  app.get('/', async (c) => {
    const [homepage, profile, projects, blogIndex, social] = await Promise.all([
      data.getHomepage(),
      data.getProfile(),
      data.getProjects().catch(() => []), // graceful: homepage renders with an empty grid when the vault is down
      data.getBlogIndex(),
      data.getSocial(),
    ])

    const sorted = [...projects].sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0))
    const withThumbs = sorted.filter((p) => p.thumbnail)
    const featured = (withThumbs.length >= 3 ? withThumbs : sorted).slice(0, 6)

    const recent = sortPosts(blogIndex).slice(0, 3)

    return c.html(
      <HomeView
        homepage={homepage}
        profile={profile}
        featuredProjects={featured}
        recentPosts={recent}
        social={social}
        baseUrl={baseUrl}
        path="/"
      />,
    )
  })

  return app
}
