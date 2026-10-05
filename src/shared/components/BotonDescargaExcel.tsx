import { useState } from "react";
import { useToastContext } from "../context/ToastProvider";
import { obtenerMensajeError } from "../utils/apiError";

interface BotonDescargaExcelProps {
    onDescargar: () => Promise<void>;
    titulo: string;
    disabled?: boolean;
}

/** Botón "Excel" de las barras de tabla: muestra el avance y avisa si falla. */
function BotonDescargaExcel({ onDescargar, titulo, disabled }: BotonDescargaExcelProps) {
    const { mostrarToast } = useToastContext();
    const [descargando, setDescargando] = useState(false);

    async function descargar() {
        setDescargando(true);
        try {
            await onDescargar();
        } catch (err) {
            mostrarToast("Error al exportar", obtenerMensajeError(err), "danger");
        } finally {
            setDescargando(false);
        }
    }

    return (
        <button
            className="btn btn-outline-success btn-sm"
            type="button"
            onClick={descargar}
            disabled={disabled || descargando}
            title={titulo}
        >
            {descargando ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
                <i className="bi bi-file-earmark-excel" aria-hidden="true"></i>
            )}
            <span className="ms-1">Excel</span>
        </button>
    );
}

export default BotonDescargaExcel;
