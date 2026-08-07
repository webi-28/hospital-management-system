import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token on every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hms_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong.';

    if (error.response?.status === 401) {
      localStorage.removeItem('hms_token');
      delete api.defaults.headers.common['Authorization'];
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        toast.error('Session expired. Please log in again.');
        window.location.href = '/login';
      }
    } else if (error.response?.status !== 422) {
      // 422 validation errors are handled locally in forms
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
