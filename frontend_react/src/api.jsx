// File: src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1'
});

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post('http://127.0.0.1:8000/api/v1/token/refresh/', {
          refresh: refreshToken
          
        });
        localStorage.setItem('accessToken', response.data.access);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
        
        // 👇 THIS IS THE ONLY LINE I ADDED
        // This ensures the request that is being retried also gets the new token.
        originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;

        return api(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed, logging out.", refreshError);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;