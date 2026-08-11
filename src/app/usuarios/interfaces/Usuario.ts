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
}
