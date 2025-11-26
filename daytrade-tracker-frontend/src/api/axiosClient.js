import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://192.168.1.130:8000", // <-- change this
});

// Add auth token to each request if available
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;