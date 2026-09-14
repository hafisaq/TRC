import { defineField, defineType } from 'sanity'

// Singleton (_id: siteSettings) — site-wide switches + the footer.
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  fieldsets: [
    { name: 'footerCopy', title: 'Footer — words', options: { collapsible: true, collapsed: false } },
    { name: 'footerContact', title: 'Footer — contact details', options: { collapsible: true, collapsed: false } },
    { name: 'signature', title: 'Footer — signature', options: { collapsible: true, collapsed: true } },
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
    defineField({
      name: 'contacts', title: 'Contact details', type: 'array', fieldset: 'footerContact',
      description: 'Each line shows in the footer with its own icon. Untick "Show" to hide one without deleting it.',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'type', title: 'Type', type: 'string', validation: (r) => r.required(),
            options: { list: [
              { title: 'Phone', value: 'phone' },
              { title: 'WhatsApp', value: 'whatsapp' },
              { title: 'Email', value: 'email' },
            ], layout: 'radio', direction: 'horizontal' } }),
          defineField({ name: 'value', title: 'Number or address', type: 'string', validation: (r) => r.required(),
            description: 'Shown as typed. Numbers with the country code, e.g. +971 56 000 0000.' }),
          defineField({ name: 'show', title: 'Show', type: 'boolean', initialValue: true }),
        ],
        preview: { select: { title: 'value', subtitle: 'type', show: 'show' }, prepare: ({ title, subtitle, show }) => ({ title, subtitle: `${subtitle}${show === false ? ' · hidden' : ''}` }) },
      }],
    }),
    defineField({
      name: 'socials', title: 'Social profiles', type: 'array', fieldset: 'footerContact',
      description: 'Pick the network and the icon follows. Untick "Show" to hide one.',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'network', title: 'Network', type: 'string', validation: (r) => r.required(),
            options: { list: [
              { title: 'Instagram', value: 'instagram' },
              { title: 'Facebook', value: 'facebook' },
              { title: 'X (Twitter)', value: 'x' },
              { title: 'LinkedIn', value: 'linkedin' },
              { title: 'YouTube', value: 'youtube' },
              { title: 'TikTok', value: 'tiktok' },
              { title: 'Pinterest', value: 'pinterest' },
            ] } }),
          defineField({ name: 'url', title: 'Profile link', type: 'url' }),
          defineField({ name: 'show', title: 'Show', type: 'boolean', initialValue: true }),
        ],
        preview: { select: { title: 'network', subtitle: 'url', show: 'show' }, prepare: ({ title, subtitle, show }) => ({ title, subtitle: `${subtitle ?? ''}${show === false ? ' · hidden' : ''}` }) },
      }],
    }),
    defineField({ name: 'showSignature', title: 'Show the maker\'s signature', type: 'boolean', fieldset: 'signature', initialValue: false,
      description: 'A small hand-signed credit at the very end of the footer.' }),
    defineField({ name: 'signatureName', title: 'Signature name', type: 'string', fieldset: 'signature' }),
    defineField({ name: 'signatureUrl', title: 'Signature link', type: 'url', fieldset: 'signature' }),
  ],
  preview: { prepare: () => ({ title: 'Site settings' }) },
})
