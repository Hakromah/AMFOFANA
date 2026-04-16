/**
 * Dynamic API configuration.
 *
 * Switch PLATFORM to:
 *   'emulator'   → Android emulator (10.0.2.2 maps to your host machine's localhost)
 *   'device'     → Physical device on same Wi-Fi (set YOUR_LOCAL_IP below)
 *   'production' → Deployed Strapi cloud instance
 */

type Platform = 'emulator' | 'device' | 'production';

const PLATFORM: Platform = 'production';

// ── Set this to your machine's LAN IP when using a physical device ──────────
const YOUR_LOCAL_IP = '192.168.1.100';
// ────────────────────────────────────────────────────────────────────────────

const STRAPI_CLOUD = 'https://engaging-heart-abbd6e0d5c.strapiapp.com';

const BACKENDS: Record<Platform, { strapi: string }> = {
  emulator: { strapi: 'http://10.0.2.2:1337' },
  device: { strapi: `http://${YOUR_LOCAL_IP}:1337` },
  production: { strapi: STRAPI_CLOUD },
};

export const STRAPI_BASE_URL = BACKENDS[PLATFORM].strapi;

/**
 * Resolves Strapi media URLs to absolute paths.
 * Handles both absolute cloud URLs and relative paths from local Strapi.
 */
export const getStrapiMediaUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${STRAPI_BASE_URL}${url}`;
};
