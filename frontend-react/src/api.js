import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Relative path for Nginx proxy or Vite dev proxy
  withCredentials: true,
});

export default api;
