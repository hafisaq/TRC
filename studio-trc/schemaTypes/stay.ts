import { defineField, defineType } from 'sanity'

// One property/stay — everything the dossier, stays rail, and gallery use.
export const stay = defineType({
  name: 'stay',
  title: 'Stay',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'location', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'media', title: 'Lead media', type: 'mediaSlot', validation: (r) => r.required() }),
    defineField({ name: 'description', type: 'text', rows: 4 }),
    defineField({ name: 'coordinates', type: 'string' }),
    defineField({ name: 'season', type: 'string' }),
    defineField({ name: 'highlights', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'facts', type: 'array', of: [{ type: 'fact' }] }),
    defineField({ name: 'gallery', type: 'array', of: [{ type: 'mediaSlot' }] }),
    defineField({
      name: 'assets', title: 'Brochures & downloads', type: 'array',
      description: 'Entries with a file render as downloads on the stay dossier; entries without one are not shown.',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
          defineField({
            name: 'category', type: 'string',
            options: { list: ['Brochures', 'Fact Sheets', 'Images', 'Presentations', 'Newsletter', 'Rates & Offers', 'Videos'] },
            validation: (r) => r.required(),
          }),
          defineField({ name: 'file', title: 'Downloadable file (PDF)', type: 'file', options: { accept: 'application/pdf' } }),
        ],
        preview: { select: { title: 'title', subtitle: 'category' } },
      }],
    }),
  ],
  preview: { select: { title: 'name', subtitle: 'location', media: 'media.poster' } },
})
