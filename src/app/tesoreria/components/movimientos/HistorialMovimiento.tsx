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
    return texto ? <span>«{texto}»</span> : <span className="fst-italic text-body-secondary">vacío</span>;
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
        <ul className="list-unstyled mb-0" style={{ fontSize: "0.88rem" }}>
            {eventos.map((evento, indice) => (
                <li key={indice} className={`d-flex gap-2 ${indice < eventos.length - 1 ? "pb-3 mb-3 border-bottom" : ""}`}>
                    <i className={`bi ${ICONOS[evento.tipo]} mt-1`} aria-hidden="true"></i>
                    <div className="flex-grow-1">
                        <div>
                            <span className="fw-semibold">{titulo(evento)}</span>
                            <span className="text-body-secondary">
                                {" "}· {formatearFechaNumerica(new Date(evento.fecha), "numerico-hora")}
                                {evento.usuario && <> · {getFullName(evento.usuario)}</>}
                            </span>
                        </div>
                        {evento.tipo === "edicion" && evento.cambios.length > 0 && (
                            <ul className="list-unstyled ms-1 mt-1 mb-0">
                                {evento.cambios.map((cambio, i) => (
                                    <li key={i}>
                                        <span className="text-body-secondary">{cambio.campo}:</span>{" "}
                                        {valor(cambio.antes)} <i className="bi bi-arrow-right mx-1" aria-label="cambió a"></i> {valor(cambio.despues)}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {evento.tipo === "cancelacion" && evento.motivo && (
                            <div className="text-body-secondary mt-1">"{evento.motivo}"</div>
                        )}
                    </div>
                </li>
            ))}
        </ul>
    );
}

export default HistorialMovimiento;
