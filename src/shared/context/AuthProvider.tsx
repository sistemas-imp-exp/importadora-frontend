import type { ReactNode } from "react";
import { useState } from "react";
import { AuthContext } from "./AuthContext";
import type { User } from "../interfaces/auth";
import { authStorage } from "../services/authStorage.service";
import { me } from "../services/auth.service";
import { useEffect } from "react";

interface Props {
    children: ReactNode;
}

export function AuthProvider({ children }: Props) {
    const [user, setUser] = useState<User | null>(
        authStorage.getUser()
    );

    const [accessToken, setAccessToken] = useState<string | null>(
        authStorage.getAccessToken()
    );

    const login = (
        access: string,
        refresh: string,
        user: User
    ) => {
        authStorage.save(access, refresh, user);

        setAccessToken(access);
        setUser(user);
    };

    const logout = () => {
        authStorage.clear();

        setAccessToken(null);
        setUser(null);
    };

    const updateUser = (user: User) => {
        authStorage.updateUser(user);
        setUser(user);
    };

    const hasArea = (area: string) => {
        if (!user) return false;

        if (user.is_superuser) return true;

        return user.areas.includes(area);
    };

    // Misma regla que security.permissions.tiene_area(..., escritura=True) en
    // el backend, que es el que realmente la hace cumplir.
    const puedeEditar = (area: string) => {
        if (!user || !hasArea(area)) return false;
        if (user.is_superuser) return true;
        return !(user.areas_solo_lectura ?? []).includes(area);
    };
    useEffect(() => {
        async function loadUser() {

            if (!accessToken)
                return;

            try {

                const user = await me();

                setUser(user);

                authStorage.updateUser(user);

            } catch {

                logout();

            }
        }

        loadUser();

    }, [accessToken]);
    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                login,
                logout,
                updateUser,
                hasArea,
                puedeEditar,
                isAuthenticated: !!accessToken && !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}