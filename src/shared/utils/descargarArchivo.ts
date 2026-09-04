import api from "../api/client";

function extraerNombreArchivo(contentDisposition: unknown): string | null {
    if (typeof contentDisposition !== "string") return null;
    const coincidencia = contentDisposition.match(/filename="?([^"]+)"?/);
    return coincidencia ? coincidencia[1] : null;
}

/**
 * Con responseType "blob", un error del servidor (400/500) también llega como
 * Blob en vez de JSON. Se lee a mano para que obtenerMensajeError() pueda
 * extraer el mensaje real igual que con cualquier otro error de API.
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

/**
 * Descarga una respuesta binaria del API y dispara el "Guardar como" del
 * navegador. El nombre sale del Content-Disposition que manda el backend
 * (por eso settings expone ese header en CORS); nombrePorDefecto es el
 * respaldo si no viniera.
 *
 * Los servicios de Tesorería tienen tres copias de esta misma función; se
 * pueden migrar aquí cuando se toquen.
 */
export async function descargarBlob(
    ruta: string,
    tipoContenido: string,
    nombrePorDefecto: string,
    params?: URLSearchParams
): Promise<void> {
    let respuesta;
    try {
        respuesta = await api.get(ruta, { params, responseType: "blob" });
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
