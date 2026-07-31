import type { BlogPostSummary } from '../data/schemas'
import type { SocialLink } from './layout'
import { Layout } from './layout'
import { PostCard } from '../components/cards'

interface BlogViewProps {
  posts: BlogPostSummary[]
  socialLinks: SocialLink[]
  path: string
}

export function BlogView({ posts, socialLinks, path }: BlogViewProps) {
  return (
    <Layout title="Blog" description="Writing about building, AI, and side projects" path={path} socialLinks={socialLinks}>
      <section class="wrap" style={{ paddingTop: '3.5rem' }}>
        <div class="section-head">
          <span class="section-index">//</span>
          <h1 class="section-title">Blog</h1>
        </div>
        <p class="page-intro">Notes on building things, AI workflows, and whatever else sticks.</p>
        <div class="grid grid--posts">
          {posts.map((post) => (
            <PostCard post={post} key={post.slug} />
          ))}
        </div>
      </section>
    </Layout>
  )
}
