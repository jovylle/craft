import type { Project } from '../data/schemas'
import type { SocialLink } from './layout'
import { absoluteUrl } from '../data/client'
import { formatDate } from '../lib/dates'
import { Layout } from './layout'

interface ProjectDetailViewProps {
  project: Project
  socialLinks: SocialLink[]
  baseUrl: string
  path: string
}

export function ProjectDetailView({ project, socialLinks, baseUrl, path }: ProjectDetailViewProps) {
  const thumb = project.thumbnail ? absoluteUrl(project.thumbnail, baseUrl) : ''

  return (
    <Layout title={project.title} description={project.description} path={path} socialLinks={socialLinks}>
      <article class="wrap">
        <div class="detail-hero">
          <a class="back-link" href="/projects">← all projects</a>
          <h1 class="detail-title">{project.title}</h1>
          {project.description && <p class="detail-desc">{project.description}</p>}

          {(project.links.length > 0 || project.repo) && (
            <div class="link-row">
              {project.links.map((link) => (
                <a class="btn btn--ghost" href={link.url} rel="noopener noreferrer" key={link.label}>
                  {link.label}
                </a>
              ))}
              {project.repo && (
                <a class="btn btn--ghost" href={project.repo} rel="noopener noreferrer">
                  Repo
                </a>
              )}
            </div>
          )}

          <div class="detail-meta">
            {(project.created_at || project.updated_at) && (
              <div class="meta-item">
                <span class="meta-label">updated</span>
                <span class="meta-value">{formatDate(project.updated_at || project.created_at || '')}</span>
              </div>
            )}
            {project.language && (
              <div class="meta-item">
                <span class="meta-label">stack</span>
                <span class="meta-value">{project.language}</span>
              </div>
            )}
            {project.fav && (
              <div class="meta-item">
                <span class="meta-label">status</span>
                <span class="meta-value">★ favorite</span>
              </div>
            )}
          </div>

          <div class="chip-row">
            {project.tech.map((t) => (
              <span class="chip" key={t}>{t}</span>
            ))}
          </div>
        </div>

        {thumb && <img class="detail-thumb" src={thumb} alt={project.title} />}
      </article>
    </Layout>
  )
}
