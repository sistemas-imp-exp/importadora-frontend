import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface AccionMenu {
    etiqueta: string;
    icono: string;
    onClick: () => void;
    variante?: "danger";
    /** Si viene, la opción queda deshabilitada y se muestra el motivo. */
    motivoBloqueo?: string | null;
    /** Contador a la derecha (p. ej. adjuntos). */
    contador?: number;
}

interface MenuAccionesFilaProps {
    acciones: AccionMenu[];
    /** Para el lector de pantalla y el tooltip, p. ej. "Acciones del folio 23710". */
    etiqueta: string;
}

const ANCHO_MENU = 200;

/**
 * Botón "⋮" con las acciones de una fila. El menú se dibuja en un portal con
 * posición fija: no lo recorta el overflow de .table-responsive ni cambia el
 * alto o el ancho de la tabla.
 */
function MenuAccionesFila({ acciones, etiqueta }: MenuAccionesFilaProps) {
    const [abierto, setAbierto] = useState(false);
    const [posicion, setPosicion] = useState<{ top: number; left: number } | null>(null);
    const botonRef = useRef<HTMLButtonElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useLayoutEffect(() => {
        if (!abierto) return;
        function ubicar() {
            const boton = botonRef.current?.getBoundingClientRect();
            if (!boton) return;
            const alto = menuRef.current?.offsetHeight ?? 0;
            // Alineado al borde derecho del botón; si no cabe abajo, se abre hacia arriba.
            const abajo = boton.bottom + 4;
            const top = abajo + alto > window.innerHeight && boton.top - alto - 4 > 0 ? boton.top - alto - 4 : abajo;
            const left = Math.max(8, Math.min(boton.right - ANCHO_MENU, window.innerWidth - ANCHO_MENU - 8));
            setPosicion({ top, left });
        }
        ubicar();
        window.addEventListener("resize", ubicar);
        window.addEventListener("scroll", ubicar, true);
        return () => {
            window.removeEventListener("resize", ubicar);
            window.removeEventListener("scroll", ubicar, true);
        };
    }, [abierto]);

    useEffect(() => {
        if (!abierto) return;
        function clicFuera(e: MouseEvent) {
            const objetivo = e.target as Node;
            if (!menuRef.current?.contains(objetivo) && !botonRef.current?.contains(objetivo)) setAbierto(false);
        }
        function tecla(e: KeyboardEvent) {
            if (e.key === "Escape") {
                setAbierto(false);
                botonRef.current?.focus();
            }
        }
        document.addEventListener("mousedown", clicFuera);
        document.addEventListener("keydown", tecla);
        return () => {
            document.removeEventListener("mousedown", clicFuera);
            document.removeEventListener("keydown", tecla);
        };
    }, [abierto]);

    function alternar() {
        setPosicion(null);
        setAbierto((a) => !a);
    }

    return (
        <>
            <button
                ref={botonRef}
                type="button"
                className="btn btn-sm btn-outline-secondary px-2 py-0 lh-base"
                onClick={alternar}
                aria-haspopup="menu"
                aria-expanded={abierto}
                title={etiqueta}
            >
                <i className="bi bi-three-dots-vertical" aria-hidden="true"></i>
                <span className="visually-hidden">{etiqueta}</span>
            </button>
            {abierto &&
                createPortal(
                    <div
                        ref={menuRef}
                        role="menu"
                        className="dropdown-menu show shadow"
                        style={{
                            position: "fixed",
                            top: posicion?.top ?? 0,
                            left: posicion?.left ?? 0,
                            width: ANCHO_MENU,
                            minWidth: ANCHO_MENU,
                            // Hasta medir la posición no se muestra (evita un parpadeo en la esquina).
                            visibility: posicion ? "visible" : "hidden",
                            zIndex: 1060,
                        }}
                    >
                        {acciones.map((accion) => (
                            <button
                                key={accion.etiqueta}
                                type="button"
                                role="menuitem"
                                className={`dropdown-item d-flex align-items-center gap-2 ${accion.variante === "danger" ? "text-danger" : ""}`}
                                disabled={!!accion.motivoBloqueo}
                                title={accion.motivoBloqueo ?? undefined}
                                onClick={() => {
                                    setAbierto(false);
                                    accion.onClick();
                                }}
                            >
                                <i className={`bi ${accion.icono}`} aria-hidden="true"></i>
                                <span className="flex-grow-1">{accion.etiqueta}</span>
                                {!!accion.contador && (
                                    <span className="badge rounded-pill bg-primary-subtle text-primary-emphasis">{accion.contador}</span>
                                )}
                            </button>
                        ))}
                    </div>,
                    document.body,
                )}
        </>
    );
}

export default MenuAccionesFila;
