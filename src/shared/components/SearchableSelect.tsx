import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";

export interface SearchableSelectOption {
    value: number;
    label: string;
    disabled?: boolean;
}

interface SearchableSelectProps {
    options: SearchableSelectOption[];
    value: number | "";
    onChange: (valor: number | "") => void;
    placeholder?: string;
    className?: string;
    id?: string;
}

interface Posicion {
    top: number;
    left: number;
    width: number;
}

const MAX_VISIBLE = 30;

function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Buscar...",
    className = "form-control form-control-sm",
    id,
}: SearchableSelectProps) {
    const [query, setQuery] = useState("");
    const [abierto, setAbierto] = useState(false);
    const [resaltado, setResaltado] = useState(-1);
    const [posicion, setPosicion] = useState<Posicion | null>(null);
    const contenedorRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const dropdownRef = useRef<HTMLUListElement | null>(null);

    const seleccionado = options.find((o) => o.value === value) ?? null;

    // El desplegable se renderiza en un portal (document.body) porque las filas de la
    // tabla de líneas viven dentro de un contenedor .table-responsive: al tener
    // overflow-x: auto, el navegador también recorta el overflow vertical, así que un
    // <ul> absolute normal se cortaría en el borde de la tabla en vez de flotar libre.
    useLayoutEffect(() => {
        if (!abierto) return;

        function actualizarPosicion() {
            const rect = inputRef.current?.getBoundingClientRect();
            if (rect) {
                setPosicion({ top: rect.bottom, left: rect.left, width: rect.width });
            }
        }

        actualizarPosicion();
        window.addEventListener("scroll", actualizarPosicion, true);
        window.addEventListener("resize", actualizarPosicion);
        return () => {
            window.removeEventListener("scroll", actualizarPosicion, true);
            window.removeEventListener("resize", actualizarPosicion);
        };
    }, [abierto]);

    useEffect(() => {
        function manejarClicFuera(e: MouseEvent) {
            const objetivo = e.target as Node;
            const dentroDelInput = contenedorRef.current?.contains(objetivo);
            const dentroDelDropdown = dropdownRef.current?.contains(objetivo);
            if (!dentroDelInput && !dentroDelDropdown) {
                setAbierto(false);
                setQuery("");
            }
        }
        document.addEventListener("mousedown", manejarClicFuera);
        return () => document.removeEventListener("mousedown", manejarClicFuera);
    }, []);

    const termino = query.trim().toLowerCase();
    const filtradas = termino ? options.filter((o) => o.label.toLowerCase().includes(termino)) : options;
    const visibles = filtradas.slice(0, MAX_VISIBLE);

    function seleccionar(opcion: SearchableSelectOption) {
        if (opcion.disabled) return;
        onChange(opcion.value);
        setAbierto(false);
        setQuery("");
        setResaltado(-1);
    }

    function manejarTeclado(e: KeyboardEvent<HTMLInputElement>) {
        if (!abierto || visibles.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setResaltado((actual) => (actual + 1) % visibles.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setResaltado((actual) => (actual <= 0 ? visibles.length - 1 : actual - 1));
        } else if (e.key === "Enter" && resaltado >= 0) {
            e.preventDefault();
            seleccionar(visibles[resaltado]);
        } else if (e.key === "Escape") {
            setAbierto(false);
            setQuery("");
        }
    }

    return (
        <div className="position-relative" ref={contenedorRef}>
            <input
                ref={inputRef}
                id={id}
                className={className}
                placeholder={placeholder}
                value={abierto ? query : (seleccionado?.label ?? "")}
                autoComplete="off"
                onChange={(e) => {
                    setQuery(e.target.value);
                    setResaltado(-1);
                }}
                onFocus={() => {
                    setAbierto(true);
                    setQuery("");
                }}
                onKeyDown={manejarTeclado}
            />
            {abierto &&
                posicion &&
                createPortal(
                    <ul
                        ref={dropdownRef}
                        className="list-group shadow-sm"
                        style={{
                            position: "fixed",
                            top: posicion.top,
                            left: posicion.left,
                            width: posicion.width,
                            zIndex: 1060,
                            maxHeight: 220,
                            overflowY: "auto",
                        }}
                    >
                        {visibles.length === 0 ? (
                            <li className="list-group-item py-1 px-2 small text-muted">Sin resultados</li>
                        ) : (
                            visibles.map((opcion, index) => (
                                <li
                                    key={opcion.value}
                                    className={`list-group-item list-group-item-action py-1 px-2 small ${index === resaltado ? "active" : ""} ${opcion.disabled ? "disabled" : ""}`}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        seleccionar(opcion);
                                    }}
                                >
                                    {opcion.label}
                                </li>
                            ))
                        )}
                        {filtradas.length > MAX_VISIBLE && (
                            <li className="list-group-item py-1 px-2 small text-muted fst-italic">
                                +{filtradas.length - MAX_VISIBLE} más, sigue escribiendo para filtrar
                            </li>
                        )}
                    </ul>,
                    document.body
                )}
        </div>
    );
}

export default SearchableSelect;
