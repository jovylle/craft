import { marked } from 'marked'
import { sanitizeHtml } from './sanitize'

export async function renderMarkdown(markdown: string): Promise<string> {
  const raw = await marked.parse(markdown, { gfm: true, breaks: true })
  return sanitizeHtml(raw)
}
