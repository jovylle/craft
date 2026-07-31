import { Layout } from './layout'

interface NotFoundViewProps {
  path: string
  message?: string
}

export function NotFoundView({ path, message = 'The page you are looking for does not exist.' }: NotFoundViewProps) {
  return (
    <Layout title="Not found" description="404" path={path} socialLinks={[]}>
      <section class="not-found wrap">
        <h1 class="not-found-code">404</h1>
        <h2 class="not-found-title">Page not found</h2>
        <p class="not-found-desc">{message}</p>
        <a class="btn btn--primary" href="/">
          Back to home
        </a>
      </section>
    </Layout>
  )
}
