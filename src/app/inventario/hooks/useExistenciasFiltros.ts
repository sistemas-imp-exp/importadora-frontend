import { useMemo, useState } from "react";
import type { ExistenciaApi } from "../interfaces/existencias/Existencia";
import type { OpcionFiltro } from "../../../shared/components/FiltroChip";
import { calcularTotales, construirFilas, type FilaExistencia } from "../utils/existencias";
import { ETIQUETA_NIVEL, type NivelCaducidad } from "../utils/caducidad";

export interface FiltrosExistencias {
    camaraId: string;
    proveedor: string;
    nivel: string;
    talla: string;
    tipo: string;
}

const SIN_FILTROS: FiltrosExistencias = { camaraId: "", proveedor: "", nivel: "", talla: "", tipo: "" };

const VALOR_SIN_CADUCIDAD = "sin_caducidad";

const OPCIONES_NIVEL: OpcionFiltro[] = [
    ...(["vencido", "critico", "urgente", "por_vencer"] as NivelCaducidad[]).map((nivel) => ({
        value: nivel,
        label: ETIQUETA_NIVEL[nivel],
    })),
    { value: VALOR_SIN_CADUCIDAD, label: "Sin caducidad" },
];

/** Valores únicos de una columna, ordenados alfabéticamente. */
function opcionesDe(filas: FilaExistencia[], obtener: (fila: FilaExistencia) => string): OpcionFiltro[] {
    const valores = new Set<string>();
    for (const fila of filas) valores.add(obtener(fila));
    return Array.from(valores)
        .sort((a, b) => a.localeCompare(b))
        .map((valor) => ({ value: valor, label: valor }));
}

/**
 * Estado y derivados de la pantalla de Existencias. Vive en la vista (no en la
 * tabla) porque tanto las tarjetas de totales como la barra de filtros están
 * fuera del card de la tabla y necesitan los mismos datos.
 */
export function useExistenciasFiltros(existencias: ExistenciaApi[]) {
    const [busqueda, setBusqueda] = useState("");
    const [filtros, setFiltros] = useState<FiltrosExistencias>(SIN_FILTROS);

    const filas = useMemo(() => construirFilas(existencias), [existencias]);

    // Las opciones salen de las filas con existencia, no del catálogo completo:
    // así ningún chip ofrece un valor que daría cero resultados.
    const opciones = useMemo(() => {
        const porCamara = new Map<string, string>();
        for (const fila of filas) {
            porCamara.set(String(fila.camaraId ?? ""), fila.camaraNombre);
        }
        return {
            camaras: Array.from(porCamara, ([value, label]) => ({ value, label })).sort((a, b) =>
                a.label.localeCompare(b.label)
            ),
            proveedores: opcionesDe(filas, (f) => f.proveedorNombre),
            tallas: opcionesDe(filas, (f) => f.talla),
            tipos: opcionesDe(filas, (f) => f.tipo),
            niveles: OPCIONES_NIVEL,
        };
    }, [filas]);

    const filtradas = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();
        return filas.filter((fila) => {
            if (filtros.camaraId !== "" && String(fila.camaraId ?? "") !== filtros.camaraId) return false;
            if (filtros.proveedor && fila.proveedorNombre !== filtros.proveedor) return false;
            if (filtros.talla && fila.talla !== filtros.talla) return false;
            if (filtros.tipo && fila.tipo !== filtros.tipo) return false;
            if (filtros.nivel) {
                if (filtros.nivel === VALOR_SIN_CADUCIDAD) {
                    if (fila.fechaCaducidad !== null) return false;
                } else if (fila.nivel !== filtros.nivel) {
                    return false;
                }
            }
            if (!termino) return true;
            return (
                fila.talla.toLowerCase().includes(termino) ||
                fila.tipo.toLowerCase().includes(termino) ||
                fila.loteProveedor.toLowerCase().includes(termino) ||
                fila.factura.toLowerCase().includes(termino) ||
                fila.reciboIngreso.toLowerCase().includes(termino)
            );
        });
    }, [filas, busqueda, filtros]);

    const totales = useMemo(() => calcularTotales(filtradas), [filtradas]);

    const hayFiltros = busqueda.trim() !== "" || Object.values(filtros).some((v) => v !== "");

    function setFiltro(clave: keyof FiltrosExistencias, valor: string) {
        setFiltros((actuales) => ({ ...actuales, [clave]: valor }));
    }

    function limpiarFiltros() {
        setFiltros(SIN_FILTROS);
        setBusqueda("");
    }

    return {
        busqueda,
        setBusqueda,
        filtros,
        setFiltro,
        limpiarFiltros,
        hayFiltros,
        opciones,
        filas,
        filtradas,
        totales,
    };
}
