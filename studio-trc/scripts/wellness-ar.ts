// Arabic for the wellness route: one translation document per source doc,
// plus the new UI strings merged into ar--ui.
//   cd studio-trc && npx sanity exec ./scripts/wellness-ar.ts --with-user-token
import { getCliClient } from 'sanity/cli'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

const client = getCliClient({ apiVersion: '2026-08-01' })
const ar = JSON.parse(readFileSync(join(process.cwd(), '..', 'scripts', 'wellness', 'ar.json'), 'utf8'))
const content = JSON.parse(readFileSync(join(process.cwd(), '..', 'scripts', 'wellness', 'content.json'), 'utf8'))
const k = (path: string) => 's' + createHash('sha1').update(path).digest('hex').slice(0, 12)
const strings = (obj: Record<string, string>) => Object.entries(obj).map(([path, value]) => ({ _key: k(path), _type: 'object', path, value }))

async function main() {
  const tx = client.transaction()
  const doc = (source: string, obj: Record<string, string>) =>
    tx.createOrReplace({ _id: `ar--${source}`, _type: 'translation', lang: 'ar', source, strings: strings(obj) })
  doc('destination-wellness', ar['destination-wellness'])
  doc('region-wellness', ar['region-wellness'])
  doc('countryPage-wellness', ar['countryPage-wellness'])
  for (const slug of content.order as string[]) doc(`stay-wellness-${slug}`, ar.stays[slug])

  // ui: add or replace the wellness keys, keep everything else
  const ui = await client.fetch<{ strings: Array<{ _key: string; path: string; value: string }> }>(`*[_id=="ar--ui"][0]{strings}`)
  const kept = (ui?.strings ?? []).filter((s) => !(s.path in ar.ui))
  tx.patch('ar--ui', { set: { strings: [...kept, ...strings(ar.ui)] } })
  await tx.commit()
  console.log('arabic written for', 3 + (content.order as string[]).length, 'documents +', Object.keys(ar.ui).length, 'ui strings')
}
main().catch((e) => { console.error(e); process.exit(1) })
