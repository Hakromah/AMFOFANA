import axios from 'axios';
import qs from 'qs';

const baseURL = process.env.NEXT_PUBLIC_API_URL || '';

const api = axios.create({
  baseURL: baseURL,
  paramsSerializer: params => {
    return qs.stringify(params, { arrayFormat: 'brackets' });
  },
  withCredentials: true, // Send cookies with every request
});

export interface NavigationMenuItem {
  label: string;
  url: string;
  description?: string;
  children?: NavigationMenuItem[];
}

export async function getSettings(): Promise<Record<string, string>> {
  try {
    const response = await api.get('/api/settings');
    // Assuming the response data is the settings object or has a data property
    return response.data?.data || response.data || {};
  } catch (error: any) {
    console.error('Error fetching settings:', error?.message || 'Unknown network error');
    return {};
  }
}

export async function getNavigation(): Promise<{ navbar: NavigationMenuItem[] }> {
  try {
    const response = await api.get('/api/navigation');
    return response.data?.data || response.data || { navbar: [] };
  } catch (error: any) {
    console.error('Error fetching navigation:', error?.message || 'Unknown network error');
    return { navbar: [] };
  }
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

export default api;