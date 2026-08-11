import api from "../../../shared/api/client";
import type { ArqueoCaja, CrearArqueoRequest, Denominacion } from "../interfaces/arqueo/Arqueo";

const URL = "treasury/arqueos/";
const URL_DENOMINACIONES = "treasury/denominaciones/";

export async function obtenerDenominaciones(): Promise<Denominacion[]> {
    // El backend ya no filtra por activa por defecto (el admin de denominaciones
    // necesita ver también las inactivas), así que aquí se pide explícito.
    const { data } = await api.get<Denominacion[]>(URL_DENOMINACIONES, {
        params: { activa: true },
    });
    return data;
}

export async function obtenerArqueos(corteId?: number): Promise<ArqueoCaja[]> {
    const { data } = await api.get<ArqueoCaja[]>(URL, {
        params: corteId ? { corte: corteId } : undefined,
    });
    return data;
}

export async function obtenerArqueo(id: number): Promise<ArqueoCaja> {
    const { data } = await api.get<ArqueoCaja>(`${URL}${id}/`);
    return data;
}

export async function crearArqueo(payload: CrearArqueoRequest): Promise<ArqueoCaja> {
    const { data } = await api.post<ArqueoCaja>(URL, payload);
    return data;
}

export async function actualizarArqueo(id: number, payload: CrearArqueoRequest): Promise<ArqueoCaja> {
    const { data } = await api.put<ArqueoCaja>(`${URL}${id}/`, payload);
    return data;
}

const URL_REPORTES = "treasury/reportes/arqueo/";

function extraerNombreArchivo(contentDisposition: unknown): string | null {
    if (typeof contentDisposition !== "string") return null;
    const coincidencia = contentDisposition.match(/filename="?([^"]+)"?/);
    return coincidencia ? coincidencia[1] : null;
}

async function descargarBlob(ruta: string, tipoContenido: string, nombrePorDefecto: string): Promise<void> {
    let respuesta;
    try {
        respuesta = await api.get(ruta, { responseType: "blob" });
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

export async function descargarArqueoExcel(id: number): Promise<void> {
    await descargarBlob(
        `${URL_REPORTES}${id}/excel/`,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        `arqueo-${id}.xlsx`
    );
}

export async function descargarArqueoPdf(id: number): Promise<void> {
    await descargarBlob(`${URL_REPORTES}${id}/pdf/`, "application/pdf", `arqueo-${id}.pdf`);
}

/**
 * Con responseType "blob", un error del servidor también llega como Blob
 * en vez de JSON; se lee a mano para que obtenerMensajeError() funcione igual.
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
