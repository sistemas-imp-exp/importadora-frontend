interface BotonAccionFilaProps {
    icono: string;
    etiqueta: string;
    onClick: () => void;
    variante?: "secondary" | "danger";
    /** Si viene, el botón queda deshabilitado y el tooltip explica el motivo. */
    motivoBloqueo?: string | null;
}

/**
 * Botón de ícono para la columna de acciones. Un botón deshabilitado no
 * dispara eventos de mouse (Bootstrap le pone pointer-events: none), así que
 * su `title` nunca se veía: el tooltip va en un span envolvente para que el
 * usuario sepa por qué no puede usarlo.
 */
function BotonAccionFila({ icono, etiqueta, onClick, variante = "secondary", motivoBloqueo }: BotonAccionFilaProps) {
    return (
        <span className="d-inline-block" title={motivoBloqueo ?? etiqueta}>
            <button
                className={`btn btn-sm btn-outline-${variante}`}
                type="button"
                disabled={!!motivoBloqueo}
                onClick={onClick}
            >
                <i className={`bi ${icono}`} aria-hidden="true"></i>
                <span className="visually-hidden">{etiqueta}</span>
            </button>
        </span>
    );
}

export default BotonAccionFila;
