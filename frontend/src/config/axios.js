import axios from 'axios';

// Configure axios with the base URL
axios.defaults.baseURL = 'http://localhost:8080';

// Add a request interceptor to include credentials
axios.interceptors.request.use(
  config => {
    config.withCredentials = true;
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for debugging
axios.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    console.error('API Error:', error.response || error);
    return Promise.reject(error);
  }
);

export default axios; 