export interface LoginRequest {
    username: string;
    password: string;
}

export interface ActualizarPerfilRequest {
    first_name: string;
    last_name: string;
    email: string;
}

export interface CambiarPasswordRequest {
    password_actual: string;
    password_nueva: string;
    password_nueva2: string;
}

export interface User {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    is_superuser: boolean;
    areas: string[];
    foto: string | null;
}

export interface LoginResponse {
    access: string;
    refresh: string;
    user: User;
}