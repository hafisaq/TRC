import { defineField, defineType } from 'sanity'

// Singleton (_id: siteSettings) — site-wide switches.
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  fields: [
    defineField({
      name: 'showLanguageSwitch',
      title: 'Show the Arabic / English language switch',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: { prepare: () => ({ title: 'Site settings' }) },
})
