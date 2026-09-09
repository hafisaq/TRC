import { defineField, defineType } from 'sanity'

// Singleton (_id: siteSettings) — site-wide switches + the footer.
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  fieldsets: [
    { name: 'footerCopy', title: 'Footer — words', options: { collapsible: true, collapsed: false } },
    { name: 'footerContact', title: 'Footer — contact details', options: { collapsible: true, collapsed: false } },
  ],
  fields: [
    defineField({
      name: 'showLanguageSwitch',
      title: 'Show the Arabic / English language switch',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({ name: 'footerEyebrow', title: 'Eyebrow', type: 'string', fieldset: 'footerCopy', description: 'Small line above the headline, e.g. "The arrival lounge"' }),
    defineField({ name: 'footerHeadline', title: 'Headline', type: 'titlePair', fieldset: 'footerCopy', description: 'Two lines; the second is set in gold' }),
    defineField({ name: 'footerLine', title: 'Line under the headline', type: 'text', rows: 2, fieldset: 'footerCopy' }),
    defineField({ name: 'footerStamp', title: 'Arrival stamp line', type: 'string', fieldset: 'footerCopy', description: 'Under "Arrived" on the stamp, e.g. "Your next chapter awaits"' }),
    defineField({ name: 'phone', title: 'Phone', type: 'string', fieldset: 'footerContact', description: 'Shown as typed; the link dials it. Include the country code, e.g. +971 4 000 0000. Leave empty to show "coming soon".' }),
    defineField({ name: 'whatsapp', title: 'WhatsApp number', type: 'string', fieldset: 'footerContact', description: 'International format with country code; the link opens a WhatsApp chat.' }),
    defineField({ name: 'email', title: 'Email', type: 'string', fieldset: 'footerContact', validation: (r) => r.email() }),
    defineField({
      name: 'socials', title: 'Social profiles', type: 'array', fieldset: 'footerContact',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'name', title: 'Network', type: 'string', validation: (r) => r.required(), description: 'e.g. Instagram' }),
          defineField({ name: 'url', title: 'Profile link', type: 'url', description: 'Leave empty to show the name as "coming soon"' }),
        ],
        preview: { select: { title: 'name', subtitle: 'url' } },
      }],
    }),
  ],
  preview: { prepare: () => ({ title: 'Site settings' }) },
})
