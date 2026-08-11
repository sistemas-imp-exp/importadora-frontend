import LoadingButton from "./LoadingButton";

interface ConfirmModalProps {
    show: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    children: React.ReactNode;
    isLoading?: boolean;
    confirmText?: string;
    confirmVariant?: "primary" | "success" | "danger" | "warning" | "secondary";
}

function ConfirmModal({ show, onConfirm, onCancel, children, isLoading, confirmText, confirmVariant }: ConfirmModalProps) {
    if (!show) {
        return null;
    }
    return (
        <>
            <div className="modal fade show d-block">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-body">
                            {children}
                        </div>
                        <div className="modal-footer d-flex justify-content-between">
                            <button className="btn btn-outline-secondary" onClick={onCancel}>
                                No, cancelar
                            </button>
                            <LoadingButton
                                isLoading={isLoading ?? false}
                                text={confirmText ?? "Si, eliminar"}
                                variant={confirmVariant ?? "danger"}
                                onClick={onConfirm}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show"></div>
        </>
    )
}

export default ConfirmModal;