import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'nvmppjc2',
    dataset: 'production'
  },
  studioHost: 'trc-retreat',
  deployment: {
    appId: 'mlrb6yyx1k3ry7j7303c98c9',
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
  },
})
