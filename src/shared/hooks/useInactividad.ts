import { useCallback, useEffect, useRef, useState } from "react";

/** Minutos sin usar el sistema (en ninguna pestaña) antes de cerrar la sesión. */
export const MINUTOS_INACTIVIDAD = 45;
const LIMITE_MS = MINUTOS_INACTIVIDAD * 60 * 1000;
/** Se avisa este tiempo antes del cierre. */
const AVISO_MS = 2 * 60 * 1000;
const REVISION_MS = 5 * 1000;
// Compartida entre pestañas: usar el sistema en una mantiene vivas las demás.
const CLAVE = "ultima_actividad";
const EVENTOS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "wheel"] as const;

function leerCompartida(): number {
    try {
        return Number(localStorage.getItem(CLAVE)) || 0;
    } catch {
        return 0;
    }
}

/**
 * Cierra la sesión tras 45 min sin teclado, ratón ni toques. El sondeo de
 * notificaciones no cuenta como actividad. Devuelve los segundos restantes
 * cuando falta poco (para el aviso) y `seguir` para reiniciar el conteo.
 */
export function useInactividad(activo: boolean, onExpirar: () => void) {
    const [segundosRestantes, setSegundosRestantes] = useState<number | null>(null);
    const ultimaRef = useRef(0);
    const escritaRef = useRef(0);
    const onExpirarRef = useRef(onExpirar);

    useEffect(() => {
        onExpirarRef.current = onExpirar;
    }, [onExpirar]);

    const seguir = useCallback(() => {
        const ahora = Date.now();
        ultimaRef.current = ahora;
        // Escribir en cada movimiento del ratón sería excesivo: cada 15 s basta.
        if (ahora - escritaRef.current > 15000) {
            escritaRef.current = ahora;
            try {
                localStorage.setItem(CLAVE, String(ahora));
            } catch {
                // sin almacenamiento: cuenta solo la actividad de esta pestaña
            }
        }
    }, []);

    useEffect(() => {
        if (!activo) return;
        escritaRef.current = 0;
        seguir();

        EVENTOS.forEach((evento) => window.addEventListener(evento, seguir, { passive: true }));
        const intervalo = window.setInterval(() => {
            const ultima = Math.max(ultimaRef.current, leerCompartida());
            const restante = LIMITE_MS - (Date.now() - ultima);
            if (restante <= 0) {
                setSegundosRestantes(null);
                onExpirarRef.current();
            } else {
                setSegundosRestantes(restante <= AVISO_MS ? Math.ceil(restante / 1000) : null);
            }
        }, REVISION_MS);

        return () => {
            EVENTOS.forEach((evento) => window.removeEventListener(evento, seguir));
            window.clearInterval(intervalo);
        };
    }, [activo, seguir]);

    return { segundosRestantes: activo ? segundosRestantes : null, seguir };
}
