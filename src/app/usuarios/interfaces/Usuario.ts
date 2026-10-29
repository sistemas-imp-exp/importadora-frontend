export interface Usuario {
    id: number;
    username: string;
    password?: string;
    first_name: string;
    last_name: string;
    email: string;
    is_active: boolean;
    is_superuser: boolean;
    foto: string | null;
    areas: string[];
    // Subconjunto de `areas` asignado en solo lectura (consulta y descarga).
    areas_solo_lectura: string[];
    // Solo lectura (los calcula el backend).
    ultimo_acceso?: string | null;
    debe_cambiar_password?: boolean;
    /** Bloqueado ahora mismo por intentos fallidos. */
    bloqueado?: boolean;
}

export type EventoAccesoTipo =
    | "ingreso"
    | "fallido"
    | "bloqueado"
    | "salida"
    | "inactividad"
    | "password"
    | "sesiones_cerradas"
    | "desbloqueo"
    | "reuso_token";

export interface EventoAcceso {
    id: number;
    fecha: string;
    evento: EventoAccesoTipo;
    evento_display: string;
    usuario: number | null;
    username: string;
    nombre: string;
    ip: string | null;
    navegador: string;
    detalle: string;
}
