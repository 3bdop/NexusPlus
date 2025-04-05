import axios from 'axios';

// Create an axios instance with default config
export const api = axios.create({
    baseURL: import.meta.env.FASTAPI_BACKEND_URL_CANDIDATE,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});


console.log(`using: ${api} - for Candidate`)
