import axios from 'axios';

const fastapi = import.meta.env.VITE_FASTAPI_BACKEND_URL_CANDIDATE

// Create an axios instance with default config
export const api = axios.create({
    baseURL: fastapi,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});


console.log(`API client configured with base URL: ${fastapi}`);