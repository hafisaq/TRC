// Stage the wellness wording as DRAFTS (the sites read published content
// only, so nothing changes until `publish`):
//   npx sanity exec ./scripts/wellness-hold.ts --with-user-token            → write drafts
//   npx sanity exec ./scripts/wellness-hold.ts --with-user-token -- publish → publish them
import { getCliClient } from 'sanity/cli'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

const client = getCliClient({ apiVersion: '2026-08-01' })
const content = JSON.parse(readFileSync(join(process.cwd(), '..', 'scripts', 'wellness', 'content.json'), 'utf8'))
const ar = JSON.parse(readFileSync(join(process.cwd(), '..', 'scripts', 'wellness', 'ar.json'), 'utf8'))
const k = (path: string) => 's' + createHash('sha1').update(path).digest('hex').slice(0, 12)
const strings = (obj: Record<string, string>) => Object.entries(obj).map(([path, value]) => ({ _key: k(path), _type: 'object', path, value }))
const IDS = ['destination-wellness', 'region-wellness', 'countryPage-wellness', 'ar--destination-wellness', 'ar--region-wellness', 'ar--countryPage-wellness']

async function hold() {
  const d = content.destination, p = content.page
  const docs = await client.getDocuments(IDS)
  const tx = client.transaction()
  const draft = (doc: Record<string, unknown>, set: Record<string, unknown>) => tx.createOrReplace({ ...doc, ...set, _id: `drafts.${doc._id}` })
  const [dest, region, page, arDest, arRegion, arPage] = docs as Array<Record<string, unknown>>
  draft(dest, { coords: d.coords, highlights: d.highlights })
  const stops = (region.stops as Array<Record<string, unknown>>).map((s) => s._key === 'wellness' ? { ...s, coords: d.coords, highlights: d.highlights } : s)
  draft(region, { stops })
  draft(page, { tagline: p.tagline })
  draft(arDest, { strings: strings(ar['destination-wellness']) })
  draft(arRegion, { strings: strings(ar['region-wellness']) })
  draft(arPage, { strings: strings(ar['countryPage-wellness']) })
  await tx.commit()
  console.log('drafts written for', IDS.length, 'documents — nothing published')
}
async function publish() {
  const drafts = await client.getDocuments(IDS.map((id) => `drafts.${id}`))
  const tx = client.transaction()
  for (const doc of drafts as Array<Record<string, unknown> | null>) {
    if (!doc) continue
    const id = (doc._id as string).replace(/^drafts\./, '')
    tx.createOrReplace({ ...doc, _id: id })
    tx.delete(doc._id as string)
  }
  await tx.commit()
  console.log('published', drafts.filter(Boolean).length, 'drafts')
}
;(process.argv.includes('publish') ? publish() : hold()).catch((e) => { console.error(e); process.exit(1) })
