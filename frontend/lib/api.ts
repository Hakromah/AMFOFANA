import axios from 'axios';
import qs from 'qs';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: baseURL,
  paramsSerializer: params => {
    return qs.stringify(params, { arrayFormat: 'brackets' });
  },
  withCredentials: true, // Send cookies with every request
});

export default api;
