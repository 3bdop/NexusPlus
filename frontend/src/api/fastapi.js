import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
    baseURL: import.meta.env.FASTAPI_BACKEND_URL_CANDIDATE,
    headers: {
        'Content-Type': 'application/json',
    },
});

const backendUrl = import.meta.env.PROD
    ? import.meta.env.VITE_BACKEND_URL
    : 'http://localhost:5050';

console.log(`using: ${backendUrl}`)

// Add a request interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default api;