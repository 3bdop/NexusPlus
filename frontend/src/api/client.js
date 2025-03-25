import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const apiClient = axios.create({
    baseURL: backendUrl,
});

export default apiClient