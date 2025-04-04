import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: '/', // The proxy in vite.config.js will handle routing to the backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
