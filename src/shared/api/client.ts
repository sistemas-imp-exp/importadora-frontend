import axios from "axios";
import { authStorage } from "../services/authStorage.service";

// Build de producción (npm run build): siempre "/api/" en el mismo origen, porque
// IIS sirve la SPA y reenvía /api/ a waitress (que solo escucha en 127.0.0.1).
// Se ignora VITE_API_URL a propósito: Vite carga .env.local también al compilar
// y colaría la IP de desarrollo en el bundle.
//
// En desarrollo: loopback por defecto; para probar desde otro dispositivo de la
// red, define VITE_API_URL en un .env.local con la IP del servidor.
const BASE_URL = import.meta.env.PROD
    ? "/api/"
    : import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api/";

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Instancia sin interceptores: el refresh nunca debe pasar por el
// interceptor de "api", o un refresh token inválido cuelga el flujo
// (ver pendingRequests más abajo).
const refreshClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = authStorage.getAccessToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})
let isRefreshing = false;
let pendingRequests: Array<{
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}> = [];
api.interceptors.response.use(
    response => response,

    async error => {

        const originalRequest = error.config;

        if (
            error.response?.status !== 401 ||
            originalRequest._retry
        ) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (isRefreshing) {

            return new Promise((resolve, reject) => {

                pendingRequests.push({
                    resolve: (token) => {

                        originalRequest.headers.Authorization =
                            `Bearer ${token}`;

                        resolve(api(originalRequest));

                    },
                    reject,
                });

            });

        }

        isRefreshing = true;

        try {

            const refreshToken =
                authStorage.getRefreshToken();

            if (!refreshToken)
                throw error;

            const data = await refreshClient.post(
                "/auth/refresh/",
                {
                    refresh: refreshToken,
                }
            );

            const access = data.data.access;
            const rotatedRefresh = data.data.refresh;

            authStorage.updateAccessToken(access);

            if (rotatedRefresh) {
                authStorage.updateRefreshToken(rotatedRefresh);
            }

            pendingRequests.forEach(({ resolve }) =>
                resolve(access)
            );

            pendingRequests = [];

            originalRequest.headers.Authorization =
                `Bearer ${access}`;

            return api(originalRequest);

        } catch (e) {

            pendingRequests.forEach(({ reject }) =>
                reject(e)
            );

            pendingRequests = [];

            authStorage.clear();

            window.location.href = "/login";

            return Promise.reject(e);

        } finally {

            isRefreshing = false;

        }

    }
);

export default api;