import api from "../../../shared/api/client";
import type { ArchivoMovimiento, ArchivoMovimientoApi } from "../interfaces/movimientos/Archivo";
import { mapArchivoApiToArchivo } from "../interfaces/movimientos/Archivo";

const URL = "treasury/archivos-movimiento/";

export async function obtenerArchivosDeMovimiento(movimientoId: number): Promise<ArchivoMovimiento[]> {
    const { data } = await api.get<ArchivoMovimientoApi[]>(URL, {
        params: { movimiento: movimientoId },
    });
    return data.map(mapArchivoApiToArchivo);
}

export async function subirArchivoDeMovimiento(
    movimientoId: number,
    archivo: File,
    onProgreso?: (porcentaje: number) => void,
    signal?: AbortSignal
): Promise<ArchivoMovimiento> {
    const formData = new FormData();
    formData.append("movimiento_id", String(movimientoId));
    formData.append("archivo", archivo);

    const { data } = await api.post<ArchivoMovimientoApi>(URL, formData, {
        // Se anula el "application/json" por defecto del cliente para que el
        // navegador ponga el boundary correcto del multipart automáticamente.
        headers: { "Content-Type": null },
        signal,
        onUploadProgress: (evento) => {
            if (onProgreso && evento.total) {
                onProgreso(Math.round((evento.loaded * 100) / evento.total));
            }
        },
    });
    return mapArchivoApiToArchivo(data);
}

export async function eliminarArchivoDeMovimiento(id: number): Promise<void> {
    await api.delete(`${URL}${id}/`);
}
