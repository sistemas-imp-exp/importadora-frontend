import type { Notificacion } from "./interfaces/Notificacion";

/** Icono por tipo de aviso o mensaje. */
export function iconoNotificacion(n: Pick<Notificacion, "tipo" | "evento">) {
    if (n.tipo === "mensaje") return "bi-chat-left-text";
    if (n.evento === "venta_diferencia") return "bi-exclamation-diamond";
    if (n.evento === "salida_corregida") return "bi-arrow-repeat";
    return "bi-bell";
}
