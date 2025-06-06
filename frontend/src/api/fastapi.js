import axios from 'axios';

const fastapi = import.meta.env.VITE_FASTAPI_JOB_SEEKER

// Create an axios instance with default config
export const api = axios.create({
    baseURL: fastapi,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});


console.log(`API client configured with base URL: ${fastapi}`);