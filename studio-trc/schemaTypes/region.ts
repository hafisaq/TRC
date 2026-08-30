import { defineField, defineType } from 'sanity'

// A region page (/asia): its journey stops and the country-grouped catalog.
export const region = defineType({
  name: 'region',
  title: 'Region',
  type: 'document',
  fields: [
    defineField({ name: 'slug', type: 'slug', validation: (r) => r.required() }),
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'intro', type: 'text', rows: 3 }),
    defineField({
      name: 'focus', title: 'Dot-map focus', type: 'object',
      fields: [
        defineField({ name: 'cx', type: 'number', validation: (r) => r.required().min(0).max(1) }),
        defineField({ name: 'cy', type: 'number', validation: (r) => r.required().min(0).max(1) }),
        defineField({ name: 'zoom', type: 'number', validation: (r) => r.required() }),
      ],
    }),
    defineField({
      name: 'stops', title: 'Country stops (the journey)', type: 'array',
      of: [{
        type: 'object',
        name: 'regionStop',
        fields: [
          defineField({ name: 'country', type: 'string', validation: (r) => r.required() }),
          defineField({ name: 'eyebrow', type: 'string', validation: (r) => r.required() }),
          defineField({ name: 'title', type: 'titlePair', validation: (r) => r.required() }),
          defineField({ name: 'copy', type: 'text', rows: 3, validation: (r) => r.required() }),
          defineField({ name: 'coords', type: 'string' }),
          defineField({ name: 'media', type: 'mediaSlot', validation: (r) => r.required() }),
          defineField({ name: 'season', type: 'string' }),
          defineField({ name: 'highlights', type: 'array', of: [{ type: 'string' }] }),
          defineField({
            name: 'mapPos', type: 'object',
            fields: [
              defineField({ name: 'x', type: 'number', validation: (r) => r.required().min(0).max(1) }),
              defineField({ name: 'y', type: 'number', validation: (r) => r.required().min(0).max(1) }),
            ],
            validation: (r) => r.required(),
          }),
          defineField({
            name: 'theme', type: 'string',
            options: { list: ['gold', 'white'], layout: 'radio' }, initialValue: 'gold',
          }),
        ],
        preview: { select: { title: 'country', subtitle: 'eyebrow', media: 'media.poster' } },
      }],
    }),
    defineField({
      name: 'catalog', title: 'Catalog (stays grouped by country)', type: 'array',
      of: [{
        type: 'object',
        name: 'catalogGroup',
        fields: [
          defineField({ name: 'id', title: 'Group id (URL slug, e.g. maldives)', type: 'string', validation: (r) => r.required() }),
          defineField({ name: 'label', title: 'Country label', type: 'string', validation: (r) => r.required() }),
          defineField({ name: 'entries', type: 'array', of: [{ type: 'reference', to: [{ type: 'stay' }] }] }),
        ],
        preview: { select: { title: 'label', subtitle: 'id' } },
      }],
    }),
  ],
  preview: { select: { title: 'title', subtitle: 'slug.current' } },
})
