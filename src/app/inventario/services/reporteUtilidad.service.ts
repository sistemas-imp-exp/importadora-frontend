import api from "../../../shared/api/client";
import { descargarBlob } from "../../../shared/utils/descargarArchivo";
import type { FiltrosReporteUtilidad, ReporteUtilidadApi } from "../interfaces/reportes/ReporteUtilidad";

const URL = "inventario/reportes/utilidad/";

function parametros(filtros: FiltrosReporteUtilidad): URLSearchParams {
    const params = new URLSearchParams({ desde: filtros.desde, hasta: filtros.hasta, agrupar: filtros.agrupar });
    if (filtros.empresaId) params.set("empresa", filtros.empresaId);
    if (filtros.clienteId) params.set("cliente", filtros.clienteId);
    if (filtros.proveedorId) params.set("proveedor", filtros.proveedorId);
    if (filtros.productoId) params.set("producto", filtros.productoId);
    if (filtros.camaraId) params.set("camara", filtros.camaraId);
    return params;
}

export async function obtenerReporteUtilidad(filtros: FiltrosReporteUtilidad): Promise<ReporteUtilidadApi> {
    const { data } = await api.get<ReporteUtilidadApi>(URL, { params: parametros(filtros) });
    return data;
}

export async function descargarReporteUtilidad(filtros: FiltrosReporteUtilidad, formato: "excel" | "pdf"): Promise<void> {
    const excel = formato === "excel";
    await descargarBlob(
        `${URL}${excel ? "excel" : "pdf"}/`,
        excel ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "application/pdf",
        `utilidad-${filtros.desde}-a-${filtros.hasta}.${excel ? "xlsx" : "pdf"}`,
        parametros(filtros)
    );
}
