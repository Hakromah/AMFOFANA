/**
 * Unauthenticated Axios client for Strapi public content endpoints.
 * Mirrors the web frontend's lib/strapi.ts
 */
import axios from 'axios';
import { STRAPI_BASE_URL } from './config';

const strapi = axios.create({
  baseURL: `${STRAPI_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

export default strapi;

// ─── Media URL helper ────────────────────────────────────────────────────────
export function getStrapiMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${STRAPI_BASE_URL}${url}`;
}

// ─── Shared utilities ────────────────────────────────────────────────────────
export function mediaUrl(item: any): string {
  if (!item) return '';
  const media = Array.isArray(item) ? item[0] : item;
  if (!media?.url) return '';
  return getStrapiMediaUrl(media.url);
}

export function richTextToString(content: any): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  return content
    .map((block: any) =>
      (block.children || [])
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('')
    )
    .filter(Boolean)
    .join('\n\n');
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch { return iso; }
}
