import axios from 'axios';

// const backendUrl = import.meta.env.VITE_BACKEND_URL;
const backendUrl = import.meta.env.PROD
    ? import.meta.env.VITE_BACKEND_URL
    : 'http://localhost:5050';

console.log(`using: ${backendUrl}`)

export const apiClient = axios.create({
    baseURL: backendUrl,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});