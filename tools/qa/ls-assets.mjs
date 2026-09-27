import { api } from './api.mjs'
const brands = await api('/api/brands')
for (const b of brands) {
  const all = await api(`/api/assets?brandId=${b.id}`)
  let feed = [], next = null
  do { const p = await api(`/api/assets/feed?brandId=${b.id}${next ? `&before=${next}` : ''}`); feed.push(...p.items); next = p.next } while (next)
  console.log('==', b.id, b.name, 'assets', all.length, 'feed', feed.length)
  for (const a of all) console.log('A', a.id, a.kind, JSON.stringify(a.filename), a.ref_use ?? '', a.url.split('/').pop())
  for (const a of feed) console.log('F', a.id, a.generated_source, JSON.stringify(a.filename), a.in_library ? 'lib' : '', a.url.split('/').pop())
}
process.exit(0)
