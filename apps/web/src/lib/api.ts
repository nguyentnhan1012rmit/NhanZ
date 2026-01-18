import axios from "axios";
import { API_URL } from "@nhanz/shared";

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
