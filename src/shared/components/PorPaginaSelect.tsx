interface PorPaginaSelectProps {
    valor: number;
    onChange: (valor: number) => void;
    opciones?: number[];
}

function PorPaginaSelect({ valor, onChange, opciones = [25, 50, 100, 250] }: PorPaginaSelectProps) {
    return (
        <div className="d-flex align-items-center gap-2">
            <label htmlFor="porPagina" className="form-label mb-0 small text-muted text-nowrap">
                Ver
            </label>
            <select
                id="porPagina"
                className="form-select form-select-sm"
                style={{ width: "auto" }}
                value={valor}
                onChange={(e) => onChange(Number(e.target.value))}
            >
                {opciones.map((opcion) => (
                    <option key={opcion} value={opcion}>
                        {opcion}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default PorPaginaSelect;
