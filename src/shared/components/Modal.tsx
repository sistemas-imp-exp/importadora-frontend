import { useEffect } from "react";

interface ModalProps {
    title: string;
    show: boolean;
    size?: string;
    closeDisabled?: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

function Modal({ title, show, onClose, children, size, closeDisabled }: ModalProps) {

    useEffect(() => {
        if (!show || closeDisabled) return;

        function manejarTecla(e: KeyboardEvent) {
            if (e.key === "Escape") {
                onClose();
            }
        }

        window.addEventListener("keydown", manejarTecla);
        return () => window.removeEventListener("keydown", manejarTecla);
    }, [show, closeDisabled, onClose]);

    if (!show) return null;

    return (
        <>
            <div
                className="modal fade show d-block"
                onClick={(e) => {
                    // Solo cierra si el clic cayó en el área vacía del modal
                    // (fuera de modal-dialog), no cuando burbujea desde adentro.
                    if (e.target === e.currentTarget && !closeDisabled) {
                        onClose();
                    }
                }}
            >
                <div className={`modal-dialog ${size}`}>
                    <div className="modal-content">

                        <div className="modal-header">
                            <h5 className="modal-title">{title}</h5>

                            <button
                                className="btn-close"
                                onClick={onClose}
                                disabled={closeDisabled}
                            />
                        </div>

                        <div className="modal-body">
                            {children}
                        </div>

                    </div>
                </div>
            </div>

            <div className="modal-backdrop fade show"></div>
        </>
    );
}

export default Modal;
