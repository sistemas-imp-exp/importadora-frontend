import { useEffect, useRef, useState, type KeyboardEvent } from "react";

interface AutocompleteInputProps {
    value: string;
    onChange: (valor: string) => void;
    obtenerSugerencias: (q: string) => Promise<string[]>;
    placeholder?: string;
    className?: string;
    id?: string;
}

function AutocompleteInput({
    value,
    onChange,
    obtenerSugerencias,
    placeholder,
    className = "form-control form-control-sm",
    id,
}: AutocompleteInputProps) {
    const [sugerencias, setSugerencias] = useState<string[]>([]);
    const [abierto, setAbierto] = useState(false);
    const [resaltado, setResaltado] = useState(-1);
    const [cargando, setCargando] = useState(false);
    const contenedorRef = useRef<HTMLDivElement | null>(null);
    const idPeticion = useRef(0);

    useEffect(() => {
        if (!abierto) return;

        const espera = setTimeout(async () => {
            const idActual = ++idPeticion.current;
            setCargando(true);
            try {
                const resultado = await obtenerSugerencias(value);
                if (idActual === idPeticion.current) {
                    setSugerencias(resultado);
                }
            } catch {
                if (idActual === idPeticion.current) {
                    setSugerencias([]);
                }
            } finally {
                if (idActual === idPeticion.current) {
                    setCargando(false);
                }
            }
        }, 250);

        return () => clearTimeout(espera);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, abierto]);

    useEffect(() => {
        function manejarClicFuera(e: MouseEvent) {
            if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
                setAbierto(false);
            }
        }
        document.addEventListener("mousedown", manejarClicFuera);
        return () => document.removeEventListener("mousedown", manejarClicFuera);
    }, []);

    function seleccionar(sugerencia: string) {
        onChange(sugerencia);
        setAbierto(false);
        setResaltado(-1);
    }

    function manejarTeclado(e: KeyboardEvent<HTMLInputElement>) {
        if (!abierto || sugerencias.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setResaltado((actual) => (actual + 1) % sugerencias.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setResaltado((actual) => (actual <= 0 ? sugerencias.length - 1 : actual - 1));
        } else if (e.key === "Enter" && resaltado >= 0) {
            e.preventDefault();
            seleccionar(sugerencias[resaltado]);
        } else if (e.key === "Escape") {
            setAbierto(false);
        }
    }

    return (
        <div className="position-relative" ref={contenedorRef}>
            <input
                id={id}
                className={className}
                style={cargando ? { paddingRight: "1.75rem" } : undefined}
                placeholder={placeholder}
                value={value}
                autoComplete="off"
                onChange={(e) => {
                    onChange(e.target.value);
                    setAbierto(true);
                    setResaltado(-1);
                }}
                onFocus={() => setAbierto(true)}
                onKeyDown={manejarTeclado}
            />
            {cargando && (
                <span
                    className="spinner-border spinner-border-sm text-secondary position-absolute top-50 end-0 translate-middle-y me-2"
                    role="status"
                    aria-hidden="true"
                ></span>
            )}
            {abierto && sugerencias.length > 0 && (
                <ul
                    className="list-group position-absolute w-100 shadow-sm"
                    style={{ zIndex: 1050, maxHeight: 220, overflowY: "auto" }}
                >
                    {sugerencias.map((sugerencia, index) => (
                        <li
                            key={sugerencia}
                            className={`list-group-item list-group-item-action py-1 px-2 small ${index === resaltado ? "active" : ""}`}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                seleccionar(sugerencia);
                            }}
                        >
                            {sugerencia}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default AutocompleteInput;
