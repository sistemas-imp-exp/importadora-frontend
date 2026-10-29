import Modal from "./Modal";

interface Props {
    segundos: number;
    onSeguir: () => void;
    onSalir: () => void;
}

/** Aviso dos minutos antes del cierre por inactividad. */
export default function AvisoInactividad({ segundos, onSeguir, onSalir }: Props) {
    const minutos = Math.floor(segundos / 60);
    const resto = String(segundos % 60).padStart(2, "0");

    return (
        <Modal title="¿Sigues ahí?" show onClose={onSeguir}>
            <div className="modal-body">
                <p className="mb-2">
                    Por seguridad, tu sesión se cerrará por inactividad en{" "}
                    <strong className="font-monospace">{minutos}:{resto}</strong>.
                </p>
                <p className="small text-body-secondary mb-0">Lo que no hayas guardado se perderá.</p>
            </div>
            <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={onSalir}>
                    Cerrar sesión
                </button>
                <button type="button" className="btn btn-primary" onClick={onSeguir} autoFocus>
                    Seguir conectado
                </button>
            </div>
        </Modal>
    );
}
