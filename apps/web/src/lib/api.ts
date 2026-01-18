import axios from "axios";
export const API_URL = "http://localhost:4000";

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // TODO: Handle global errors (e.g. 401 redirect)
        return Promise.reject(error);
    }
);
