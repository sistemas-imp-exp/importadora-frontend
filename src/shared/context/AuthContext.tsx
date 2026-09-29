import { createContext } from "react";
import type { User } from "../interfaces/auth";

export interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    login: (access: string, refresh: string, user: User) => void;
    logout: () => void;
    updateUser: (user: User) => void;
    hasArea: (area: string) => boolean;
    /** Tiene el área y no en solo lectura: puede crear, editar y eliminar. */
    puedeEditar: (area: string) => boolean;
    isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType>(
    {} as AuthContextType
);