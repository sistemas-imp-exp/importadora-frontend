import api from "../../../shared/api/client";
import { descargarBlob } from "../../../shared/utils/descargarArchivo";
import type { RespuestaPaginada } from "../../../shared/interfaces/Paginado";
import type {
    Animal, AnimalRequest, AnimalSeleccion, Categoria, EditarMovimientoRequest, Especie, HistorialAnimal,
    InventarioGanado, Movimiento, MovimientoRequest, Rancho, ReporteMovimientos,
} from "../interfaces/Ganado";

const BASE = "ganado/";
const PDF = "application/pdf";
const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Quita los filtros vacíos para no mandarlos al API. */
function limpiar(filtro: object): Record<string, string | number> {
    return Object.fromEntries(
        Object.entries(filtro).filter(([, v]) => v !== undefined && v !== null && v !== ""),
    ) as Record<string, string | number>;
}

// --- Catálogos --------------------------------------------------------------

export async function obtenerRanchos(): Promise<Rancho[]> {
    const { data } = await api.get<Rancho[]>(`${BASE}ranchos/`);
    return data;
}

export async function guardarRancho(rancho: Rancho): Promise<Rancho> {
    const { data } = rancho.id
        ? await api.put<Rancho>(`${BASE}ranchos/${rancho.id}/`, rancho)
        : await api.post<Rancho>(`${BASE}ranchos/`, rancho);
    return data;
}

export async function eliminarRancho(id: number): Promise<void> {
    await api.delete(`${BASE}ranchos/${id}/`);
}

export async function obtenerEspecies(): Promise<Especie[]> {
    const { data } = await api.get<Especie[]>(`${BASE}especies/`);
    return data;
}

export async function guardarEspecie(especie: Especie): Promise<Especie> {
    const { data } = especie.id
        ? await api.put<Especie>(`${BASE}especies/${especie.id}/`, especie)
        : await api.post<Especie>(`${BASE}especies/`, especie);
    return data;
}

export async function eliminarEspecie(id: number): Promise<void> {
    await api.delete(`${BASE}especies/${id}/`);
}

export async function obtenerCategorias(): Promise<Categoria[]> {
    const { data } = await api.get<Categoria[]>(`${BASE}categorias/`);
    return data;
}

export async function guardarCategoria(categoria: Categoria): Promise<Categoria> {
    const { data } = categoria.id
        ? await api.put<Categoria>(`${BASE}categorias/${categoria.id}/`, categoria)
        : await api.post<Categoria>(`${BASE}categorias/`, categoria);
    return data;
}

export async function eliminarCategoria(id: number): Promise<void> {
    await api.delete(`${BASE}categorias/${id}/`);
}

// --- Animales ---------------------------------------------------------------

export interface FiltroAnimales {
    q?: string;
    rancho?: string;
    especie?: string;
    categoria?: string;
    sexo?: string;
    /** "" = todos (menos altas canceladas). */
    estado?: string;
    arete?: string;
    page?: number;
    por_pagina?: number;
}

export async function obtenerAnimales(filtro: FiltroAnimales, signal?: AbortSignal): Promise<RespuestaPaginada<Animal>> {
    const { data } = await api.get<RespuestaPaginada<Animal>>(`${BASE}animales/`, {
        params: { ...limpiar(filtro), estado: filtro.estado ?? "ACTIVO" },
        signal,
    });
    return data;
}

export async function obtenerSeleccionAnimales(rancho: number): Promise<AnimalSeleccion[]> {
    const { data } = await api.get<AnimalSeleccion[]>(`${BASE}animales/seleccion/`, { params: { rancho } });
    return data;
}

export async function actualizarAnimal(id: number, animal: AnimalRequest): Promise<Animal> {
    const { data } = await api.patch<Animal>(`${BASE}animales/${id}/`, animal);
    return data;
}

export async function obtenerHistorialAnimal(id: number): Promise<HistorialAnimal> {
    const { data } = await api.get<HistorialAnimal>(`${BASE}animales/${id}/historial/`);
    return data;
}

// --- Movimientos ------------------------------------------------------------

export interface FiltroMovimientos {
    desde?: string;
    hasta?: string;
    rancho?: string;
    tipo?: string;
    motivo?: string;
    q?: string;
    cancelados?: string;
    page?: number;
    por_pagina?: number;
}

export async function obtenerMovimientos(filtro: FiltroMovimientos, signal?: AbortSignal): Promise<RespuestaPaginada<Movimiento>> {
    const { data } = await api.get<RespuestaPaginada<Movimiento>>(`${BASE}movimientos/`, { params: limpiar(filtro), signal });
    return data;
}

export async function obtenerMovimiento(id: number): Promise<Movimiento> {
    const { data } = await api.get<Movimiento>(`${BASE}movimientos/${id}/`);
    return data;
}

export async function crearMovimiento(movimiento: MovimientoRequest): Promise<Movimiento> {
    const { data } = await api.post<Movimiento>(`${BASE}movimientos/`, movimiento);
    return data;
}

export async function editarMovimiento(id: number, cambios: EditarMovimientoRequest): Promise<Movimiento> {
    const { data } = await api.patch<Movimiento>(`${BASE}movimientos/${id}/`, cambios);
    return data;
}

export async function cancelarMovimiento(id: number, motivo: string): Promise<Movimiento> {
    const { data } = await api.post<Movimiento>(`${BASE}movimientos/${id}/cancelar/`, { motivo });
    return data;
}

// --- Reportes ---------------------------------------------------------------

export interface FiltroInventario {
    fecha?: string;
    rancho?: string;
    especie?: string;
}

export async function obtenerInventario(filtro: FiltroInventario, signal?: AbortSignal): Promise<InventarioGanado> {
    const { data } = await api.get<InventarioGanado>(`${BASE}reportes/inventario/`, {
        params: { ...limpiar(filtro), animales: 1 },
        signal,
    });
    return data;
}

export async function descargarInventario(filtro: FiltroInventario, formato: "pdf" | "excel"): Promise<void> {
    await descargarBlob(
        `${BASE}reportes/inventario/${formato}/`,
        formato === "pdf" ? PDF : XLSX,
        `inventario_ganado.${formato === "pdf" ? "pdf" : "xlsx"}`,
        new URLSearchParams(Object.entries(limpiar(filtro)).map(([k, v]) => [k, String(v)])),
    );
}

export interface FiltroReporteMovimientos {
    desde: string;
    hasta: string;
    rancho?: string;
    tipo?: string;
    motivo?: string;
}

export async function obtenerReporteMovimientos(filtro: FiltroReporteMovimientos, signal?: AbortSignal): Promise<ReporteMovimientos> {
    const { data } = await api.get<ReporteMovimientos>(`${BASE}reportes/movimientos/`, { params: limpiar(filtro), signal });
    return data;
}

export async function descargarReporteMovimientos(filtro: FiltroReporteMovimientos, formato: "pdf" | "excel"): Promise<void> {
    await descargarBlob(
        `${BASE}reportes/movimientos/${formato}/`,
        formato === "pdf" ? PDF : XLSX,
        `movimientos_ganado.${formato === "pdf" ? "pdf" : "xlsx"}`,
        new URLSearchParams(Object.entries(limpiar(filtro)).map(([k, v]) => [k, String(v)])),
    );
}
