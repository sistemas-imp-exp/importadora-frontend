import type { EstadoAnimal, MotivoMovimiento, Sexo, TipoMovimiento } from "../interfaces/Ganado";

export const AREA_GANADO = "GAN";

/** "2026-10-05" → "05/10/2026" (sin pasar por Date: no cambia de día por zona horaria). */
export function fecha(iso: string | null | undefined): string {
    if (!iso) return "";
    const [a, m, d] = iso.slice(0, 10).split("-");
    return `${d}/${m}/${a}`;
}

export function dinero(valor: string | number | null | undefined): string {
    if (valor === null || valor === undefined || valor === "") return "";
    return Number(valor).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export const SEXOS: { value: Sexo; label: string }[] = [
    { value: "H", label: "Hembra" },
    { value: "M", label: "Macho" },
];

export function nombreSexo(sexo: Sexo | ""): string {
    return sexo === "H" ? "Hembra" : sexo === "M" ? "Macho" : "Ambos";
}

export const TIPOS: { value: TipoMovimiento; label: string }[] = [
    { value: "ALTA", label: "Alta" },
    { value: "BAJA", label: "Baja" },
    { value: "TRASPASO", label: "Traspaso" },
];

export const MOTIVOS: Record<TipoMovimiento, { value: MotivoMovimiento; label: string }[]> = {
    ALTA: [
        { value: "COMPRA", label: "Compra" },
        { value: "NACIMIENTO", label: "Nacimiento" },
        { value: "REGALO", label: "Regalo" },
    ],
    BAJA: [
        { value: "VENTA", label: "Venta" },
        { value: "MUERTE", label: "Muerte" },
    ],
    TRASPASO: [],
};

export const TODOS_MOTIVOS = [...MOTIVOS.ALTA, ...MOTIVOS.BAJA];

export const ESTADOS: { value: EstadoAnimal; label: string }[] = [
    { value: "ACTIVO", label: "Activos" },
    { value: "VENDIDO", label: "Vendidos" },
    { value: "MUERTO", label: "Muertos" },
];

const CLASE_ESTADO: Record<EstadoAnimal, string> = {
    ACTIVO: "success",
    VENDIDO: "primary",
    MUERTO: "secondary",
    CANCELADO: "warning",
};

export function claseBadge(color: string): string {
    return `badge border bg-${color}-subtle text-${color}-emphasis border-${color}-subtle`;
}

export function claseEstado(estado: EstadoAnimal): string {
    return claseBadge(CLASE_ESTADO[estado]);
}

const CLASE_TIPO: Record<TipoMovimiento, string> = { ALTA: "success", BAJA: "danger", TRASPASO: "info" };

export function claseTipo(tipo: TipoMovimiento): string {
    return claseBadge(CLASE_TIPO[tipo]);
}

export function nombreUsuario(u: { username: string; first_name: string; last_name: string } | null): string {
    if (!u) return "";
    const nombre = `${u.first_name} ${u.last_name}`.trim();
    return nombre || u.username;
}
