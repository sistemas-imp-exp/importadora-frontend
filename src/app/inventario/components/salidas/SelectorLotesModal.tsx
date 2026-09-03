import { useEffect, useMemo, useState } from "react";
import Modal from "../../../../shared/components/Modal";
import BuscadorTabla from "../../../../shared/components/BuscadorTabla";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import { loteCoincide, type LoteDisponible } from "../../utils/lotesDisponibles";

interface SelectorLotesModalProps {
    show: boolean;
    lotes: LoteDisponible[];
    /** Ids de lotes que ya están en la salida: se muestran pero no se pueden re-agregar. */
    yaAgregados: number[];
    onAgregar: (lotes: LoteDisponible[]) => void;
    onCerrar: () => void;
}

function SelectorLotesModal({ show, lotes, yaAgregados, onAgregar, onCerrar }: SelectorLotesModalProps) {
    const [busqueda, setBusqueda] = useState("");
    const [seleccionados, setSeleccionados] = useState<number[]>([]);

    // Cada apertura empieza limpia: lo elegido la vez pasada ya está en la tabla.
    useEffect(() => {
        if (show) {
            setBusqueda("");
            setSeleccionados([]);
        }
    }, [show]);

    const filtrados = useMemo(() => lotes.filter((lote) => loteCoincide(lote, busqueda)), [lotes, busqueda]);

    const seleccionables = filtrados.filter((lote) => !yaAgregados.includes(lote.entradaDetalleId));
    const todosMarcados = seleccionables.length > 0 && seleccionables.every((l) => seleccionados.includes(l.entradaDetalleId));

    function alternar(id: number) {
        setSeleccionados((actual) =>
            actual.includes(id) ? actual.filter((i) => i !== id) : [...actual, id]
        );
    }

    function alternarTodos() {
        const ids = seleccionables.map((l) => l.entradaDetalleId);
        setSeleccionados((actual) =>
            todosMarcados ? actual.filter((i) => !ids.includes(i)) : Array.from(new Set([...actual, ...ids]))
        );
    }

    function confirmar() {
        const elegidos = lotes.filter((l) => seleccionados.includes(l.entradaDetalleId));
        if (elegidos.length === 0) return;
        onAgregar(elegidos);
    }

    const totalCajas = lotes
        .filter((l) => seleccionados.includes(l.entradaDetalleId))
        .reduce((acc, l) => acc + l.cajasDisponibles, 0);

    return (
        <Modal show={show} onClose={onCerrar} title="Agregar productos a la salida" size="modal-xl">
            <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
                <BuscadorTabla
                    valor={busqueda}
                    onChange={setBusqueda}
                    placeholder="Buscar por factura, recibo de ingreso, lote, talla..."
                />
                <span className="small text-body-secondary">
                    {filtrados.length} lote(s) con existencia
                </span>
            </div>

            <div className="table-responsive" style={{ maxHeight: "55vh" }}>
                <table className="table table-sm table-hover align-middle mb-0">
                    <thead className="sticky-top bg-body">
                        <tr className="small text-uppercase text-body-secondary">
                            <th style={{ width: "36px" }}>
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={todosMarcados}
                                    onChange={alternarTodos}
                                    disabled={seleccionables.length === 0}
                                    title="Seleccionar todo lo visible"
                                />
                            </th>
                            <th>Factura</th>
                            <th>Recibo</th>
                            <th>Producto</th>
                            <th>Lote</th>
                            <th>Cámara</th>
                            <th>Proveedor</th>
                            <th className="text-end">Cajas disp.</th>
                            <th className="text-end">Kg disp.</th>
                            <th>Caducidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtrados.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="text-center text-muted py-4">
                                    {lotes.length === 0
                                        ? "No hay lotes con existencia."
                                        : "Ninguna factura, recibo o producto coincide con la búsqueda."}
                                </td>
                            </tr>
                        ) : (
                            filtrados.map((lote) => {
                                const agregado = yaAgregados.includes(lote.entradaDetalleId);
                                const marcado = seleccionados.includes(lote.entradaDetalleId);
                                return (
                                    <tr
                                        key={lote.entradaDetalleId}
                                        className={agregado ? "opacity-50" : marcado ? "table-active" : undefined}
                                        onClick={() => !agregado && alternar(lote.entradaDetalleId)}
                                        style={{ cursor: agregado ? "default" : "pointer" }}
                                    >
                                        <td>
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={marcado}
                                                disabled={agregado}
                                                onChange={() => alternar(lote.entradaDetalleId)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </td>
                                        <td className="text-wrap small">{lote.factura || "—"}</td>
                                        <td className="text-wrap small">{lote.recibo || "—"}</td>
                                        <td className="text-wrap fw-semibold">
                                            {lote.productoNombre}
                                            {agregado && (
                                                <span className="badge text-bg-secondary ms-2">Ya agregado</span>
                                            )}
                                        </td>
                                        <td className="text-wrap small">{lote.loteProveedor}</td>
                                        <td className="text-wrap small">{lote.camaraNombre}</td>
                                        <td className="text-wrap small">{lote.proveedorNombre}</td>
                                        <td className="text-end fw-bold">{lote.cajasDisponibles}</td>
                                        <td className="text-end">{lote.kilosDisponibles}</td>
                                        <td className="text-wrap small">
                                            {lote.fechaCaducidad
                                                ? formatearFechaNumerica(new Date(lote.fechaCaducidad + "T00:00:00"))
                                                : "—"}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mt-3 pt-3 border-top">
                <span className="small text-body-secondary">
                    {seleccionados.length === 0
                        ? "Marca los lotes que vas a surtir."
                        : `${seleccionados.length} lote(s) seleccionado(s) · ${totalCajas} cajas disponibles en total`}
                </span>
                <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-secondary" onClick={onCerrar}>
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={confirmar}
                        disabled={seleccionados.length === 0}
                    >
                        <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
                        Agregar {seleccionados.length > 0 ? `(${seleccionados.length})` : ""}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export default SelectorLotesModal;
