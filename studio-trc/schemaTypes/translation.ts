import { defineField, defineType } from 'sanity'

// One document per translated source doc (plus `ar--ui` for fixed chrome).
// Written wholesale by scripts/i18n/import_ar.py from the copywriter's
// workbook; editable here for one-off fixes.
export const translation = defineType({
  name: 'translation',
  title: 'Translation',
  type: 'document',
  fields: [
    defineField({ name: 'lang', type: 'string', options: { list: ['ar'] }, validation: (r) => r.required() }),
    defineField({ name: 'source', type: 'string', description: 'The _id of the document these strings translate (or "ui")' }),
    defineField({
      name: 'strings', type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'path', type: 'string' }),
          defineField({ name: 'value', type: 'string' }),
        ],
        preview: { select: { title: 'value', subtitle: 'path' } },
      }],
    }),
  ],
  preview: { select: { title: 'source', subtitle: 'lang' } },
})
