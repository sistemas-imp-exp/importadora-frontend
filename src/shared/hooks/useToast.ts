import { useState } from "react";

export interface Toast {
    id: string;
    title: string;
    message: string;
    type: "success" | "danger" | "warning" | "info";
}

export function useToast() {

    const [toasts, setToasts] = useState<Toast[]>([]);


    function mostrarToast(
        title: string,
        message: string,
        type: Toast["type"] = "success"
    ) {

        const id = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;

        const nuevoToast: Toast = {
            id,
            title,
            message,
            type
        };


        setToasts((prev) => [
            ...prev,
            nuevoToast
        ]);


        setTimeout(() => {
            eliminarToast(id);
        }, 4000);

    }


    function eliminarToast(id: string) {

        setToasts((prev) =>
            prev.filter(
                toast => toast.id !== id
            )
        );

    }


    return {
        toasts,
        mostrarToast,
        eliminarToast
    };
}