import api from "../../../shared/api/client";
import type { FiltrosReporteMovimientos, ResumenReporteMovimientosApi } from "../interfaces/reportes/Reporte";

const URL = "treasury/reportes/movimientos/";

function construirParams(filtros: FiltrosReporteMovimientos): URLSearchParams {
    const params = new URLSearchParams();
    params.set("fecha_inicio", filtros.fechaInicio);
    params.set("fecha_fin", filtros.fechaFin);

    if (filtros.beneficiario.trim()) {
        params.set("beneficiario", filtros.beneficiario.trim());
    }
    if (filtros.corteId) {
        params.set("corte", String(filtros.corteId));
    }
    if (filtros.tipo !== "todos") {
        params.set("tipo", filtros.tipo);
    }
    if (filtros.estado !== "todos") {
        params.set("estado", filtros.estado);
    }
    for (const id of filtros.divisaIds) {
        params.append("divisa", String(id));
    }

    return params;
}

export async function obtenerResumenMovimientos(
    filtros: FiltrosReporteMovimientos
): Promise<ResumenReporteMovimientosApi> {
    const { data } = await api.get<ResumenReporteMovimientosApi>(URL, {
        params: construirParams(filtros),
    });
    return data;
}

function extraerNombreArchivo(contentDisposition: unknown): string | null {
    if (typeof contentDisposition !== "string") return null;
    const coincidencia = contentDisposition.match(/filename="?([^"]+)"?/);
    return coincidencia ? coincidencia[1] : null;
}

async function descargarBlob(
    ruta: string,
    filtros: FiltrosReporteMovimientos,
    tipoContenido: string,
    nombrePorDefecto: string
): Promise<void> {
    let respuesta;
    try {
        respuesta = await api.get(ruta, {
            params: construirParams(filtros),
            responseType: "blob",
        });
    } catch (error) {
        throw await normalizarErrorDeBlob(error);
    }

    const blob = new Blob([respuesta.data], { type: tipoContenido });
    const url = window.URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = extraerNombreArchivo(respuesta.headers?.["content-disposition"]) ?? nombrePorDefecto;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    window.URL.revokeObjectURL(url);
}

export async function descargarReporteMovimientosExcel(filtros: FiltrosReporteMovimientos): Promise<void> {
    await descargarBlob(
        `${URL}excel/`,
        filtros,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "reporte-movimientos.xlsx"
    );
}

export async function descargarReporteMovimientosPdf(filtros: FiltrosReporteMovimientos): Promise<void> {
    await descargarBlob(`${URL}pdf/`, filtros, "application/pdf", "reporte-movimientos.pdf");
}

/**
 * Con responseType "blob", un error del servidor (400/500) también llega
 * como Blob en vez de JSON. Se lee a mano para que obtenerMensajeError()
 * pueda extraer el mensaje real igual que con cualquier otro error de API.
 */
async function normalizarErrorDeBlob(error: unknown): Promise<unknown> {
    if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data instanceof Blob
    ) {
        try {
            const texto = await error.response.data.text();
            (error.response as { data: unknown }).data = JSON.parse(texto);
        } catch {
            // Si no se puede leer/parsear, se deja el error original tal cual.
        }
    }
    return error;
}
