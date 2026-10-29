import { useEffect, useState } from "react";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import type { ClienteCartera, EmpresaCartera } from "../interfaces/Cartera";
import { obtenerClientes, obtenerEmpresas } from "../services/cartera.service";

/** Clientes y empresas para los formularios de pagos y ajustes. */
export function useCatalogosCartera(onError: (mensaje: string) => void) {
    const [clientes, setClientes] = useState<ClienteCartera[]>([]);
    const [empresas, setEmpresas] = useState<EmpresaCartera[]>([]);

    useEffect(() => {
        Promise.all([obtenerClientes(), obtenerEmpresas()])
            .then(([datosClientes, datosEmpresas]) => {
                setClientes(datosClientes);
                setEmpresas(datosEmpresas);
            })
            .catch((err) => onError(obtenerMensajeError(err)));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { clientes, empresas };
}
