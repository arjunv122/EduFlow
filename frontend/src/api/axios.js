import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token and institution context
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Attach the active institution context for superadmin cross-institution access
    const institutionId = localStorage.getItem('activeInstitutionId');
    if (institutionId) {
      config.headers['x-institution-id'] = institutionId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const requestUrl = error.config?.url || '';
      // Skip the session-expired event for auth routes (login, register, reset-password).
      // These 401s are expected credential failures, NOT expired sessions.
      const isAuthRoute = requestUrl.includes('/auth/login') ||
                          requestUrl.includes('/auth/register') ||
                          requestUrl.includes('/auth/forgot') ||
                          requestUrl.includes('/auth/reset');

      // Only fire the session-expired event if a token actually existed,
      // meaning this was a real authenticated request that got rejected.
      const hadToken = !!localStorage.getItem('token');

      if (!isAuthRoute && hadToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('activeInstitutionId');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
