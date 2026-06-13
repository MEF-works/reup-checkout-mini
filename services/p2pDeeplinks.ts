/**
 * P2P app deeplinks for "Open app" buttons. Handles come from merchant config (profile.p2pHandles).
 * Zelle has no universal deeplink (bank-specific); Open app can copy instructions or open bank app list.
 */

export type P2PApp = 'venmo' | 'cashapp' | 'zelle' | 'paypal';

export interface P2PAppConfig {
  id: P2PApp;
  name: string;
  /** Builds deeplink URL, or null if app has no deeplink (e.g. Zelle). */
  getDeeplink: (handle: string, amount: number, orderId: string) => string | null;
  /** App store fallback if deeplink doesn't open (e.g. desktop). */
  appStoreUrl: string;
  playStoreUrl: string;
}

const P2P_APPS: P2PAppConfig[] = [
  {
    id: 'venmo',
    name: 'Venmo',
    getDeeplink: (handle, amount, orderId) => {
      const recipients = encodeURIComponent(handle.replace(/^@/, ''));
      const note = encodeURIComponent(orderId);
      return `venmo://paycharge?txn=pay&recipients=${recipients}&amount=${amount.toFixed(2)}&note=${note}`;
    },
    appStoreUrl: 'https://apps.apple.com/us/app/venmo/id351727428',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.venmo',
  },
  {
    id: 'cashapp',
    name: 'Cash App',
    getDeeplink: (handle, amount) => {
      const tag = handle.replace(/^\$/, '');
      return `https://cash.app/${tag}/${amount.toFixed(2)}`;
    },
    appStoreUrl: 'https://apps.apple.com/us/app/cash-app/id711923939',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.squareup.cash',
  },
  {
    id: 'zelle',
    name: 'Zelle',
    getDeeplink: () => null,
    appStoreUrl: 'https://apps.apple.com/us/app/zelle/id1260755201',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.zellepay.zelle',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    getDeeplink: (handle, amount) => {
      const user = handle.replace(/^@/, '').split('@')[0] || handle;
      return `https://paypal.me/${user}/${amount.toFixed(2)}`;
    },
    appStoreUrl: 'https://apps.apple.com/us/app/paypal-mobile-cash/id283646709',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.paypal.android.p2pmobile',
  },
];

export { P2P_APPS };

export function getP2PDeeplink(
  app: P2PApp,
  handle: string,
  amount: number,
  orderId: string
): string | null {
  const config = P2P_APPS.find((a) => a.id === app);
  return config?.getDeeplink(handle, amount, orderId) ?? null;
}

export function getP2PAppConfig(app: P2PApp): P2PAppConfig | undefined {
  return P2P_APPS.find((a) => a.id === app);
}
