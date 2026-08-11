import type { Toast } from "../hooks/useToast";


interface ToastMessageProps {
    toasts: Toast[];
    onClose: (id:string)=>void;
}


function ToastMessage({
    toasts,
    onClose
}: ToastMessageProps) {


    return (
        <div
            className="toast-container position-fixed top-0 end-0 p-3"
            style={{
                zIndex: 9999
            }}
        >

            {
                toasts.map((toast)=>(
                    <div
                        key={toast.id}
                        className={`toast show text-bg-${toast.type} mb-2`}
                        role="alert"
                    >

                        <div className="toast-header">

                            <strong className="me-auto">
                                {toast.title}
                            </strong>

                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => onClose(toast.id)}
                            />

                        </div>


                        <div className="toast-body">
                            {toast.message}
                        </div>

                    </div>
                ))
            }


        </div>
    )
}


export default ToastMessage;