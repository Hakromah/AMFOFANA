/**
 * Authenticated Axios client for Strapi's custom school-management routes.
 *
 * Endpoints it covers (mirrors the web frontend's lib/api.ts):
 *   POST /auth/local           - Login (no token required)
 *   GET  /auth/me              - Current user profile
 *   GET  /admin/reports/summary
 *   GET  /admin/users          POST /admin/users
 *   GET  /admin/classes        POST /admin/classes
 *   GET  /admin/subjects       POST /admin/subjects
 *   GET  /admin/exams          POST /admin/exams
 *   GET  /admin/materials      POST /admin/materials
 *   GET  /admin/results
 *   GET  /admin/timetable
 *   GET  /teacher/classes
 *   GET  /teacher/exams
 *   GET  /teacher/results/filter
 *   GET  /teacher/materials
 *   GET  /teacher/attendance
 *   GET  /student/dashboard-stats
 *   GET  /student/classes
 *   GET  /student/exams
 *   GET  /student/results
 *   GET  /student/attendance
 *   GET  /student/materials
 */

import axios from 'axios';
import { getToken } from './auth';
import { STRAPI_BASE_URL } from './config';

const api = axios.create({
  baseURL: `${STRAPI_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from SecureStore on every request (mirrors web's Cookies.get('accessToken'))
api.interceptors.request.use(
  async (config) => {
    // Skip the Authorization header for the login route itself
    const isAuthRoute = config.url?.includes('/auth/local');
    if (!isAuthRoute) {
      const token = await getToken();
      if (token && config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
