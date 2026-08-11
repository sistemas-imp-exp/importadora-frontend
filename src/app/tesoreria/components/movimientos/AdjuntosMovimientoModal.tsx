import Modal from "../../../../shared/components/Modal";
import type { Movimiento } from "../../interfaces/movimientos/Movimiento";
import AdjuntosMovimiento from "./AdjuntosMovimiento";

interface Props {
    movimiento: Movimiento | null;
    show: boolean;
    onClose: () => void;
    onCambio?: () => void;
}

function AdjuntosMovimientoModal({ movimiento, show, onClose, onCambio }: Props) {
    if (!movimiento) return null;

    return (
        <Modal title={`Archivos adjuntos — ${movimiento.folio}`} show={show} onClose={onClose} size="modal-lg">
            <AdjuntosMovimiento movimientoId={movimiento.id} onCambio={onCambio} />
        </Modal>
    );
}

export default AdjuntosMovimientoModal;
