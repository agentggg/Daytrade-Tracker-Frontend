import axios from "axios";

const axiosClient = axios.create({
  // baseURL: "http://localhost:8000", // <-- change this
  baseURL: "https://ict-agentofgod.pythonanywhere.com", // <-- change this
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