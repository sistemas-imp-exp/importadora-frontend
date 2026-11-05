import { useEffect, useRef, useState } from "react";
import type { OpcionFiltro } from "./FiltroChip";

interface FiltroChipMultipleProps {
    etiqueta: string;
    valores: string[];
    opciones: OpcionFiltro[];
    onChange: (valores: string[]) => void;
    /** Clase de bootstrap-icons, ej: "bi-rulers". */
    icono?: string;
}

const MIN_OPCIONES_BUSCADOR = 8;

/**
 * Igual que FiltroChip, pero se pueden marcar varias opciones (casillas); el
 * menú no se cierra al marcar. El chip muestra la opción elegida o "N
 * seleccionadas".
 */
function FiltroChipMultiple({ etiqueta, valores, opciones, onChange, icono }: FiltroChipMultipleProps) {
    const [abierto, setAbierto] = useState(false);
    const [query, setQuery] = useState("");
    const contenedorRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!abierto) return;

        function manejarClicFuera(e: MouseEvent) {
            if (!contenedorRef.current?.contains(e.target as Node)) setAbierto(false);
        }
        function manejarEscape(e: KeyboardEvent) {
            if (e.key === "Escape") setAbierto(false);
        }

        document.addEventListener("mousedown", manejarClicFuera);
        document.addEventListener("keydown", manejarEscape);
        return () => {
            document.removeEventListener("mousedown", manejarClicFuera);
            document.removeEventListener("keydown", manejarEscape);
        };
    }, [abierto]);

    const activo = valores.length > 0;
    const resumen = valores.length === 1
        ? opciones.find((o) => o.value === valores[0])?.label ?? valores[0]
        : `${valores.length} seleccionadas`;
    const titulo = opciones.filter((o) => valores.includes(o.value)).map((o) => o.label).join(", ");

    const termino = query.trim().toLowerCase();
    const visibles = termino ? opciones.filter((o) => o.label.toLowerCase().includes(termino)) : opciones;

    function alternar() {
        setAbierto((a) => !a);
        setQuery("");
    }

    function marcar(valor: string) {
        // Se conserva el orden de las opciones, no el de los clics.
        const nuevos = valores.includes(valor) ? valores.filter((v) => v !== valor) : [...valores, valor];
        onChange(opciones.map((o) => o.value).filter((v) => nuevos.includes(v)));
    }

    const claseChipActivo = "btn btn-sm bg-primary-subtle border-primary-subtle text-primary-emphasis";

    return (
        <div className="dropdown" ref={contenedorRef}>
            {activo ? (
                <div className="btn-group" role="group" aria-label={etiqueta}>
                    <button
                        type="button"
                        className={`${claseChipActivo} rounded-pill rounded-end-0 text-truncate`}
                        style={{ maxWidth: 260 }}
                        onClick={alternar}
                        aria-expanded={abierto}
                        title={`${etiqueta}: ${titulo}`}
                    >
                        {icono && <i className={`bi ${icono} me-1`} aria-hidden="true"></i>}
                        {etiqueta}: {resumen}
                    </button>
                    <button
                        type="button"
                        className={`${claseChipActivo} rounded-pill rounded-start-0`}
                        onClick={() => onChange([])}
                        title={`Quitar filtro de ${etiqueta.toLowerCase()}`}
                    >
                        <i className="bi bi-x-lg" aria-hidden="true"></i>
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary rounded-pill dropdown-toggle"
                    onClick={alternar}
                    aria-expanded={abierto}
                >
                    {icono && <i className={`bi ${icono} me-1`} aria-hidden="true"></i>}
                    {etiqueta}
                </button>
            )}

            {abierto && (
                <ul className="dropdown-menu show shadow-sm mt-1" style={{ maxHeight: 320, overflowY: "auto", minWidth: 220 }}>
                    {opciones.length >= MIN_OPCIONES_BUSCADOR && (
                        <li className="px-2 pb-2">
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Buscar..."
                                value={query}
                                autoComplete="off"
                                autoFocus
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </li>
                    )}
                    {visibles.length === 0 ? (
                        <li><span className="dropdown-item-text small text-muted">Sin resultados</span></li>
                    ) : (
                        visibles.map((opcion) => (
                            <li key={opcion.value}>
                                <label className="dropdown-item small d-flex align-items-center gap-2 mb-0" role="button">
                                    <input
                                        type="checkbox"
                                        className="form-check-input m-0"
                                        checked={valores.includes(opcion.value)}
                                        onChange={() => marcar(opcion.value)}
                                    />
                                    {opcion.label}
                                </label>
                            </li>
                        ))
                    )}
                    {activo && (
                        <>
                            <li><hr className="dropdown-divider" /></li>
                            <li>
                                <button type="button" className="dropdown-item small" onClick={() => onChange([])}>
                                    Quitar selección
                                </button>
                            </li>
                        </>
                    )}
                </ul>
            )}
        </div>
    );
}

export default FiltroChipMultiple;
