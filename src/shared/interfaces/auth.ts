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
    // Subconjunto de `areas` en el que solo se consulta y descarga.
    areas_solo_lectura?: string[];
    foto: string | null;
    /** Contraseña provisional (la puso el superusuario): hay que cambiarla antes de seguir. */
    debe_cambiar_password: boolean;
}

/** Login, renovación y cambio de contraseña: el refresh viaja aparte, en cookie httpOnly. */
export interface SesionResponse {
    access: string;
    user: User;
}