import axios from 'axios';
//const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'https://outgoing-fruit-84aa9644f7.strapiapp.com';
const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const strapi = axios.create({
  baseURL: `${strapiUrl}/api`,
  headers: { 'Content-Type': 'application/json' },
});
export default strapi;
// Helper to populate image URLs properly
export const getStrapiMediaUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${strapiUrl}${url}`;
};
