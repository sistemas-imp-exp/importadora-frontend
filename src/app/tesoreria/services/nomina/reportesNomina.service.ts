import api from "../../../../shared/api/client";
import type { FiltrosReporteNomina, ResumenReporteNominaApi } from "../../interfaces/nomina/ReporteNomina";

const URL = "treasury/reportes/nomina/";

function construirParams(filtros: FiltrosReporteNomina): URLSearchParams {
    const params = new URLSearchParams();
    params.set("fecha_inicio", filtros.fechaInicio);
    params.set("fecha_fin", filtros.fechaFin);

    for (const id of filtros.ranchoIds) {
        params.append("rancho", String(id));
    }

    for (const id of filtros.bancoIds) {
        params.append("banco", String(id));
    }

    return params;
}

export async function obtenerResumenNomina(filtros: FiltrosReporteNomina): Promise<ResumenReporteNominaApi> {
    const { data } = await api.get<ResumenReporteNominaApi>(URL, {
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
    filtros: FiltrosReporteNomina,
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

export async function descargarReporteNominaExcel(filtros: FiltrosReporteNomina): Promise<void> {
    await descargarBlob(
        `${URL}excel/`,
        filtros,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "reporte-nomina.xlsx"
    );
}

export async function descargarReporteNominaPdf(filtros: FiltrosReporteNomina): Promise<void> {
    await descargarBlob(`${URL}pdf/`, filtros, "application/pdf", "reporte-nomina.pdf");
}

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
