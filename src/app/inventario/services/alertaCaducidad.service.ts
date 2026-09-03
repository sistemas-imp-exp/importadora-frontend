import api from "../../../shared/api/client";
import type { AlertasCaducidadResponse, FiltrosAlertasCaducidad } from "../interfaces/alertas/AlertaCaducidad";

const URL = "inventario/alertas/caducidad/";

export async function obtenerAlertasCaducidad(filtros: FiltrosAlertasCaducidad): Promise<AlertasCaducidadResponse> {
    const params = new URLSearchParams();
    if (filtros.camaraId !== "") params.set("camara", String(filtros.camaraId));
    if (filtros.nivel !== "") params.set("nivel", filtros.nivel);

    const { data } = await api.get<AlertasCaducidadResponse>(URL, { params });
    return data;
}
