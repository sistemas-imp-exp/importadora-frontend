import { useState } from "react";
import Modal from "../../../../shared/components/Modal";
import { useToastContext } from "../../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import type { MovimientoCamaraApi } from "../../interfaces/movimientos/MovimientoCamara";
import { editarReciboMovimiento } from "../../services/movimientoCamara.service";

interface EditarReciboMovimientoModalProps {
    movimiento: MovimientoCamaraApi;
    camaraDestino: string;
    onCerrar: () => void;
    onGuardado: () => void;
}

/**
 * Recibo de ingreso de la mercancía en la cámara destino. Se guarda en la línea
 * de llegada del movimiento: el recibo de la cámara de origen no cambia.
 * Estado inicial desde props: la vista le pone `key` con el id del movimiento.
 */
function EditarReciboMovimientoModal({ movimiento, camaraDestino, onCerrar, onGuardado }: EditarReciboMovimientoModalProps) {
    const { mostrarToast } = useToastContext();
    const inicial = movimiento.recibo_destino_propio ? movimiento.recibo_destino : "";
    const [recibo, setRecibo] = useState(inicial);
    const [guardando, setGuardando] = useState(false);

    async function guardar(e: React.FormEvent) {
        e.preventDefault();
        setGuardando(true);
        try {
            await editarReciboMovimiento(movimiento.id, recibo);
            mostrarToast("Recibo guardado", "El cambio quedó registrado en Auditoría de entradas.", "success");
            onGuardado();
        } catch (err) {
            mostrarToast("Error al guardar", obtenerMensajeError(err), "danger");
        } finally {
            setGuardando(false);
        }
    }

    return (
        <Modal title="Recibo de ingreso en destino" show onClose={onCerrar} closeDisabled={guardando}>
            <form onSubmit={guardar}>
                <p className="small mb-2">
                    <span className="fw-semibold">{movimiento.lote_origen}</span>
                    <br />
                    {movimiento.cajas.toLocaleString("es-MX")} cajas a <span className="fw-semibold">{camaraDestino}</span>
                </p>
                <p className="small text-body-secondary">
                    Recibo en la cámara de origen: <span className="fw-semibold">{movimiento.recibo_origen || "—"}</span>. No cambia.
                </p>
                <label className="form-label small fw-bold" htmlFor="recibo-destino">Recibo en destino</label>
                <input
                    id="recibo-destino"
                    className="form-control form-control-sm text-uppercase"
                    placeholder="IMP-…"
                    maxLength={30}
                    value={recibo}
                    onChange={(e) => setRecibo(e.target.value)}
                    autoFocus
                />
                <div className="form-text">Si lo dejas vacío, se muestra el recibo de origen.</div>
                <div className="d-flex justify-content-end gap-2 mt-3">
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onCerrar} disabled={guardando}>
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        disabled={guardando || recibo.trim().toUpperCase() === inicial}
                    >
                        {guardando && <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>}
                        Guardar recibo
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default EditarReciboMovimientoModal;
