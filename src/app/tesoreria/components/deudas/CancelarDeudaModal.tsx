import { useState } from "react";
import Modal from "../../../../shared/components/Modal";
import LoadingButton from "../../../../shared/components/LoadingButton";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import type { Deuda } from "../../interfaces/deudas/Deuda";
import { cancelarDeuda } from "../../services/deudas.service";

interface Props {
    deuda: Deuda | null;
    onClose: () => void;
    onCancelada: () => void;
}

function CancelarDeudaModal({ deuda, onClose, onCancelada }: Props) {
    const [motivo, setMotivo] = useState("");
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function cerrar() {
        setMotivo("");
        setError(null);
        onClose();
    }

    async function confirmar() {
        if (!deuda) return;
        if (!motivo.trim()) {
            setError("Debes indicar el motivo de la cancelación.");
            return;
        }
        setError(null);
        setGuardando(true);
        try {
            await cancelarDeuda(deuda.id, motivo.trim());
            setMotivo("");
            onCancelada();
        } catch (err) {
            setError(obtenerMensajeError(err));
        } finally {
            setGuardando(false);
        }
    }

    return (
        <Modal title="Cancelar deuda" show={deuda !== null} onClose={cerrar} closeDisabled={guardando}>
            {deuda && (
                <>
                    <p className="mb-3">
                        Vas a cancelar la deuda <strong>{deuda.concepto}</strong> de <strong>{deuda.deudor.nombre}</strong>.
                        Ya no se le podrán registrar abonos; queda en el historial con el motivo.
                    </p>
                    {error && <div className="alert alert-danger py-2">{error}</div>}
                    <div className="form-floating mb-3">
                        <textarea
                            className="form-control"
                            style={{ height: "100px" }}
                            placeholder="Motivo de la cancelación"
                            id="motivo-cancelar-deuda"
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                        />
                        <label htmlFor="motivo-cancelar-deuda">Motivo de la cancelación</label>
                    </div>
                    <div className="d-flex justify-content-between gap-2">
                        <button className="btn btn-outline-secondary" onClick={cerrar} disabled={guardando}>
                            No, mantener deuda
                        </button>
                        <LoadingButton
                            icon="bi bi-x-circle"
                            isLoading={guardando}
                            text="Sí, cancelar deuda"
                            variant="danger"
                            onClick={confirmar}
                        />
                    </div>
                </>
            )}
        </Modal>
    );
}

export default CancelarDeudaModal;
