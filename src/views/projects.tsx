import type { Project } from '../data/schemas'
import type { SocialLink } from './layout'
import { Layout } from './layout'
import { ProjectCard } from '../components/cards'
import { collectTags } from '../client/project-filter'

interface ProjectsViewProps {
  projects: Project[]
  tags: string[]
  socialLinks: SocialLink[]
  baseUrl: string
  path: string
}

export function ProjectsView({ projects, tags, socialLinks, baseUrl, path }: ProjectsViewProps) {
  return (
    <Layout title="Projects" description="Everything Jovylle has built" path={path} socialLinks={socialLinks}>
      <section class="wrap" style={{ paddingTop: '3.5rem' }}>
        <div class="section-head">
          <span class="section-index">//</span>
          <h1 class="section-title">Projects</h1>
        </div>
        <p class="page-intro">
          A living archive of things built — sorted by what matters most. Filter by keyword or tech.
        </p>

        <div class="toolbar">
          <input
            class="search-box"
            type="search"
            placeholder="Search projects…"
            aria-label="Search projects"
            data-search
          />
          <div class="tag-bar" data-tags>
            {tags.map((tag) => (
              <button type="button" class="tag-btn" data-tag={tag} key={tag}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div class="grid grid--projects" data-project-grid>
          {projects.map((project) => {
            const searchable = [project.title, project.description, project.language, ...(project.tech ?? [])].join(' ').replace(/"/g, '')
            const tagList = (project.tech ?? []).join(',')
            return (
              <div data-project-card data-search={searchable} data-tags={tagList} key={project.slug}>
                <ProjectCard project={project} baseUrl={baseUrl} />
              </div>
            )
          })}
        </div>
        <p class="empty-state" data-empty hidden>
          No projects match that filter.
        </p>
      </section>
    </Layout>
  )
}
