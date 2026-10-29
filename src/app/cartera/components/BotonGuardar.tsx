interface Props {
    guardando: boolean;
    texto: string;
    icono?: string;
}

/** Botón submit de los formularios de Cartera, con spinner mientras guarda. */
function BotonGuardar({ guardando, texto, icono = "bi-save" }: Props) {
    return (
        <button type="submit" className="btn btn-primary" disabled={guardando}>
            {guardando ? (
                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
            ) : (
                <i className={`bi ${icono} me-1`} aria-hidden="true"></i>
            )}
            {guardando ? "Guardando..." : texto}
        </button>
    );
}

export default BotonGuardar;
