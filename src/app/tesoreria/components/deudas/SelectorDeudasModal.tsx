import { useEffect, useMemo, useState } from "react";
import Modal from "../../../../shared/components/Modal";
import BuscadorTabla from "../../../../shared/components/BuscadorTabla";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import type { Deuda } from "../../interfaces/deudas/Deuda";
import { obtenerDeudas } from "../../services/deudas.service";
import { fechaDeISO, formatearDineroDivisa } from "../../utils/deudas";

interface SelectorDeudasModalProps {
    show: boolean;
    /** Ids de deudas que ya están en el movimiento: se muestran pero no se pueden re-agregar. */
    yaAgregadas: number[];
    /** Divisa ya fijada por las deudas del movimiento: las de otra divisa no se pueden marcar. */
    divisaId: number | null;
    onAgregar: (deudas: Deuda[]) => void;
    onCerrar: () => void;
}

/**
 * Abono a deudas: todas las deudas abiertas en una tabla con buscador y
 * casillas, para marcar una o varias (como el selector de lotes de Salidas).
 */
function SelectorDeudasModal({ show, ...props }: SelectorDeudasModalProps) {
    // El Modal no monta su contenido cerrado: cada apertura empieza de cero.
    return (
        <Modal show={show} onClose={props.onCerrar} title="Abono a deudas" size="modal-xl">
            <Selector {...props} />
        </Modal>
    );
}

function texto(valor: string): string {
    return valor.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function Selector({ yaAgregadas, divisaId, onAgregar, onCerrar }: Omit<SelectorDeudasModalProps, "show">) {
    const [deudas, setDeudas] = useState<Deuda[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busqueda, setBusqueda] = useState("");
    const [seleccionadas, setSeleccionadas] = useState<number[]>([]);

    useEffect(() => {
        obtenerDeudas({ estado: "abierta" })
            .then((lista) => setDeudas([...lista].sort(
                (a, b) => a.deudor.nombre.localeCompare(b.deudor.nombre, "es") || a.fecha.localeCompare(b.fecha),
            )))
            .catch((err) => setError(obtenerMensajeError(err)))
            .finally(() => setCargando(false));
    }, []);

    const filtradas = useMemo(() => {
        const q = texto(busqueda.trim());
        if (!q) return deudas;
        return deudas.filter((d) => texto(`${d.deudor.nombre} ${d.concepto} ${d.divisa.codigo}`).includes(q));
    }, [deudas, busqueda]);

    // La divisa la fija lo ya agregado o, si no hay nada, la primera deuda marcada.
    const divisaFija = divisaId ?? deudas.find((d) => seleccionadas.includes(d.id))?.divisa.id ?? null;

    function bloqueo(deuda: Deuda): string | null {
        if (yaAgregadas.includes(deuda.id)) return "Ya agregada";
        if (divisaFija !== null && deuda.divisa.id !== divisaFija && !seleccionadas.includes(deuda.id)) return "Otra divisa";
        return null;
    }

    const seleccionables = filtradas.filter((d) => !bloqueo(d));
    const todasMarcadas = seleccionables.length > 0 && seleccionables.every((d) => seleccionadas.includes(d.id));

    function alternar(id: number) {
        setSeleccionadas((actual) => (actual.includes(id) ? actual.filter((i) => i !== id) : [...actual, id]));
    }

    function alternarTodas() {
        const ids = seleccionables.map((d) => d.id);
        setSeleccionadas((actual) =>
            todasMarcadas ? actual.filter((i) => !ids.includes(i)) : Array.from(new Set([...actual, ...ids])),
        );
    }

    const elegidas = deudas.filter((d) => seleccionadas.includes(d.id));
    const saldoElegido = elegidas.reduce((acc, d) => acc + Number(d.saldo), 0);
    // Marcar todo solo tiene sentido dentro de una sola divisa.
    const variasDivisas = new Set(seleccionables.map((d) => d.divisa.id)).size > 1;

    return (
        <>
            <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
                <BuscadorTabla valor={busqueda} onChange={setBusqueda} placeholder="Buscar por persona o concepto..." />
                <span className="small text-body-secondary">{filtradas.length} deuda(s) abierta(s)</span>
            </div>

            {error && <div className="alert alert-danger py-2">{error}</div>}

            <div className="table-responsive" style={{ maxHeight: "55vh" }}>
                <table className="table table-sm table-hover align-middle mb-0">
                    <thead className="sticky-top bg-body">
                        <tr className="small text-uppercase text-body-secondary">
                            <th style={{ width: "36px" }}>
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={todasMarcadas}
                                    onChange={alternarTodas}
                                    disabled={seleccionables.length === 0 || variasDivisas}
                                    title={variasDivisas ? "Hay deudas en varias divisas: márcalas una por una" : "Seleccionar todo lo visible"}
                                />
                            </th>
                            <th>Persona</th>
                            <th>Concepto</th>
                            <th>Fecha</th>
                            <th>Divisa</th>
                            <th className="text-end">Total</th>
                            <th className="text-end">Abonado</th>
                            <th className="text-end">Saldo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cargando ? (
                            <tr><td colSpan={8} className="text-center text-muted py-4">Cargando...</td></tr>
                        ) : filtradas.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center text-muted py-4">
                                    {deudas.length === 0 ? "No hay deudas abiertas." : "Ninguna persona o concepto coincide con la búsqueda."}
                                </td>
                            </tr>
                        ) : (
                            filtradas.map((d) => {
                                const motivo = bloqueo(d);
                                const marcada = seleccionadas.includes(d.id);
                                const simbolo = d.divisa.simbolo;
                                return (
                                    <tr
                                        key={d.id}
                                        className={motivo ? "opacity-50" : marcada ? "table-active" : undefined}
                                        onClick={() => !motivo && alternar(d.id)}
                                        style={{ cursor: motivo ? "default" : "pointer" }}
                                    >
                                        <td>
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                aria-label={`Elegir ${d.concepto} de ${d.deudor.nombre}`}
                                                checked={marcada}
                                                disabled={!!motivo}
                                                onChange={() => alternar(d.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </td>
                                        <td className="text-wrap fw-semibold">{d.deudor.nombre}</td>
                                        <td className="text-wrap">
                                            {d.concepto}
                                            {motivo && <span className="badge text-bg-secondary ms-2">{motivo}</span>}
                                        </td>
                                        <td className="text-nowrap small">{formatearFechaNumerica(fechaDeISO(d.fecha))}</td>
                                        <td className="small">{d.divisa.codigo}</td>
                                        <td className="text-end">{formatearDineroDivisa(simbolo, d.total)}</td>
                                        <td className="text-end">{formatearDineroDivisa(simbolo, d.abonado)}</td>
                                        <td className="text-end fw-bold">{formatearDineroDivisa(simbolo, d.saldo)}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mt-3 pt-3 border-top">
                <span className="small text-body-secondary">
                    {elegidas.length === 0
                        ? "Marca las deudas que abona este movimiento."
                        : `${elegidas.length} deuda(s) seleccionada(s) · saldo ${formatearDineroDivisa(elegidas[0].divisa.simbolo, saldoElegido)} ${elegidas[0].divisa.codigo} en total`}
                </span>
                <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-secondary" onClick={onCerrar}>
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => elegidas.length && onAgregar(elegidas)}
                        disabled={elegidas.length === 0}
                    >
                        <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
                        Agregar {elegidas.length > 0 ? `(${elegidas.length})` : ""}
                    </button>
                </div>
            </div>
        </>
    );
}

export default SelectorDeudasModal;
