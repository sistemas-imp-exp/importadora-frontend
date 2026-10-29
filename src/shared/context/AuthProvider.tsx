import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import type { User } from "../interfaces/auth";
import {
    alCerrarseEnOtraPestana,
    cerrarSesionServidor,
    renovarSesion,
    sesion,
    type MotivoSalida,
} from "../services/sesion";
import { useInactividad } from "../hooks/useInactividad";
import AvisoInactividad from "../components/AvisoInactividad";

interface Props {
    children: ReactNode;
}

export function AuthProvider({ children }: Props) {
    const [user, setUser] = useState<User | null>(null);
    const [cargando, setCargando] = useState(true);

    // Al abrir o recargar: el access no sobrevive (vive en memoria), se pide
    // uno nuevo con la cookie del refresh. Sin cookie válida, al login.
    useEffect(() => {
        let vigente = true;
        renovarSesion()
            .then((data) => {
                if (vigente) setUser(data.user);
            })
            .catch(() => {
                // sin sesión
            })
            .finally(() => {
                if (vigente) setCargando(false);
            });
        return () => {
            vigente = false;
        };
    }, []);

    // Cerrar sesión en una pestaña la cierra en todas.
    useEffect(
        () =>
            alCerrarseEnOtraPestana(() => {
                sesion.setAccess(null);
                setUser(null);
            }),
        []
    );

    const login = (access: string, user: User) => {
        sesion.setAccess(access);
        setUser(user);
    };

    const logout = useCallback(async (motivo: MotivoSalida = "manual") => {
        await cerrarSesionServidor(motivo);
        setUser(null);
    }, []);

    const cerrarPorInactividad = useCallback(() => {
        logout("inactividad");
    }, [logout]);

    const { segundosRestantes, seguir } = useInactividad(!!user, cerrarPorInactividad);

    const updateUser = (user: User) => {
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

    return (
        <AuthContext.Provider
            value={{
                user,
                cargando,
                login,
                logout,
                updateUser,
                hasArea,
                puedeEditar,
                isAuthenticated: !!user,
            }}
        >
            {children}
            {segundosRestantes !== null && (
                <AvisoInactividad
                    segundos={segundosRestantes}
                    onSeguir={seguir}
                    onSalir={() => logout()}
                />
            )}
        </AuthContext.Provider>
    );
}
