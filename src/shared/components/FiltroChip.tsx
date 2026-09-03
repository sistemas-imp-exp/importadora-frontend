import { useEffect, useRef, useState } from "react";

export interface OpcionFiltro {
    value: string;
    label: string;
}

interface FiltroChipProps {
    etiqueta: string;
    valor: string;
    opciones: OpcionFiltro[];
    onChange: (valor: string) => void;
    /** Texto del ítem que limpia el filtro. Ej: "Todas las cámaras". */
    etiquetaTodos?: string;
    /** Clase de bootstrap-icons, ej: "bi-snow2". */
    icono?: string;
}

// A partir de esta cantidad de opciones el desplegable muestra su propio
// buscador (proveedores/tallas pueden ser listas largas).
const MIN_OPCIONES_BUSCADOR = 8;

/**
 * Chip de filtro estilo Google Drive: pastilla con contorno cuando no hay valor
 * seleccionado, y pintada con el acento de marca + botón X cuando sí lo hay.
 *
 * La apertura se maneja con estado de React (no con data-bs-toggle) porque el
 * auto-close de Bootstrap no distingue entre escribir en el buscador del menú
 * y elegir una opción: o cerraría al teclear, o no cerraría al seleccionar.
 */
function FiltroChip({ etiqueta, valor, opciones, onChange, etiquetaTodos = "Todos", icono }: FiltroChipProps) {
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

    const seleccionada = opciones.find((o) => o.value === valor) ?? null;
    const activo = seleccionada !== null;

    const termino = query.trim().toLowerCase();
    const visibles = termino ? opciones.filter((o) => o.label.toLowerCase().includes(termino)) : opciones;

    function alternar() {
        setAbierto((a) => !a);
        setQuery("");
    }

    function seleccionar(nuevoValor: string) {
        onChange(nuevoValor);
        setAbierto(false);
        setQuery("");
    }

    const claseChipActivo = "btn btn-sm bg-primary-subtle border-primary-subtle text-primary-emphasis";

    return (
        <div className="dropdown" ref={contenedorRef}>
            {activo ? (
                // El toggle y la X van como btn-group (dos botones hermanos) en vez
                // de anidar un <button> dentro de otro, que sería HTML inválido.
                <div className="btn-group" role="group" aria-label={etiqueta}>
                    <button
                        type="button"
                        className={`${claseChipActivo} rounded-pill rounded-end-0 text-truncate`}
                        style={{ maxWidth: 260 }}
                        onClick={alternar}
                        aria-expanded={abierto}
                        title={`${etiqueta}: ${seleccionada.label}`}
                    >
                        {icono && <i className={`bi ${icono} me-1`} aria-hidden="true"></i>}
                        {etiqueta}: {seleccionada.label}
                    </button>
                    <button
                        type="button"
                        className={`${claseChipActivo} rounded-pill rounded-start-0`}
                        onClick={() => seleccionar("")}
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
                <ul
                    className="dropdown-menu show shadow-sm mt-1"
                    style={{ maxHeight: 300, overflowY: "auto", minWidth: 220 }}
                >
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
                    <li>
                        <button
                            type="button"
                            className={`dropdown-item small ${activo ? "" : "active"}`}
                            onClick={() => seleccionar("")}
                        >
                            {etiquetaTodos}
                        </button>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    {visibles.length === 0 ? (
                        <li><span className="dropdown-item-text small text-muted">Sin resultados</span></li>
                    ) : (
                        visibles.map((opcion) => (
                            <li key={opcion.value}>
                                <button
                                    type="button"
                                    className={`dropdown-item small ${opcion.value === valor ? "active" : ""}`}
                                    onClick={() => seleccionar(opcion.value)}
                                >
                                    {opcion.label}
                                </button>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
}

export default FiltroChip;
