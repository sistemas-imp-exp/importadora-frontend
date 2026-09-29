import type { DensidadTabla } from "../hooks/useDensidadTabla";

interface DensidadToggleProps {
    valor: DensidadTabla;
    onChange: (densidad: DensidadTabla) => void;
}

/** Selector Normal / Compacta para la altura de las filas de una tabla. */
function DensidadToggle({ valor, onChange }: DensidadToggleProps) {
    return (
        <div className="btn-group btn-group-sm" role="group" aria-label="Densidad de filas">
            <button
                type="button"
                className={`btn ${valor === "normal" ? "btn-secondary" : "btn-outline-secondary"}`}
                onClick={() => onChange("normal")}
                title="Filas con más espacio: más cómodo de leer"
                aria-pressed={valor === "normal"}
            >
                <i className="bi bi-list" aria-hidden="true"></i>
                <span className="visually-hidden">Densidad normal</span>
            </button>
            <button
                type="button"
                className={`btn ${valor === "compacta" ? "btn-secondary" : "btn-outline-secondary"}`}
                onClick={() => onChange("compacta")}
                title="Filas compactas: más registros por pantalla"
                aria-pressed={valor === "compacta"}
            >
                <i className="bi bi-list-ul" aria-hidden="true"></i>
                <span className="visually-hidden">Densidad compacta</span>
            </button>
        </div>
    );
}

export default DensidadToggle;
