import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_LINK || 'http://localhost:5000/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('learnhub_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('learnhub_token');
      localStorage.removeItem('learnhub_user');
      window.dispatchEvent(new Event('learnhub:unauthorized'));
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error) {
  return error.response?.data?.message || error.message || 'Something went wrong. Please try again.';
}

export default api;
