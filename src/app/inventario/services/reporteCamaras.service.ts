import api from "../../../shared/api/client";
import { descargarBlob } from "../../../shared/utils/descargarArchivo";
import type { FiltrosReporteCamaras, ReporteCamarasApi } from "../interfaces/reportes/ReporteCamaras";

const URL = "inventario/reportes/existencias-camara/";

function parametros(filtros: FiltrosReporteCamaras): URLSearchParams {
    const params = new URLSearchParams();
    if (filtros.fecha) params.set("fecha", filtros.fecha);
    if (filtros.camaraId) params.set("camara", filtros.camaraId);
    if (filtros.empresaId) params.set("empresa", filtros.empresaId);
    return params;
}

export async function obtenerReporteCamaras(filtros: FiltrosReporteCamaras): Promise<ReporteCamarasApi> {
    const { data } = await api.get<ReporteCamarasApi>(URL, { params: parametros(filtros) });
    return data;
}

export async function descargarReporteCamarasPdf(filtros: FiltrosReporteCamaras): Promise<void> {
    await descargarBlob(`${URL}pdf/`, "application/pdf", "existencias-por-camara.pdf", parametros(filtros));
}

export async function descargarReporteCamarasExcel(filtros: FiltrosReporteCamaras): Promise<void> {
    await descargarBlob(
        `${URL}excel/`,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "existencias-por-camara.xlsx",
        parametros(filtros)
    );
}
