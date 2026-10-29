import axios from "axios";
import { BASE_URL, renovarSesion, sesion, terminarSesionLocal } from "../services/sesion";

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = sesion.getAccess();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// Un 401 renueva el access con la cookie y reintenta una vez. Si la cookie ya
// no sirve (expiró, se cerró la sesión o se cambió la contraseña) se va al login.
// renovarSesion() comparte una sola petición entre los 401 simultáneos.
api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        // Contraseña provisional: el backend solo deja cambiarla.
        if (status === 403 && error.response?.data?.code === "cambio_password_requerido") {
            if (window.location.pathname !== "/cambiar-password") {
                window.location.href = "/cambiar-password";
            }
            return Promise.reject(error);
        }

        if (status !== 401 || !originalRequest || originalRequest._retry) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            const { access } = await renovarSesion();
            originalRequest.headers.Authorization = `Bearer ${access}`;
            return api(originalRequest);
        } catch (e) {
            terminarSesionLocal("expirada");
            window.location.href = "/login";
            return Promise.reject(e);
        }
    }
);

export default api;
