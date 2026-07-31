import type { BlogPost } from '../data/schemas'
import type { SocialLink } from './layout'
import { Layout } from './layout'
import { formatDate } from '../lib/dates'

interface PostViewProps {
  post: BlogPost
  bodyHtml: string
  socialLinks: SocialLink[]
  path: string
}

export function PostView({ post, bodyHtml, socialLinks, path }: PostViewProps) {
  return (
    <Layout title={post.title} description={post.excerpt} path={path} socialLinks={socialLinks}>
      <article class="article wrap">
        <header class="article-header">
          <a class="back-link" href="/blog">← all posts</a>
          <h1 class="article-title">{post.title}</h1>
          <div class="article-meta">
            {post.author && <span>{post.author}</span>}
            {post.date && <time datetime={post.date}>{formatDate(post.date)}</time>}
            {post.featured && <span class="tag--featured">featured</span>}
          </div>
          <div class="chip-row" style={{ marginTop: '1rem' }}>
            {post.tags.map((t) => (
              <span class="chip" key={t}>{t}</span>
            ))}
          </div>
        </header>
        {/* rendered markdown is sanitized by renderMarkdown */}
        <div class="article-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      </article>
    </Layout>
  )
}
