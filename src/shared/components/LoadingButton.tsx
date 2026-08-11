interface LoadingButtonProps {
    icon?: string,
    isLoading: boolean;
    text: string;
    variant?: "primary" | "success" | "danger" | "warning" | "secondary";
    onClick: () => void | Promise<void>;
}

function LoadingButton({ isLoading, text, onClick, variant = "primary", icon }: LoadingButtonProps) {
    return (
        <button
            type="button"
            className={`btn btn-${variant}`}
            onClick={onClick}
            disabled={isLoading}
        >
            {isLoading ? (
                <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    <span className="ml-2">Cargando...</span>
                </>
            ) : (
                <>
                    {/* Renderizamos el ícono solo si la variable 'icon' tiene contenido */}
                    {icon && <i className={`${icon} me-1`}></i>}
                    {text}
                </>
            )}
        </button>
    );
}

export default LoadingButton;