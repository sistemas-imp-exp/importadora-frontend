import type { ReactNode } from "react";
import type { CorteCaja } from "../../interfaces/movimientos/CorteCaja";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import { getFullName } from "../../../../shared/utils/userUtils";

interface Props {
    corte: CorteCaja | null;
    /** Botones/enlaces de acción, mostrados solo cuando hay un corte abierto. */
    acciones?: ReactNode;
    /** Contenido a mostrar cuando no hay corte abierto. Si se omite, no se renderiza nada. */
    sinCorte?: ReactNode;
}

function CorteEstadoCallout({ corte, acciones, sinCorte }: Props) {
    if (!corte) {
        if (!sinCorte) return null;
        return <div className="callout callout-warning mb-3 shadow-sm">{sinCorte}</div>;
    }

    return (
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-3 py-2 mb-3 rounded-2 border-start border-success border-4 bg-success-subtle shadow-sm">
            <div className="d-flex flex-wrap align-items-center gap-2" style={{ fontSize: "0.9rem" }}>
                <span className="badge bg-success px-2 py-1">Abierto</span>
                <span className="fw-semibold">{formatearFechaNumerica(corte.fecha)}</span>
                <span className="text-muted">·</span>
                <span className="text-muted">{getFullName(corte.responsable_apertura)}</span>
            </div>
            {acciones && <div className="d-flex flex-wrap gap-2">{acciones}</div>}
        </div>
    );
}

export default CorteEstadoCallout;
