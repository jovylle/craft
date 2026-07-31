import type { Project, BlogPostSummary } from '../data/schemas'
import { absoluteUrl } from '../data/client'
import { formatDate } from '../lib/dates'

interface ProjectCardProps {
  project: Project
  baseUrl: string
}

export function ProjectCard({ project, baseUrl }: ProjectCardProps) {
  const thumb = project.thumbnail ? absoluteUrl(project.thumbnail, baseUrl) : ''
  return (
    <a class="card project-card" href={`/projects/${project.slug}`} data-project-card data-slug={project.slug}>
      {thumb ? (
        <div class="card-thumb-wrap">
          <img class="card-thumb" src={thumb} alt={project.title} loading="lazy" />
        </div>
      ) : (
        <div class="card-thumb--empty" aria-hidden="true">
          <span>{project.language || 'craft'}</span>
        </div>
      )}
      <div class="card-body">
        <h3 class="card-title">{project.title}</h3>
        <p class="card-desc">{project.description}</p>
        <div class="chip-row">
          {project.tech.slice(0, 4).map((t) => (
            <span class="chip" key={t}>{t}</span>
          ))}
        </div>
      </div>
    </a>
  )
}

interface PostCardProps {
  post: BlogPostSummary
}

export function PostCard({ post }: PostCardProps) {
  return (
    <a class="card post-card" href={`/blog/${post.slug}`}>
      <div class="post-meta">
        {post.featured && <span class="tag--featured">featured</span>}
        <time class="post-date" datetime={post.date}>{formatDate(post.date)}</time>
      </div>
      <div class="card-body">
        <h3 class="card-title">{post.title}</h3>
        {post.excerpt && <p class="card-desc">{post.excerpt}</p>}
        <div class="chip-row">
          {post.tags.slice(0, 4).map((t) => (
            <span class="chip" key={t}>{t}</span>
          ))}
        </div>
      </div>
    </a>
  )
}
