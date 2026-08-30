import { defineField, defineType } from 'sanity'

// A stop on the home page's flight journey (About, Asia, Mountains, …).
export const destination = defineType({
  name: 'destination',
  title: 'Home journey stop',
  type: 'document',
  fields: [
    defineField({ name: 'order', title: 'Order on the route', type: 'number', validation: (r) => r.required() }),
    defineField({ name: 'navLabel', title: 'Nav label', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'eyebrow', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'title', type: 'titlePair', validation: (r) => r.required() }),
    defineField({ name: 'copy', type: 'text', rows: 4, validation: (r) => r.required() }),
    defineField({ name: 'coords', title: 'Coordinates line', type: 'string' }),
    defineField({ name: 'media', type: 'mediaSlot', validation: (r) => r.required() }),
    defineField({ name: 'season', type: 'string' }),
    defineField({ name: 'highlights', type: 'array', of: [{ type: 'string' }] }),
    defineField({
      name: 'theme', type: 'string',
      options: { list: ['gold', 'white'], layout: 'radio' },
      initialValue: 'gold', validation: (r) => r.required(),
    }),
    defineField({
      name: 'layout', type: 'string',
      options: { list: ['split', 'cinematic', 'portal', 'editorial'], layout: 'radio' },
      initialValue: 'split', validation: (r) => r.required(),
    }),
    defineField({
      name: 'mapPos', title: 'Dot-map position', type: 'object',
      fields: [
        defineField({ name: 'x', type: 'number', description: '0–1 across', validation: (r) => r.required().min(0).max(1) }),
        defineField({ name: 'y', type: 'number', description: '0–1 down', validation: (r) => r.required().min(0).max(1) }),
      ],
      validation: (r) => r.required(),
    }),
    defineField({ name: 'interest', title: 'Enquiry interest label', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'gate', title: 'Boarding-pass gate code', type: 'string' }),
    defineField({ name: 'statusLabel', title: 'Header status label', type: 'string' }),
    defineField({ name: 'ctaLabel', title: 'CTA label (optional override)', type: 'string' }),
    defineField({ name: 'ctaHref', title: 'CTA link (optional override)', type: 'string' }),
  ],
  orderings: [{ title: 'Route order', name: 'routeOrder', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'navLabel', subtitle: 'eyebrow', media: 'media.poster' },
  },
})
