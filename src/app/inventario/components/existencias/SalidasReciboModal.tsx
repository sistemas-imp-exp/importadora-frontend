import { useEffect, useState } from "react";
import Modal from "../../../../shared/components/Modal";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import TablaResponsive from "../../../../shared/components/TablaResponsive";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import { formatearKg } from "../../../../shared/utils/numeros";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { obtenerSalidasDeRecibo, type SalidaDeRecibo } from "../../services/salida.service";

interface SalidasReciboModalProps {
    recibo: string;
    onCerrar: () => void;
}

/** Salidas que ha tenido un recibo de ingreso, una fila por línea (se abre desde Existencias). */
function SalidasReciboModal({ recibo, onCerrar }: SalidasReciboModalProps) {
    const [lineas, setLineas] = useState<SalidaDeRecibo[] | null>(null);
    const [totalKilos, setTotalKilos] = useState("0");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        obtenerSalidasDeRecibo(recibo)
            .then((datos) => {
                setLineas(datos.lineas);
                setTotalKilos(datos.total_kilos);
            })
            .catch((e) => setError(obtenerMensajeError(e)));
    }, [recibo]);

    return (
        <Modal title={`Salidas del recibo ${recibo}`} show onClose={onCerrar} size="modal-xl">
            {error ? (
                <div className="alert alert-danger mb-0">{error}</div>
            ) : lineas === null ? (
                <SkeletonTable columnas={8} filas={4} />
            ) : lineas.length === 0 ? (
                <p className="text-center text-body-secondary py-4 mb-0">
                    <i className="bi bi-inbox fs-3 d-block mb-2" aria-hidden="true"></i>
                    Este recibo no ha tenido salidas.
                </p>
            ) : (
                <TablaResponsive alturaMaxima="60vh">
                    <table className="table tabla-datos tabla-excel">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Folio de salida</th>
                                <th>Cliente</th>
                                <th>Talla</th>
                                <th>Tipo</th>
                                <th>Cámara</th>
                                <th>Notas</th>
                                <th className="num">Cajas</th>
                                <th className="num">Kilos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lineas.map((l) => (
                                <tr key={l.id}>
                                    <td className="text-nowrap">{formatearFechaNumerica(new Date(l.fecha + "T00:00:00"))}</td>
                                    <td className="text-nowrap fw-semibold">
                                        {l.folio_de_salida ?? "Sin salida"}
                                        {l.folio_retiro && (
                                            <span className="badge border bg-info-subtle text-info-emphasis border-info-subtle fw-normal ms-1"
                                                title="Entrega de un resguardo">
                                                {l.folio_retiro}
                                            </span>
                                        )}
                                    </td>
                                    <td className="truncar" title={l.cliente ?? undefined}>
                                        {l.cliente ?? <span className="text-body-secondary">Traslado a otra cámara</span>}
                                    </td>
                                    <td className="text-nowrap">{l.talla}</td>
                                    <td className="text-nowrap">{l.tipo}</td>
                                    <td className="text-nowrap">{l.camara || "—"}</td>
                                    <td className="truncar" title={l.notas || undefined}>{l.notas}</td>
                                    <td className="num">{l.cajas.toLocaleString("es-MX")}</td>
                                    <td className="num">{formatearKg(l.total_kilos)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={7} className="fw-bold">Total ({lineas.length} líneas)</td>
                                <td className="num fw-bold">{lineas.reduce((s, l) => s + l.cajas, 0).toLocaleString("es-MX")}</td>
                                <td className="num fw-bold">{formatearKg(totalKilos)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </TablaResponsive>
            )}
        </Modal>
    );
}

export default SalidasReciboModal;
