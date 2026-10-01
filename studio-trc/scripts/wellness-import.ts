// Wellness & Health: uploads the curated retreat media and writes the
// stays, the region, the page and the home stop. Re-runnable: uploaded
// assets are remembered in _out/assets.json, documents are replaced.
//   cd studio-trc && npx sanity exec ./scripts/wellness-import.ts --with-user-token
import { getCliClient } from 'sanity/cli'
import { createReadStream, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { basename, join } from 'node:path'

const client = getCliClient({ apiVersion: '2026-08-01' })
const ROOT = join(process.cwd(), '..', 'source-media', 'wellness')
const OUT = join(ROOT, '_out')
const content = JSON.parse(readFileSync(join(process.cwd(), '..', 'scripts', 'wellness', 'content.json'), 'utf8'))
const media = JSON.parse(readFileSync(join(OUT, 'manifest-out.json'), 'utf8'))
const assetsFile = join(OUT, 'assets.json')
const assets: Record<string, string> = existsSync(assetsFile) ? JSON.parse(readFileSync(assetsFile, 'utf8')) : {}
const scrape = (slug: string) => JSON.parse(readFileSync(join(ROOT, `${slug}.json`), 'utf8'))

// "@desc:1" → the retreat site's own paragraph, verbatim
const resolve = (slug: string, s: string): string => {
  const m = s.match(/^@(desc|phil):(\d+)$/)
  if (!m) return s
  const src = scrape(slug)[m[1] === 'desc' ? 'description' : 'philosophy']
  const v = src?.[Number(m[2])]
  if (!v) throw new Error(`${slug}: no ${m[1]} ${m[2]}`)
  return v
}

async function upload(kind: 'image' | 'file', path: string): Promise<string> {
  if (assets[path]) return assets[path]
  for (let attempt = 1; ; attempt++) {
    try {
      const doc = await client.assets.upload(kind, createReadStream(path), { filename: basename(path) })
      assets[path] = doc._id
      writeFileSync(assetsFile, JSON.stringify(assets, null, 1))
      console.log(`  ↑ ${kind} ${basename(path)}`)
      return doc._id
    } catch (e) {
      if (attempt >= 4) throw e
      console.log(`  retry ${attempt} for ${basename(path)}: ${(e as Error).message}`)
      await new Promise((r) => setTimeout(r, 2000 * attempt))
    }
  }
}

const ref = (id: string) => ({ _type: 'reference', _ref: id })
async function slot(m: { poster: string; film?: string; film720?: string }) {
  const out: Record<string, unknown> = { _type: 'mediaSlot', poster: { _type: 'image', asset: ref(await upload('image', m.poster)) } }
  if (m.film) out.film = { _type: 'file', asset: ref(await upload('file', m.film)) }
  if (m.film720) out.film720 = { _type: 'file', asset: ref(await upload('file', m.film720)) }
  return out
}
const key = (k: string) => k.replace(/[^a-z0-9]/gi, '').slice(0, 24)

async function main() {
  const stayIds: Record<string, string> = {}
  // ---- the eight stays ----
  for (const slug of content.order as string[]) {
    const c = content.stays[slug]
    const m = media[slug]
    if (!m) throw new Error(`no encoded media for ${slug}`)
    console.log(`stay ${slug}`)
    const id = `stay-wellness-${slug}`
    stayIds[slug] = id
    const gallery = []
    for (const [i, g] of (m.gallery as Array<{ poster: string; film?: string; film720?: string }>).entries()) {
      gallery.push({ _key: `g${i + 1}`, ...(await slot(g)) })
    }
    await client.createOrReplace({
      _id: id,
      _type: 'stay',
      name: c.name,
      location: c.location,
      ...(c.coordinates ? { coordinates: c.coordinates } : {}),
      description: (c.description as string[]).map((p) => resolve(slug, p)).join('\n\n'),
      highlights: c.highlights,
      facts: (c.facts as Array<[string, string]>).map(([label, value], i) => ({ _key: `f${i + 1}`, _type: 'fact', label, value })),
      media: await slot(m.lead),
      gallery,
    })
  }

  // ---- the hero montage ----
  console.log('hero')
  const hero = await slot(media['wellness-hero'].lead)
  const d = content.destination
  const stopCopy = d.copy

  // ---- the region: one stop, one group of retreats ----
  await client.createOrReplace({
    _id: 'region-wellness',
    _type: 'region',
    slug: { _type: 'slug', current: 'wellness' },
    title: 'Wellness & Health',
    intro: stopCopy,
    focus: { cx: 0.55, cy: 0.36, zoom: 1.6 },
    stops: [{
      _key: 'wellness', _type: 'regionStop',
      country: 'Wellness', eyebrow: d.eyebrow,
      title: { _type: 'titlePair', line1: d.title[0], line2: d.title[1] },
      copy: stopCopy, coords: d.coords, media: hero, season: d.season, highlights: d.highlights,
      mapPos: d.mapPos, theme: 'white',
    }],
    catalog: [{
      _key: 'wellness', _type: 'catalogGroup', id: 'wellness', label: 'Wellness',
      entries: (content.order as string[]).map((slug) => ({ _key: key(slug), _type: 'reference', _ref: stayIds[slug] })),
    }],
  })

  // ---- the page ----
  const p = content.page
  await client.createOrReplace({
    _id: 'countryPage-wellness',
    _type: 'countryPage',
    country: p.country,
    slug: { _type: 'slug', current: 'wellness' },
    tagline: p.tagline, priceLine: p.priceLine, season: p.season, coords: p.coords,
    heroMedia: hero,
    chapters: await Promise.all((p.chapters as Array<Record<string, unknown>>).map(async (ch, i) => ({
      _key: `ch${i + 1}`, _type: 'chapter',
      navLabel: ch.navLabel, eyebrow: ch.eyebrow,
      title: { _type: 'titlePair', line1: (ch.title as string[])[0], line2: (ch.title as string[])[1] },
      paragraphs: ch.paragraphs, light: ch.light === true,
      media: await slot(media[ch.media as string].lead),
    }))),
    quote: p.quote,
    days: await Promise.all((p.days as Array<{ stay: string; copy: string; details: string[] }>).map(async (day, i) => ({
      _key: `d${i + 1}`, _type: 'day',
      title: content.stays[day.stay].name,
      copy: resolve(day.stay, day.copy),
      details: day.details,
      media: await slot(media[day.stay].lead),
    }))),
    essentials: (p.essentials as Array<{ title: string; copy: string; points: Array<[string, string]> }>).map((e, i) => ({
      _key: `e${i + 1}`, _type: 'essentialCard', title: e.title, copy: e.copy,
      points: e.points.map(([label, value], j) => ({ _key: `p${i + 1}${j + 1}`, _type: 'fact', label, value })),
    })),
  })

  // ---- the home stop, second on the route ----
  const others = await client.fetch<Array<{ _id: string; order: number }>>(`*[_type=="destination" && _id != "destination-wellness"]|order(order asc){_id, order}`)
  const tx = client.transaction()
  let n = 1
  for (const o of others) {
    tx.patch(o._id, { set: { order: n } })
    n++
    if (o._id === 'destination-about') n++ // leave 2 for wellness
  }
  tx.createOrReplace({
    _id: 'destination-wellness',
    _type: 'destination',
    order: 2,
    navLabel: d.navLabel, eyebrow: d.eyebrow,
    title: { _type: 'titlePair', line1: d.title[0], line2: d.title[1] },
    copy: d.copy, coords: d.coords, media: hero, season: d.season, highlights: d.highlights,
    theme: 'white', layout: 'sanctuary', mapPos: d.mapPos,
    interest: d.interest, gate: d.gate, statusLabel: d.statusLabel, ctaLabel: d.ctaLabel, ctaHref: d.ctaHref,
  })
  await tx.commit()
  console.log('done')
}

main().catch((e) => { console.error(e); process.exit(1) })
