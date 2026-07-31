import type { Project } from '../data/schemas'

export interface FilterState {
  query: string
  tag: string
}

export function applyFilter(projects: Project[], state: FilterState): Project[] {
  const q = state.query.trim().toLowerCase()
  return projects.filter((p) => {
    if (state.tag && !(p.tech ?? []).includes(state.tag)) return false
    if (!q) return true
    const haystack = [p.title, p.description, p.language, ...(p.tech ?? [])].join(' ').toLowerCase()
    return haystack.includes(q)
  })
}

export function collectTags(projects: Project[], limit = 24): string[] {
  const counts = new Map<string, number>()
  for (const p of projects) {
    for (const t of p.tech ?? []) counts.set(t, (counts.get(t) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag)
}
