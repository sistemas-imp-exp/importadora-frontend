import client from "../api/client";
import type {
    ActualizarPerfilRequest,
    CambiarPasswordRequest,
    LoginRequest,
    SesionResponse,
    User,
} from "../interfaces/auth";


export const login = async (
    data: LoginRequest
): Promise<SesionResponse> => {
    const response = await client.post<SesionResponse>(
        "/auth/login/",
        data
    );

    return response.data;
};

export async function me(): Promise<User> {
    const response = await client.get<User>("/auth/me/");
    return response.data;
}

export async function actualizarMe(data: ActualizarPerfilRequest): Promise<User> {
    const response = await client.patch<User>("/auth/me/", data);
    return response.data;
}

/** Cierra las sesiones en otros equipos y devuelve tokens nuevos para esta. */
export async function cambiarPassword(data: CambiarPasswordRequest): Promise<SesionResponse> {
    const response = await client.post<SesionResponse>("/auth/me/password/", data);
    return response.data;
}

export async function subirFoto(archivo: File): Promise<{ foto: string | null }> {
    const formData = new FormData();
    formData.append("foto", archivo);

    const response = await client.post<{ foto: string | null }>(
        "/auth/me/foto/",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
    );

    return response.data;
}

export async function eliminarFoto(): Promise<void> {
    await client.delete("/auth/me/foto/");
}