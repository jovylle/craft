const ALLOWED_TAGS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li', 'code', 'pre',
  'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'strong', 'em', 'img',
  'hr', 'br', 'span', 'del', 'sup', 'sub',
])

const DROP_TAGS = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button',
  'textarea', 'select', 'option', 'link', 'meta', 'noscript', 'template',
])

const VOID_TAGS = new Set(['br', 'hr', 'img'])

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href']),
  img: new Set(['src', 'alt', 'title']),
  code: new Set(['class']),
  span: new Set(['class']),
  th: new Set(['align']),
  td: new Set(['align']),
}

function parseAttrs(raw: string): Record<string, string> {
  const out: Record<string, string> = {}
  const re = /([a-zA-Z-]+)\s*=\s*("[^"]*"|'[^']*')/g
  let m: RegExpExecArray | null
  while ((m = re.exec(raw)) !== null) {
    out[m[1].toLowerCase()] = m[2].slice(1, -1)
  }
  return out
}

// Escape raw `&` only when it does not already start a valid entity (e.g. &amp;),
// so already-encoded attribute values are not double-escaped.
function escapeAttr(s: string): string {
  return s
    .replace(/&(?!(?:#\d+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);)/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Allowlist HTML sanitizer: keeps safe markdown-generated markup, drops everything else. */
export function sanitizeHtml(html: string): string {
  const tokenRe = /<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*>|[^<]+/g
  const stack: string[] = []
  let out = ''
  let match: RegExpExecArray | null

  while ((match = tokenRe.exec(html)) !== null) {
    const token = match[0]
    if (token.startsWith('<!--')) continue

    if (token.startsWith('</')) {
      const tag = token.slice(2, token.length - 1).trim().split(/\s/)[0].toLowerCase()
      if (stack.includes(tag)) {
        while (stack.length && stack[stack.length - 1] !== tag) {
          const t = stack.pop() as string
          if (!DROP_TAGS.has(t)) out += `</${t}>`
        }
        const popped = stack.pop()
        if (popped && !DROP_TAGS.has(popped)) out += `</${popped}>`
      }
      continue
    }

    if (token.startsWith('<')) {
      const m = /^<([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>$/.exec(token)
      if (!m) continue
      const tag = m[1].toLowerCase()
      if (DROP_TAGS.has(tag)) {
        stack.push(tag)
        continue
      }
      if (!ALLOWED_TAGS.has(tag)) continue
      const attrs = parseAttrs(m[2])
      if (tag === 'a' || tag === 'img') {
        const url = attrs.href ?? attrs.src ?? ''
        const safe = /^(https?:|mailto:)/i.test(url)
        // An img without a safe src is useless; drop the whole element.
        if (tag === 'img' && !safe) continue
        // An anchor with a dangerous href keeps its element but loses the href.
        if (tag === 'a' && url && !safe) delete attrs.href
      }
      const keep: string[] = []
      for (const [k, v] of Object.entries(attrs)) {
        if (ALLOWED_ATTRS[tag]?.has(k)) keep.push(`${k}="${escapeAttr(v)}"`)
      }
      out += `<${tag}${keep.length ? ' ' + keep.join(' ') : ''}>`
      if (!VOID_TAGS.has(tag)) stack.push(tag)
      continue
    }

    if (stack.length && DROP_TAGS.has(stack[stack.length - 1])) continue
    out += token
  }

  while (stack.length) {
    const t = stack.pop() as string
    if (!DROP_TAGS.has(t)) out += `</${t}>`
  }
  return out
}
