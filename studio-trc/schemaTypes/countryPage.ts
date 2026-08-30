import { defineField, defineType } from 'sanity'

// A country's own page (/asia/maldives): hero, chapters, quote, day-by-day
// journey, and the essentials deck.
export const countryPage = defineType({
  name: 'countryPage',
  title: 'Country page',
  type: 'document',
  fields: [
    defineField({ name: 'country', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug', type: 'slug',
      description: 'Must match the catalog group id in the region (e.g. maldives)',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'tagline', type: 'text', rows: 2, validation: (r) => r.required() }),
    defineField({ name: 'priceLine', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'season', type: 'string' }),
    defineField({ name: 'coords', type: 'string' }),
    defineField({ name: 'heroMedia', title: 'Hero film', type: 'mediaSlot', validation: (r) => r.required() }),
    defineField({
      name: 'chapters', type: 'array',
      of: [{
        type: 'object',
        name: 'chapter',
        fields: [
          defineField({ name: 'navLabel', type: 'string', validation: (r) => r.required() }),
          defineField({ name: 'eyebrow', type: 'string', validation: (r) => r.required() }),
          defineField({ name: 'title', type: 'titlePair', validation: (r) => r.required() }),
          defineField({ name: 'paragraphs', type: 'array', of: [{ type: 'text' }], validation: (r) => r.required() }),
          defineField({ name: 'media', type: 'mediaSlot', validation: (r) => r.required() }),
          defineField({
            name: 'light', title: 'Light (cream) chapter', type: 'boolean', initialValue: false,
            description: 'Light chapters are editorial split layouts; dark ones open film full-bleed.',
          }),
        ],
        preview: { select: { title: 'navLabel', subtitle: 'eyebrow', media: 'media.poster' } },
      }],
    }),
    defineField({
      name: 'quote', type: 'object',
      fields: [
        defineField({ name: 'text', type: 'text', rows: 2, validation: (r) => r.required() }),
        defineField({ name: 'attribution', type: 'string', validation: (r) => r.required() }),
      ],
    }),
    defineField({
      name: 'days', title: 'Day-by-day journey', type: 'array',
      of: [{
        type: 'object',
        name: 'day',
        fields: [
          defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
          defineField({ name: 'copy', type: 'text', rows: 3, validation: (r) => r.required() }),
          defineField({ name: 'media', type: 'mediaSlot', validation: (r) => r.required() }),
          defineField({ name: 'details', title: 'Detail chips', type: 'array', of: [{ type: 'string' }] }),
        ],
        preview: { select: { title: 'title', media: 'media.poster' } },
      }],
    }),
    defineField({
      name: 'essentials', title: 'The essentials deck', type: 'array',
      of: [{
        type: 'object',
        name: 'essentialCard',
        fields: [
          defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
          defineField({ name: 'copy', type: 'text', rows: 3, validation: (r) => r.required() }),
          defineField({ name: 'points', type: 'array', of: [{ type: 'fact' }] }),
        ],
        preview: { select: { title: 'title' } },
      }],
    }),
  ],
  preview: { select: { title: 'country', subtitle: 'slug.current', media: 'heroMedia.poster' } },
})
