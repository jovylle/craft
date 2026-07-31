import type { Homepage, Profile, Project, BlogPostSummary, Social } from '../data/schemas'
import { Layout } from './layout'
import { ProjectCard, PostCard } from '../components/cards'

interface HomeViewProps {
  homepage: Homepage
  profile: Profile
  featuredProjects: Project[]
  recentPosts: BlogPostSummary[]
  social: Social
  baseUrl: string
  path: string
}

const HERO_CTAS = [
  { href: '/projects', label: 'View projects', variant: 'primary' },
  { href: '/blog', label: 'Read the blog', variant: 'ghost' },
  { href: 'https://github.com/jovylle', label: 'GitHub', variant: 'ghost', external: true },
]

export function HomeView({ homepage, profile, featuredProjects, recentPosts, social, baseUrl, path }: HomeViewProps) {
  const { hero } = homepage
  const words = hero.title.split(' ')

  const marqueeItems = [
    ...featuredProjects.flatMap((p) => p.tech),
    'TypeScript', 'Hono', 'Cloudflare Workers', 'Vue', 'Nuxt', 'FastAPI', 'Go',
  ].slice(0, 14)
  const marqueeRow = [...marqueeItems, ...marqueeItems] // duplicated for seamless loop

  return (
    <Layout title="Home" description={hero.description} path={path} socialLinks={social.links}>
      <section class="hero wrap">
        {profile.availability && (
          <p class="hero-kicker">
            <span class="status-dot" aria-hidden="true" />
            {profile.availability}
          </p>
        )}
        <h1 class="hero-title">
          {words.map((word, i) => (
            <span class={i % 2 === 0 ? 'outline' : 'accent'} key={`${word}-${i}`}>
              {word}{' '}
            </span>
          ))}
        </h1>
        {hero.tagline && <p class="hero-tagline">{hero.tagline}</p>}
        {hero.description && <p class="hero-desc">{hero.description}</p>}
        <div class="hero-ctas">
          {HERO_CTAS.map((cta) => (
            <a
              class={cta.variant === 'primary' ? 'btn btn--primary' : 'btn btn--ghost'}
              href={cta.href}
              key={cta.href}
              {...(cta.external ? { rel: 'noopener noreferrer', target: '_blank' } : {})}
            >
              {cta.label}
            </a>
          ))}
        </div>
      </section>

      <div class="marquee" aria-hidden="true">
        <div class="marquee-track">
          {marqueeRow.map((item, i) => (
            <span key={`${item}-${i}`}>{item}</span>
          ))}
        </div>
      </div>

      <section class="section wrap">
        <div class="section-head">
          <span class="section-index">01</span>
          <h2 class="section-title">Featured work</h2>
          <a class="section-link" href="/projects">all projects →</a>
        </div>
        <div class="grid grid--projects">
          {featuredProjects.map((project) => (
            <ProjectCard project={project} baseUrl={baseUrl} key={project.slug} />
          ))}
        </div>
      </section>

      <section class="section wrap">
        <div class="section-head">
          <span class="section-index">02</span>
          <h2 class="section-title">Latest writing</h2>
          <a class="section-link" href="/blog">all posts →</a>
        </div>
        <div class="grid grid--posts">
          {recentPosts.map((post) => (
            <PostCard post={post} key={post.slug} />
          ))}
        </div>
      </section>
    </Layout>
  )
}
