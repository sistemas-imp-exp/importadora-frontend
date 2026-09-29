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
}
