interface AvisoSoloLecturaProps {
    /** Nombre del área para el mensaje, p. ej. "Inventario". */
    area: string;
}

/**
 * Aviso para quien tiene un área en solo lectura: explica por qué no ve los
 * botones de registrar/editar. El backend es quien realmente lo impide.
 */
function AvisoSoloLectura({ area }: AvisoSoloLecturaProps) {
    return (
        <div className="alert alert-light border d-flex align-items-center gap-2 py-2 small" role="status">
            <i className="bi bi-eye text-body-secondary" aria-hidden="true"></i>
            <span>
                Tu acceso a <strong>{area}</strong> es de <strong>solo lectura</strong>: puedes consultar y descargar,
                pero no registrar, editar ni eliminar.
            </span>
        </div>
    );
}

export default AvisoSoloLectura;
