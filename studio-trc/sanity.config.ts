import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'TRC',

  projectId: 'nvmppjc2',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            // singleton — one document, opened directly (holds the
            // Arabic/English switch visibility toggle)
            S.listItem()
              .title('Site settings')
              .id('siteSettings')
              .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
            S.listItem()
              .title('About page')
              .id('aboutPage')
              .child(S.document().schemaType('aboutPage').documentId('aboutPage')),
            S.divider(),
            ...S.documentTypeListItems().filter(
              (item) => !['siteSettings', 'aboutPage', 'translation'].includes(item.getId() ?? ''),
            ),
            S.divider(),
            S.documentTypeListItem('translation').title('Arabic translations'),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
})
