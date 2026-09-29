interface BotonExpandirProps {
    expandido: boolean;
    onClick: () => void;
    /** Qué se muestra/oculta, para el lector de pantalla y el tooltip (p. ej. "líneas de la entrada 12"). */
    etiqueta: string;
    controla?: string;
    disabled?: boolean;
}

/** Chevron que despliega el detalle de una fila (o de todas, en el encabezado). */
function BotonExpandir({ expandido, onClick, etiqueta, controla, disabled }: BotonExpandirProps) {
    const texto = `${expandido ? "Ocultar" : "Ver"} ${etiqueta}`;
    return (
        <button
            type="button"
            className="btn btn-link btn-sm btn-expandir text-body-secondary"
            onClick={onClick}
            aria-expanded={expandido}
            aria-controls={controla}
            title={texto}
            disabled={disabled}
        >
            <i className="bi bi-chevron-right" aria-hidden="true"></i>
            <span className="visually-hidden">{texto}</span>
        </button>
    );
}

export default BotonExpandir;
