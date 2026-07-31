/* Craft — projects filter. Mirrors src/client/project-filter.ts semantics. */
(function () {
  const grid = document.querySelector('[data-project-grid]')
  const input = document.querySelector('[data-search]')
  const tagBar = document.querySelector('[data-tags]')
  const empty = document.querySelector('[data-empty]')
  if (!grid || !input) return

  const cards = Array.from(grid.querySelectorAll('[data-project-card]'))

  function matches(card) {
    const activeTag = tagBar ? tagBar.dataset.active || '' : ''
    const query = (input.value || '').trim().toLowerCase()
    const tags = (card.dataset.tags || '').split(',')
    if (activeTag && !tags.includes(activeTag)) return false
    if (!query) return true
    return (card.dataset.search || '').toLowerCase().includes(query)
  }

  function render() {
    let visible = 0
    for (const card of cards) {
      const show = matches(card)
      card.hidden = !show
      if (show) visible++
    }
    if (empty) empty.hidden = visible !== 0
  }

  input.addEventListener('input', render)

  if (tagBar) {
    tagBar.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-tag]')
      if (!btn) return
      const tag = btn.dataset.tag
      const next = tagBar.dataset.active === tag ? '' : tag
      tagBar.dataset.active = next
      for (const b of tagBar.querySelectorAll('[data-tag]')) {
        b.classList.toggle('active', b.dataset.tag === next)
      }
      render()
    })
  }

  render()
})()
