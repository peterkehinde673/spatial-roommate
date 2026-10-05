import { AssetType, defineAssets } from '@iwsdk/core';

const publicAssetUrl = (path: string): string =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/u, '')}`;

export default defineAssets({
  'goal-panel': {
    name: 'Goal selection panel',
    type: AssetType.UIKitML,
    url: publicAssetUrl('ui/goal-panel.uikitml'),
    priority: 'lazy',
  },
});
