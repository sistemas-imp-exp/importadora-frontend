import { useState } from "react";
import Modal from "../../../shared/components/Modal";
import LoadingButton from "../../../shared/components/LoadingButton";
import { obtenerMensajeError } from "../../../shared/utils/apiError";

interface Props {
    /** Qué se cancela (null = cerrado), p. ej. "el movimiento MG-00012". */
    descripcion: string | null;
    aviso?: string;
    onConfirmar: (motivo: string) => Promise<void>;
    onClose: () => void;
}

/** Los movimientos no se borran: se cancelan con motivo y quedan en el historial de cada animal. */
function CancelarMovimientoGanado({ descripcion, aviso, onConfirmar, onClose }: Props) {
    return (
        <Modal title="Cancelar movimiento" show={descripcion !== null} onClose={onClose}>
            {descripcion !== null && <Contenido descripcion={descripcion} aviso={aviso} onConfirmar={onConfirmar} onClose={onClose} />}
        </Modal>
    );
}

function Contenido({ descripcion, aviso, onConfirmar, onClose }: Props & { descripcion: string }) {
    const [motivo, setMotivo] = useState("");
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function confirmar() {
        if (!motivo.trim()) {
            setError("Debes indicar el motivo de la cancelación.");
            return;
        }
        setError(null);
        setGuardando(true);
        try {
            await onConfirmar(motivo.trim());
        } catch (err) {
            setError(obtenerMensajeError(err));
        } finally {
            setGuardando(false);
        }
    }

    return (
        <>
            <p className="mb-2">Vas a cancelar {descripcion}. Deja de contar en el inventario y queda en el historial de sus animales con el motivo.</p>
            {aviso && <div className="alert alert-warning py-2 small">{aviso}</div>}
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <div className="form-floating mb-3">
                <textarea
                    className="form-control"
                    style={{ height: "100px" }}
                    placeholder="Motivo de la cancelación"
                    id="motivo-cancelar-ganado"
                    value={motivo}
                    autoFocus
                    onChange={(e) => setMotivo(e.target.value)}
                />
                <label htmlFor="motivo-cancelar-ganado">Motivo de la cancelación</label>
            </div>
            <div className="d-flex justify-content-between gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={guardando}>
                    No, mantener
                </button>
                <LoadingButton icon="bi bi-x-circle" isLoading={guardando} text="Sí, cancelar" variant="danger" onClick={confirmar} />
            </div>
        </>
    );
}

export default CancelarMovimientoGanado;
