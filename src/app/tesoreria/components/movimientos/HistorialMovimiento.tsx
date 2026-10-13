import { useEffect, useState } from "react";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import { getFullName } from "../../../../shared/utils/userUtils";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import type { EventoHistorial } from "../../interfaces/movimientos/Movimiento";
import { obtenerHistorialMovimiento } from "../../services/movimientos.service";

interface Props {
    movimientoId: number;
}

const ICONOS: Record<EventoHistorial["tipo"], string> = {
    registro: "bi-plus-circle text-success",
    edicion: "bi-pencil-square text-warning",
    cancelacion: "bi-x-circle text-danger",
    adjunto: "bi-paperclip text-primary",
    adjunto_quitado: "bi-paperclip text-secondary",
};

function titulo(evento: EventoHistorial): string {
    switch (evento.tipo) {
        case "registro":
            return "Registrado";
        case "edicion":
            return evento.cambios.length === 0 ? "Edición sin detalle (anterior al historial)" : "Editado";
        case "cancelacion":
            return "Cancelado";
        case "adjunto":
            return `Adjuntó «${evento.archivo}»`;
        case "adjunto_quitado":
            return `Quitó el adjunto «${evento.archivo}»`;
    }
}

function valor(texto: string) {
    return texto || <span className="fst-italic">vacío</span>;
}

/** Línea de tiempo del movimiento: registro, ediciones con lo que cambió, adjuntos y cancelación. */
function HistorialMovimiento({ movimientoId }: Props) {
    const [eventos, setEventos] = useState<EventoHistorial[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let vigente = true;
        obtenerHistorialMovimiento(movimientoId)
            .then((datos) => vigente && setEventos(datos))
            .catch((err) => vigente && setError(obtenerMensajeError(err)));
        return () => {
            vigente = false;
        };
    }, [movimientoId]);

    if (error) return <div className="alert alert-danger py-2 mb-0">{error}</div>;
    if (!eventos) return <p className="text-body-secondary mb-0">Cargando historial...</p>;

    return (
        <ol className="linea-tiempo">
            {eventos.map((evento, indice) => (
                <li key={indice} className="linea-tiempo__evento">
                    <span className="linea-tiempo__punto" aria-hidden="true">
                        <i className={`bi ${ICONOS[evento.tipo]}`}></i>
                    </span>
                    <div className="d-flex flex-wrap justify-content-between gap-1">
                        <span className="fw-semibold">{titulo(evento)}</span>
                        <span className="text-body-secondary small text-nowrap">
                            {formatearFechaNumerica(new Date(evento.fecha), "numerico-hora")}
                        </span>
                    </div>
                    {evento.usuario && <div className="small text-body-secondary">{getFullName(evento.usuario)}</div>}
                    {evento.tipo === "edicion" && evento.cambios.length > 0 && (
                        <dl className="linea-tiempo__cambios">
                            {evento.cambios.map((cambio, i) => (
                                <div key={i}>
                                    <dt>{cambio.campo}</dt>
                                    <dd>
                                        <span className="text-decoration-line-through text-body-secondary">{valor(cambio.antes)}</span>
                                        <i className="bi bi-arrow-right mx-1 text-body-secondary" aria-label="cambió a"></i>
                                        <span className="fw-semibold">{valor(cambio.despues)}</span>
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    )}
                    {evento.tipo === "cancelacion" && evento.motivo && (
                        <div className="small mt-1">“{evento.motivo}”</div>
                    )}
                </li>
            ))}
        </ol>
    );
}

export default HistorialMovimiento;
