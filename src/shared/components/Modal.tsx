interface ModalProps {
    title: string;
    show: boolean;
    size?: string;
    closeDisabled?: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

function Modal({ title, show, onClose, children, size, closeDisabled }: ModalProps) {

    if (!show) return null;

    return (
        <>
            <div className="modal fade show d-block">
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