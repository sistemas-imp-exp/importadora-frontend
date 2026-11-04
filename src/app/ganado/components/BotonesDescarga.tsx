import { useState } from "react";
import { useToastContext } from "../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../shared/utils/apiError";

interface Props {
    onDescargar: (formato: "pdf" | "excel") => Promise<void>;
    disabled?: boolean;
}

/** PDF y Excel de los reportes de Ganado, con los mismos filtros que la pantalla. */
function BotonesDescarga({ onDescargar, disabled }: Props) {
    const { mostrarToast } = useToastContext();
    const [descargando, setDescargando] = useState<"pdf" | "excel" | null>(null);

    async function descargar(formato: "pdf" | "excel") {
        setDescargando(formato);
        try {
            await onDescargar(formato);
        } catch (err) {
            mostrarToast("Error al descargar", obtenerMensajeError(err), "danger");
        } finally {
            setDescargando(null);
        }
    }

    return (
        <div className="d-flex gap-2">
            {(["pdf", "excel"] as const).map((formato) => (
                <button key={formato} type="button" disabled={disabled || descargando !== null} onClick={() => descargar(formato)}
                    className={`btn btn-sm ${formato === "pdf" ? "btn-outline-danger" : "btn-outline-success"}`}>
                    {descargando === formato
                        ? <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        : <i className={`bi ${formato === "pdf" ? "bi-file-earmark-pdf" : "bi-file-earmark-excel"} me-1`} aria-hidden="true"></i>}
                    {formato === "pdf" ? "PDF" : "Excel"}
                </button>
            ))}
        </div>
    );
}

export default BotonesDescarga;
