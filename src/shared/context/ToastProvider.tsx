import type { ReactNode } from "react";
import ToastMessage from "../components/ToastMessage";
import { useToast } from "../hooks/useToast";

type ToastContextType = ReturnType<typeof useToast>;

import { createContext, useContext } from "react";

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const toast = useToast();

    return (
        <ToastContext.Provider value={toast}>
            {children}

            <ToastMessage
                toasts={toast.toasts}
                onClose={toast.eliminarToast}
            />
        </ToastContext.Provider>
    );
}

export function useToastContext() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error("useToastContext debe usarse dentro de ToastProvider");
    }

    return context;
}