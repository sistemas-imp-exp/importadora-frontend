interface Props {
    valor: string;
    onChange: (valor: string) => void;
    placeholder?: string;
}

function BuscadorTabla({ valor, onChange, placeholder = "Buscar..." }: Props) {
    return (
        <div className="input-group input-group-sm" style={{ maxWidth: "340px" }}>
            <span className="input-group-text">
                <i className="bi bi-search"></i>
            </span>
            <input
                type="text"
                className="form-control"
                placeholder={placeholder}
                value={valor}
                onChange={(e) => onChange(e.target.value)}
            />
            {valor && (
                <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => onChange("")}
                    title="Limpiar búsqueda"
                >
                    <i className="bi bi-x-lg"></i>
                </button>
            )}
        </div>
    );
}

export default BuscadorTabla;
