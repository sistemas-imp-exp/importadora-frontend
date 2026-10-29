import { createContext } from "react";
import type { User } from "../interfaces/auth";
import type { MotivoSalida } from "../services/sesion";

export interface AuthContextType {
    user: User | null;
    /** Mientras se recupera la sesión con la cookie al abrir o recargar la página. */
    cargando: boolean;
    login: (access: string, user: User) => void;
    logout: (motivo?: MotivoSalida) => Promise<void>;
    updateUser: (user: User) => void;
    hasArea: (area: string) => boolean;
    /** Tiene el área y no en solo lectura: puede crear, editar y eliminar. */
    puedeEditar: (area: string) => boolean;
    isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType>(
    {} as AuthContextType
);
