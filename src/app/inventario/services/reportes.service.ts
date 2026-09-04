import { descargarBlob } from "../../../shared/utils/descargarArchivo";
import type { FiltrosExistencias } from "../hooks/useExistenciasFiltros";

const URL_PDF = "inventario/reportes/existencias/pdf/";

/**
 * Descarga el PDF de existencias con los mismos filtros que hay en pantalla.
 * El backend vuelve a consultar y a filtrar (no recibe las filas ya cargadas),
 * así que los nombres de los parámetros tienen que coincidir con los que lee
 * obtener_lotes_filtrados() en inventario/reportes.py.
 */
export async function descargarExistenciasPdf(
    filtros: FiltrosExistencias,
    busqueda: string
): Promise<void> {
    const params = new URLSearchParams();
    // "lote" es el modo detallado, el que corresponde a la tabla en pantalla;
    // "producto" arma un pivote talla/tipo x proveedor.
    params.set("modo", "lote");
    if (filtros.camaraId) params.set("camara", filtros.camaraId);
    if (filtros.proveedor) params.set("proveedor", filtros.proveedor);
    if (filtros.talla) params.set("talla", filtros.talla);
    if (filtros.tipo) params.set("tipo", filtros.tipo);
    if (filtros.nivel) params.set("nivel", filtros.nivel);
    if (busqueda.trim()) params.set("busqueda", busqueda.trim());

    await descargarBlob(URL_PDF, "application/pdf", "existencias.pdf", params);
}
