import axios from "axios";

const axiosInstance = axios.create({
    baseURL: "http://localhost:6001/api",
    withCredentials: true
});

export default axiosInstance;