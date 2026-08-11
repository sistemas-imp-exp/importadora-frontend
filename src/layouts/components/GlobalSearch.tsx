import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../../shared/components/Modal";
import { useAuth } from "../../shared/hooks/useAuth";
import type { SidebarMenuItem } from "../../shared/interfaces/SidebarMenu";
import { sidebarMenu } from "../menu";

interface ResultadoBusqueda {
    to: string;
    label: string;
    ruta: string;
    icon?: string;
}

function aplanarMenu(items: SidebarMenuItem[], trail: string[] = []): ResultadoBusqueda[] {
    const resultados: ResultadoBusqueda[] = [];

    for (const item of items) {
        if (item.to) {
            resultados.push({
                to: item.to,
                label: item.label,
                ruta: trail.join(" › "),
                icon: item.icon,
            });
        }
        if (item.children?.length) {
            resultados.push(...aplanarMenu(item.children, [...trail, item.label]));
        }
    }

    return resultados;
}

function GlobalSearch() {
    const { hasArea } = useAuth();
    const navigate = useNavigate();
    const [show, setShow] = useState(false);
    const [termino, setTermino] = useState("");
    const inputRef = useRef<HTMLInputElement | null>(null);

    // El área solo se filtra en la raíz del menú (igual que Sidebar.tsx):
    // los hijos anidados heredan el área de su rama de nivel superior.
    const indice = useMemo(() => {
        const permitido = sidebarMenu.filter((item) => !item.area || hasArea(item.area));
        return aplanarMenu(permitido);
    }, [hasArea]);

    useEffect(() => {
        if (show) {
            setTermino("");
            const id = setTimeout(() => inputRef.current?.focus(), 50);
            return () => clearTimeout(id);
        }
    }, [show]);

    useEffect(() => {
        function manejarAtajo(e: KeyboardEvent) {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setShow(true);
            }
        }
        window.addEventListener("keydown", manejarAtajo);
        return () => window.removeEventListener("keydown", manejarAtajo);
    }, []);

    const resultados = useMemo(() => {
        const q = termino.trim().toLowerCase();
        if (!q) return indice;
        return indice.filter(
            (r) => r.label.toLowerCase().includes(q) || r.ruta.toLowerCase().includes(q)
        );
    }, [indice, termino]);

    function ir(to: string) {
        setShow(false);
        navigate(to);
    }

    return (
        <>
            <li className="nav-item">
                <button
                    className="nav-link"
                    type="button"
                    title="Buscar (Ctrl+K)"
                    onClick={() => setShow(true)}
                >
                    <i className="bi bi-search"></i>
                </button>
            </li>

            <Modal title="Ir a..." show={show} onClose={() => setShow(false)}>
                <input
                    ref={inputRef}
                    type="text"
                    className="form-control mb-3"
                    placeholder="Buscar una sección o catálogo..."
                    value={termino}
                    onChange={(e) => setTermino(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && resultados.length > 0) {
                            ir(resultados[0].to);
                        }
                    }}
                />

                <div className="list-group" style={{ maxHeight: "50vh", overflowY: "auto" }}>
                    {resultados.length === 0 ? (
                        <p className="text-muted text-center mb-0 py-3">Sin resultados.</p>
                    ) : (
                        resultados.map((r) => (
                            <button
                                key={r.to}
                                type="button"
                                className="list-group-item list-group-item-action d-flex align-items-center gap-2"
                                onClick={() => ir(r.to)}
                            >
                                <i className={`${r.icon ?? "bi bi-circle"} text-secondary`}></i>
                                <span>
                                    {r.label}
                                    {r.ruta && <small className="text-muted d-block">{r.ruta}</small>}
                                </span>
                            </button>
                        ))
                    )}
                </div>
            </Modal>
        </>
    );
}

export default GlobalSearch;
