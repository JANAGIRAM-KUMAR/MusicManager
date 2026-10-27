import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.env.MODE === 'development' ? "http://localhost:6001/api" : "/api",
    withCredentials: true
});

axiosInstance.interceptors.request.use((config) => {
    try {
        const token = localStorage.getItem("soundwave_token");
        if (token && config.headers) {
            (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
        }
    } catch {
        // ignore
    }
    return config;
});

export default axiosInstance;