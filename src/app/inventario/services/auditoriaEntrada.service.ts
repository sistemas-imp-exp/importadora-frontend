import api from "../../../shared/api/client";
import type {
    EdicionesEntradaResponse,
    EditarEntradaAuditadaRequest,
    EditarEntradaAuditadaResponse,
} from "../interfaces/auditoria/EdicionEntrada";

const URL = "inventario/auditoria/entradas/";

export async function obtenerEdicionesEntrada(entradaId?: number): Promise<EdicionesEntradaResponse> {
    const params = new URLSearchParams();
    if (entradaId) params.set("entrada", String(entradaId));

    const { data } = await api.get<EdicionesEntradaResponse>(URL, { params });
    return data;
}

export async function editarEntradaAuditada(
    entradaId: number,
    payload: EditarEntradaAuditadaRequest
): Promise<EditarEntradaAuditadaResponse> {
    const { data } = await api.patch<EditarEntradaAuditadaResponse>(`${URL}${entradaId}/`, payload);
    return data;
}
