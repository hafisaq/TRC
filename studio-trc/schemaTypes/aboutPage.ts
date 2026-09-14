import { defineField, defineType } from 'sanity'

// Singleton (_id: aboutPage) — the /about page. Every word here is the
// client's own; the site renders it verbatim.
export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About page',
  type: 'document',
  fields: [
    defineField({ name: 'tagline', title: 'Tagline (two lines)', type: 'titlePair', validation: (r) => r.required() }),
    defineField({ name: 'intro', title: 'Opening paragraphs', type: 'array', of: [{ type: 'text', rows: 3 }], validation: (r) => r.required().min(1) }),
    defineField({
      name: 'sections', title: 'Sections', type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'title', title: 'Heading', type: 'string', validation: (r) => r.required() }),
          defineField({ name: 'paragraphs', title: 'Paragraphs', type: 'array', of: [{ type: 'text', rows: 3 }], description: 'A line break inside one paragraph is kept as a line break (for short stanza lines).' }),
          defineField({ name: 'media', title: 'Chapter image / short film', type: 'mediaSlot', description: 'Optional. A poster and short preview clip for this part of the story. Leave empty to use the existing preview footage.' }),
        ],
        preview: { select: { title: 'title' } },
      }],
    }),
    defineField({ name: 'closing', title: 'Closing lines', type: 'array', of: [{ type: 'text', rows: 2 }] }),
  ],
  preview: { prepare: () => ({ title: 'About page' }) },
})
