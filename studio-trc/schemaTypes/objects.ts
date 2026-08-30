import { defineField, defineType } from 'sanity'

// A two-line display title (the site sets headings as two stacked lines).
export const titlePair = defineType({
  name: 'titlePair',
  title: 'Two-line title',
  type: 'object',
  fields: [
    defineField({ name: 'line1', title: 'Line 1', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'line2', title: 'Line 2', type: 'string' }),
  ],
})

// One media slot: a poster image (always) and optional film. Anywhere the
// site can play footage, it uses the film when present and the poster as
// the still/fallback — so swapping a video is just replacing the file here.
export const mediaSlot = defineType({
  name: 'mediaSlot',
  title: 'Media',
  type: 'object',
  fields: [
    defineField({ name: 'poster', title: 'Poster image', type: 'image', validation: (r) => r.required() }),
    defineField({
      name: 'film',
      title: 'Film (mp4)',
      type: 'file',
      options: { accept: 'video/mp4' },
      description: 'Optional — when set, this footage plays where the site supports video.',
    }),
  ],
})

export const fact = defineType({
  name: 'fact',
  title: 'Fact',
  type: 'object',
  fields: [
    defineField({ name: 'label', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'value', type: 'string', validation: (r) => r.required() }),
  ],
})
