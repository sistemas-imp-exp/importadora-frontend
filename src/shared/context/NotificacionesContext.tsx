import { createContext } from "react";
import type { ResumenNotificaciones } from "../../app/notificaciones/interfaces/Notificacion";

export const RESUMEN_VACIO: ResumenNotificaciones = { no_leidas: 0, recientes: [], puntos: {} };

export interface NotificacionesContextType {
    resumen: ResumenNotificaciones;
    /** Volver a consultar ya (tras leer, responder o atender algo). */
    recargar: () => void;
}

export const NotificacionesContext = createContext<NotificacionesContextType>({
    resumen: RESUMEN_VACIO,
    recargar: () => {},
});
