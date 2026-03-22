import axios from 'axios';
import qs from 'qs';

// Changed from Spring Boot (8080) → Strapi (1337, using 127.0.0.1 to avoid IPv6 mapping issues typical on Windows)
const baseURL = `${process.env.NEXT_PUBLIC_STRAPI_URL || 'https://ambitious-bubble-123f76e3bb.strapiapp.com'}/api`;

const api = axios.create({
  baseURL: baseURL,
  paramsSerializer: params => {
    return qs.stringify(params, { arrayFormat: 'brackets' });
  },
  withCredentials: true, // Send cookies with every request
});

export default api;
