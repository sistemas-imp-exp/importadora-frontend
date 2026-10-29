import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import type { ResumenNotificaciones } from "../../app/notificaciones/interfaces/Notificacion";
import { obtenerResumen } from "../../app/notificaciones/services/notificaciones.service";
import { NotificacionesContext, RESUMEN_VACIO } from "./NotificacionesContext";

/** Cada cuánto se consulta la campana (solo con la pestaña visible). */
const INTERVALO_MS = 60 * 1000;

/**
 * Campana y puntos del menú: consulta /notificaciones/resumen/ cada minuto y al
 * volver a la pestaña. WebSockets no aplican (waitress no los maneja) y para
 * avisos entre áreas un minuto es suficiente.
 */
export function NotificacionesProvider({ children }: { children: ReactNode }) {
    const [resumen, setResumen] = useState<ResumenNotificaciones>(RESUMEN_VACIO);
    const enCurso = useRef(false);
    const { pathname } = useLocation();

    const recargar = useCallback(async () => {
        if (enCurso.current) return;
        enCurso.current = true;
        try {
            setResumen(await obtenerResumen());
        } catch {
            // Sin red o sin sesión: se reintenta en la siguiente vuelta.
        } finally {
            enCurso.current = false;
        }
    }, []);

    // Al entrar y al cambiar de pantalla (lo atendido en una vista quita su punto al salir).
    useEffect(() => {
        const id = setTimeout(recargar, 0);
        return () => clearTimeout(id);
    }, [pathname, recargar]);

    useEffect(() => {
        const intervalo = setInterval(() => {
            if (document.visibilityState === "visible") recargar();
        }, INTERVALO_MS);
        function alVolver() {
            if (document.visibilityState === "visible") recargar();
        }
        document.addEventListener("visibilitychange", alVolver);
        return () => {
            clearInterval(intervalo);
            document.removeEventListener("visibilitychange", alVolver);
        };
    }, [recargar]);

    return (
        <NotificacionesContext.Provider value={{ resumen, recargar }}>
            {children}
        </NotificacionesContext.Provider>
    );
}
