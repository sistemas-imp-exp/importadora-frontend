import { useEffect, useState } from "react";
import Modal from "../../../shared/components/Modal";
import { formatearPrecioKg } from "../../../shared/utils/numeros";
import { formatearFechaNumerica } from "../../../shared/utils/fechas";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import { obtenerHistorialCosto, type FilaUtilidad } from "../services/cartera.service";

type Cambio = Awaited<ReturnType<typeof obtenerHistorialCosto>>[number];

function costo(valor: string | null): string {
    return valor === null ? "Propuesto del lote" : formatearPrecioKg(valor);
}

/** Quién cambió el costo de una venta, cuándo, y de cuánto a cuánto. */
function HistorialCostoModal({ fila, onCerrar }: { fila: FilaUtilidad; onCerrar: () => void }) {
    const [cambios, setCambios] = useState<Cambio[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let vigente = true;
        obtenerHistorialCosto(fila.linea_id)
            .then((datos) => vigente && setCambios(datos))
            .catch((e) => vigente && setError(obtenerMensajeError(e)));
        return () => { vigente = false; };
    }, [fila.linea_id]);

    return (
        <Modal show onClose={onCerrar} title={`Costo · ${fila.producto} · nota ${fila.nota}`}>
            {error && <div className="text-danger small">{error}</div>}
            {cambios && cambios.length === 0 && (
                <div className="small text-body-secondary">Sin cambios: se usa el costo propuesto del lote.</div>
            )}
            {cambios && cambios.length > 0 && (
                <table className="table table-sm mb-0">
                    <thead>
                        <tr className="small text-uppercase text-body-secondary">
                            <th>Fecha</th>
                            <th>Antes</th>
                            <th>Después</th>
                            <th>Usuario</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cambios.map((c, i) => (
                            <tr key={i}>
                                <td className="small text-nowrap">{formatearFechaNumerica(new Date(c.fecha), "numerico-hora")}</td>
                                <td>{costo(c.anterior)}</td>
                                <td className="fw-semibold">{costo(c.nuevo)}</td>
                                <td className="small">{c.usuario}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </Modal>
    );
}

export default HistorialCostoModal;
