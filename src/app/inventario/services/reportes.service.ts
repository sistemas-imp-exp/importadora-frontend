import { descargarBlob } from "../../../shared/utils/descargarArchivo";
import type { FiltrosExistencias } from "../hooks/useExistenciasFiltros";

const URL_PDF = "inventario/reportes/existencias/pdf/";
const URL_EXCEL = "inventario/reportes/existencias/excel/";

/**
 * Parámetros de los reportes de existencias con los mismos filtros que hay en
 * pantalla. El backend vuelve a consultar y a filtrar (no recibe las filas ya
 * cargadas), así que los nombres tienen que coincidir con los que lee
 * obtener_lotes_filtrados() en inventario/reportes.py.
 */
function parametrosExistencias(filtros: FiltrosExistencias, busqueda: string): URLSearchParams {
    const params = new URLSearchParams();
    // "lote" es el modo detallado, el que corresponde a la tabla en pantalla;
    // "producto" arma un pivote talla/tipo x proveedor.
    params.set("modo", "lote");
    if (filtros.empresaId) params.set("empresa", filtros.empresaId);
    if (filtros.camaraId) params.set("camara", filtros.camaraId);
    if (filtros.proveedor) params.set("proveedor", filtros.proveedor);
    if (filtros.talla) params.set("talla", filtros.talla);
    if (filtros.tipo) params.set("tipo", filtros.tipo);
    if (filtros.nivel) params.set("nivel", filtros.nivel);
    if (busqueda.trim()) params.set("busqueda", busqueda.trim());
    return params;
}

export async function descargarExistenciasPdf(filtros: FiltrosExistencias, busqueda: string): Promise<void> {
    await descargarBlob(URL_PDF, "application/pdf", "existencias.pdf", parametrosExistencias(filtros, busqueda));
}

export async function descargarExistenciasExcel(filtros: FiltrosExistencias, busqueda: string): Promise<void> {
    await descargarBlob(
        URL_EXCEL,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "existencias.xlsx",
        parametrosExistencias(filtros, busqueda)
    );
}
