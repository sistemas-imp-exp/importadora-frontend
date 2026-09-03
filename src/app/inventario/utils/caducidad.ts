export type NivelCaducidad = "vencido" | "critico" | "urgente" | "por_vencer";

const DIAS_POR_VENCER = 30;
const DIAS_URGENTE = 15;
const DIAS_CRITICO = 7;

/**
 * Mismos umbrales que `inventario/alertas.py::clasificar_nivel` en el
 * backend — si se ajustan aquí, ajustar también allá.
 */
export function clasificarNivelCaducidad(diasRestantes: number): NivelCaducidad | null {
    if (diasRestantes < 0) return "vencido";
    if (diasRestantes <= DIAS_CRITICO) return "critico";
    if (diasRestantes <= DIAS_URGENTE) return "urgente";
    if (diasRestantes <= DIAS_POR_VENCER) return "por_vencer";
    return null;
}

export function diasRestantesHasta(fechaISO: string): number {
    const hoy = new Date();
    const hoyUTC = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const [anio, mes, dia] = fechaISO.split("-").map(Number);
    const fechaUTC = Date.UTC(anio, mes - 1, dia);
    return Math.round((fechaUTC - hoyUTC) / (1000 * 60 * 60 * 24));
}

export const ETIQUETA_NIVEL: Record<NivelCaducidad, string> = {
    vencido: "Vencido",
    critico: "Crítico",
    urgente: "Urgente",
    por_vencer: "Por vencer",
};

export const CLASE_BADGE_NIVEL: Record<NivelCaducidad, string> = {
    vencido: "text-bg-dark",
    critico: "text-bg-danger",
    urgente: "text-bg-warning",
    por_vencer: "text-bg-info",
};

export const CLASE_FILA_NIVEL: Record<NivelCaducidad, string> = {
    vencido: "table-dark",
    critico: "table-danger",
    urgente: "table-warning",
    por_vencer: "table-info",
};
