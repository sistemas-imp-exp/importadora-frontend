import { useMemo, useState } from "react";
import Modal from "../../../../shared/components/Modal";
import BuscadorTabla from "../../../../shared/components/BuscadorTabla";
import { formatearKg } from "../../../../shared/utils/numeros";
import type { TotalProducto } from "../../utils/totalesProducto";

interface Props {
    totales: TotalProducto[];
    /** Productos que ya están en la venta: se muestran pero no se pueden volver a agregar. */
    yaAgregados: number[];
    onAgregar: (productos: TotalProducto[]) => void;
    onCerrar: () => void;
}

/**
 * Elegir uno o varios productos para una venta en resguardo, viendo cuánto hay de
 * cada uno en total: el cliente compra producto, no un lote en particular.
 */
function SelectorProductosModal({ totales, yaAgregados, onAgregar, onCerrar }: Props) {
    const [busqueda, setBusqueda] = useState("");
    const [seleccionados, setSeleccionados] = useState<number[]>([]);
    const [verSinExistencia, setVerSinExistencia] = useState(false);

    const filtrados = useMemo(() => {
        const t = busqueda.trim().toLowerCase();
        return totales
            .filter((tp) => tp.producto.activo && (verSinExistencia || tp.kilos > 0))
            .filter((tp) => !t || `${tp.producto.talla} ${tp.producto.tipo} ${tp.proveedores.join(" ")} ${tp.camaras.join(" ")}`
                .toLowerCase().includes(t))
            .sort((a, b) => `${a.producto.tipo} ${a.producto.talla}`.localeCompare(`${b.producto.tipo} ${b.producto.talla}`, "es", { numeric: true }));
    }, [totales, busqueda, verSinExistencia]);

    const seleccionables = filtrados.filter((tp) => !yaAgregados.includes(tp.producto.id));
    const todosMarcados = seleccionables.length > 0 && seleccionables.every((tp) => seleccionados.includes(tp.producto.id));
    const elegidos = totales.filter((tp) => seleccionados.includes(tp.producto.id));
    const kilosElegidos = elegidos.reduce((acc, tp) => acc + tp.kilos, 0);

    function alternar(id: number) {
        setSeleccionados((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
    }

    function alternarTodos() {
        const ids = seleccionables.map((tp) => tp.producto.id);
        setSeleccionados((a) => (todosMarcados ? a.filter((x) => !ids.includes(x)) : [...new Set([...a, ...ids])]));
    }

    return (
        <Modal show onClose={onCerrar} title="Agregar productos a la venta en resguardo" size="modal-xl">
            <div className="d-flex flex-wrap gap-3 align-items-center mb-3">
                <BuscadorTabla valor={busqueda} onChange={setBusqueda} placeholder="Buscar por talla, tipo, proveedor o cámara..." />
                <div className="form-check mb-0">
                    <input id="ver-sin-existencia" type="checkbox" className="form-check-input" checked={verSinExistencia}
                        onChange={(e) => setVerSinExistencia(e.target.checked)} />
                    <label className="form-check-label small" htmlFor="ver-sin-existencia">Incluir productos sin existencia</label>
                </div>
                <span className="small text-body-secondary ms-auto">{filtrados.length} producto(s)</span>
            </div>

            <div className="table-responsive" style={{ maxHeight: "55vh" }}>
                <table className="table table-sm table-hover align-middle mb-0">
                    <thead className="sticky-top bg-body">
                        <tr className="small text-uppercase text-body-secondary">
                            <th style={{ width: "36px" }}>
                                <input type="checkbox" className="form-check-input" checked={todosMarcados} onChange={alternarTodos}
                                    disabled={seleccionables.length === 0} title="Seleccionar todo lo visible"
                                    aria-label="Seleccionar todos los productos visibles" />
                            </th>
                            <th>Producto</th>
                            <th className="text-end">Kg en existencia</th>
                            <th className="text-end">Cajas</th>
                            <th className="text-end">Lotes</th>
                            <th>Proveedores</th>
                            <th>Cámaras</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtrados.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center text-body-secondary py-4">Ningún producto coincide con la búsqueda.</td>
                            </tr>
                        ) : filtrados.map((tp) => {
                            const agregado = yaAgregados.includes(tp.producto.id);
                            const marcado = seleccionados.includes(tp.producto.id);
                            return (
                                <tr key={tp.producto.id}
                                    className={agregado ? "opacity-50" : marcado ? "table-active" : undefined}
                                    style={{ cursor: agregado ? "default" : "pointer" }}
                                    onClick={() => !agregado && alternar(tp.producto.id)}>
                                    <td>
                                        <input type="checkbox" className="form-check-input" checked={marcado} disabled={agregado}
                                            aria-label={`Elegir ${tp.producto.talla} ${tp.producto.tipo}`}
                                            onChange={() => alternar(tp.producto.id)} onClick={(e) => e.stopPropagation()} />
                                    </td>
                                    <td className="fw-semibold text-nowrap">
                                        {tp.producto.talla} {tp.producto.tipo}
                                        {agregado && <span className="badge text-bg-secondary ms-2">Ya agregado</span>}
                                    </td>
                                    <td className={`text-end fw-bold ${tp.kilos > 0 ? "" : "text-body-secondary"}`}>{formatearKg(tp.kilos)}</td>
                                    <td className="text-end">{tp.cajas.toLocaleString("es-MX")}</td>
                                    <td className="text-end">{tp.lotes}</td>
                                    <td className="small text-wrap">{tp.proveedores.join(", ") || "—"}</td>
                                    <td className="small text-wrap">{tp.camaras.join(", ") || "—"}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mt-3 pt-3 border-top">
                <span className="small text-body-secondary">
                    {seleccionados.length === 0
                        ? "Marca los productos que compró el cliente."
                        : `${seleccionados.length} producto(s) · ${formatearKg(kilosElegidos)} kg en existencia en total`}
                </span>
                <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-secondary" onClick={onCerrar}>Cancelar</button>
                    <button type="button" className="btn btn-primary" disabled={seleccionados.length === 0}
                        onClick={() => onAgregar(elegidos)}>
                        <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
                        Agregar {seleccionados.length > 0 ? `(${seleccionados.length})` : ""}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export default SelectorProductosModal;
