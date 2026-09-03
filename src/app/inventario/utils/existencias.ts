import type { ExistenciaApi } from "../interfaces/existencias/Existencia";
import { clasificarNivelCaducidad, diasRestantesHasta, type NivelCaducidad } from "./caducidad";

export interface FilaExistencia {
    detalleId: number;
    fecha: string;
    camaraId: number | null;
    camaraNombre: string;
    proveedorNombre: string;
    talla: string;
    tipo: string;
    loteProveedor: string;
    reciboIngreso: string;
    factura: string;
    pesoPorCaja: string | null;
    cajasDisponibles: number;
    totalKilos: string;
    kilosVendidos: number;
    kilosDisponibles: string;
    costoPorKilo: string | null;
    totalPesos: number | null;
    fechaCaducidad: string | null;
    // Precalculados una sola vez al construir la fila: los usan tanto el filtro
    // por caducidad como el resaltado de la fila en la tabla.
    diasRestantes: number | null;
    nivel: NivelCaducidad | null;
}

export interface TotalesExistencias {
    totalLotes: number;
    totalCajas: number;
    totalKilosDisponibles: number;
    totalPesos: number;
    lotesSinCosto: number;
}

export function formatearDinero(valor: number): string {
    return valor.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Existencias es una foto del inventario disponible ahora mismo, no el kardex
 * histórico completo. El filtrado de lotes con existencia y el cálculo de lo
 * vendido los hace el backend (`inventario/existencias/`): aquí solo se derivan
 * los campos de presentación.
 */
export function construirFilas(existencias: ExistenciaApi[]): FilaExistencia[] {
    return existencias.map((item) => {
        const kilosDisponibles = Number(item.kilos_disponibles);
        const diasRestantes = item.fecha_caducidad ? diasRestantesHasta(item.fecha_caducidad) : null;
        return {
            detalleId: item.detalle_id,
            fecha: item.fecha,
            camaraId: item.camara_id,
            camaraNombre: item.camara_nombre,
            proveedorNombre: item.proveedor_nombre,
            talla: item.talla,
            tipo: item.tipo,
            loteProveedor: item.lote_proveedor,
            reciboIngreso: item.recibo_ingreso,
            factura: item.factura,
            pesoPorCaja: item.peso_por_caja,
            cajasDisponibles: item.cajas_disponibles,
            totalKilos: item.total_kilos,
            kilosVendidos: Number(item.kilos_vendidos),
            kilosDisponibles: item.kilos_disponibles,
            costoPorKilo: item.costo_por_kilo,
            totalPesos: item.costo_por_kilo !== null ? kilosDisponibles * Number(item.costo_por_kilo) : null,
            fechaCaducidad: item.fecha_caducidad,
            diasRestantes,
            nivel: diasRestantes !== null ? clasificarNivelCaducidad(diasRestantes) : null,
        };
    });
}

export function calcularTotales(filas: FilaExistencia[]): TotalesExistencias {
    return {
        totalLotes: filas.length,
        totalCajas: filas.reduce((acc, f) => acc + f.cajasDisponibles, 0),
        totalKilosDisponibles: filas.reduce((acc, f) => acc + Number(f.kilosDisponibles), 0),
        totalPesos: filas.reduce((acc, f) => acc + (f.totalPesos ?? 0), 0),
        lotesSinCosto: filas.filter((f) => f.totalPesos === null).length,
    };
}
