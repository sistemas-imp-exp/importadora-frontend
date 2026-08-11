import { createContext } from "react";
import type { User } from "../interfaces/auth";

export interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    login: (access: string, refresh: string, user: User) => void;
    logout: () => void;
    updateUser: (user: User) => void;
    hasArea: (area: string) => boolean;
    isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType>(
    {} as AuthContextType
);