import { useState } from "react";
import Modal from "../../../../shared/components/Modal";
import LoadingButton from "../../../../shared/components/LoadingButton";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import type { Movimiento } from "../../interfaces/movimientos/Movimiento";
import { cancelarMovimiento } from "../../services/movimientos.service";

interface Props {
    movimiento: Movimiento | null;
    show: boolean;
    onClose: () => void;
    onCancelado: () => void;
}

function CancelarMovimientoModal({ movimiento, show, onClose, onCancelado }: Props) {
    const [motivo, setMotivo] = useState("");
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!movimiento) return null;

    function cerrar() {
        setMotivo("");
        setError(null);
        onClose();
    }

    async function confirmar() {
        if (!motivo.trim()) {
            setError("Debes indicar el motivo de la cancelación.");
            return;
        }

        setError(null);
        setGuardando(true);
        try {
            await cancelarMovimiento(movimiento!.id, motivo.trim());
            setMotivo("");
            onCancelado();
        } catch (err) {
            setError(obtenerMensajeError(err));
        } finally {
            setGuardando(false);
        }
    }

    return (
        <Modal title="Cancelar movimiento" show={show} onClose={cerrar} closeDisabled={guardando}>
            <p className="mb-3">
                Vas a cancelar el movimiento <strong>{movimiento.folio}</strong> ({movimiento.beneficiario}).
                El saldo de caja se ajustará automáticamente y esta acción quedará registrada para auditoría.
            </p>

            {error && (
                <div className="alert alert-danger py-2">{error}</div>
            )}

            <div className="form-floating mb-3">
                <textarea
                    className="form-control"
                    style={{ height: "100px" }}
                    placeholder="Motivo de la cancelación"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                />
                <label className="form-label">Motivo de la cancelación</label>
            </div>

            <div className="d-flex justify-content-between gap-2">
                <button className="btn btn-outline-secondary" onClick={cerrar} disabled={guardando}>
                    No, mantener movimiento
                </button>
                <LoadingButton
                    icon="bi bi-x-circle"
                    isLoading={guardando}
                    text="Sí, cancelar movimiento"
                    variant="danger"
                    onClick={confirmar}
                />
            </div>
        </Modal>
    );
}

export default CancelarMovimientoModal;
