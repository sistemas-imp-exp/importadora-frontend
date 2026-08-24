import api from "../../../shared/api/client";
import type { Empresa } from "../interfaces/empresas/Empresa";

const URL = "inventario/empresas/";

export async function obtenerEmpresas(): Promise<Empresa[]> {
    const { data } = await api.get<Empresa[]>(URL);
    return data;
}

export async function crearEmpresa(empresa: Empresa): Promise<Empresa> {
    const { data } = await api.post<Empresa>(URL, empresa);
    return data;
}

export async function actualizarEmpresa(empresa: Empresa): Promise<Empresa> {
    const { data } = await api.put<Empresa>(`${URL}${empresa.id}/`, empresa);
    return data;
}
