import { useState } from "react";
import Modal from "../../../shared/components/Modal";
import LoadingButton from "../../../shared/components/LoadingButton";
import { formatearFechaNumerica } from "../../../shared/utils/fechas";
import { formatearKg } from "../../../shared/utils/numeros";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import type { EntregaCapturada, LigarEntregaRequest, Resguardo } from "../interfaces/Resguardo";
import { obtenerEntregasCapturadas } from "../services/resguardos.service";

interface Props {
    resguardo: Resguardo;
    onCerrar: () => void;
    onLigar: (datos: LigarEntregaRequest) => Promise<void>;
}

const CLASE_ETIQUETA = "form-label small text-uppercase fw-semibold text-body-secondary mb-1";

/**
 * Entrega que Inventario ya capturó como salida de cámara normal (línea sin
 * precio): se liga como retiro de esta venta en vez de registrar otro, que la
 * descontaría dos veces. Lote, kilos y existencias no cambian.
 */
function LigarEntregaModal({ resguardo, onCerrar, onLigar }: Props) {
    const [folio, setFolio] = useState("");
    const [buscado, setBuscado] = useState("");
    const [candidatas, setCandidatas] = useState<EntregaCapturada[] | null>(null);
    const [elegidas, setElegidas] = useState<Set<number>>(new Set());
    const [buscando, setBuscando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const lineaDe = (productoId: number) => resguardo.lineas.find((l) => l.producto_id === productoId);

    async function buscar() {
        const valor = folio.trim().toUpperCase();
        if (!valor) return setError("Captura el folio de la salida de cámara.");
        setBuscando(true);
        setError(null);
        try {
            const datos = await obtenerEntregasCapturadas(resguardo.id, valor);
            setCandidatas(datos);
            setBuscado(valor);
            setElegidas(new Set(datos.map((d) => d.id)));
        } catch (e) {
            setError(obtenerMensajeError(e));
        } finally {
            setBuscando(false);
        }
    }

    function alternar(id: number) {
        setElegidas((a) => {
            const nuevo = new Set(a);
            if (nuevo.has(id)) nuevo.delete(id);
            else nuevo.add(id);
            return nuevo;
        });
    }

    // Lo que se ligaría por producto contra lo que queda pendiente.
    const excedidos = resguardo.lineas.filter((l) => {
        const kilos = (candidatas ?? []).filter((c) => elegidas.has(c.id) && c.producto_id === l.producto_id)
            .reduce((acc, c) => acc + Number(c.kilos), 0);
        return kilos > Number(l.kilos_pendientes) + 0.0005;
    });

    async function guardar() {
        const lineas = (candidatas ?? []).filter((c) => elegidas.has(c.id));
        if (lineas.length === 0) return setError("Elige al menos una línea a ligar.");
        if (excedidos.length > 0) return setError(`Se ligaría más de lo pendiente de ${excedidos.map((l) => l.producto).join(", ")}.`);
        setGuardando(true);
        setError(null);
        try {
            await onLigar({
                venta: resguardo.id,
                folio_de_salida: buscado,
                lineas: lineas.map((c) => ({ linea: c.id, retiro_de: lineaDe(c.producto_id)!.id })),
            });
        } catch (e) {
            setError(obtenerMensajeError(e));
            setGuardando(false);
        }
    }

    return (
        <Modal show onClose={onCerrar} title={`Ligar entrega ya capturada · ${resguardo.cliente.nombre}`} size="modal-lg">
            <p className="small text-body-secondary">
                Venta {resguardo.folio_de_salida ? <strong>{resguardo.folio_de_salida}</strong> : <strong>sin salida</strong>} ·
                nota <strong>{resguardo.notas}</strong>. Si Inventario ya capturó la entrega en Salidas (sin precio), aquí se liga
                a este resguardo: no se vuelve a descontar de existencias y deja de contar como venta.
            </p>

            <div className="row g-2 align-items-end mb-3">
                <div className="col-sm-6">
                    <label className={CLASE_ETIQUETA} htmlFor="ligar-folio">Folio salida de cámara</label>
                    <input id="ligar-folio" className="form-control" value={folio} placeholder="SI..."
                        onChange={(e) => setFolio(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") buscar(); }} />
                </div>
                <div className="col-sm-auto">
                    <button type="button" className="btn btn-outline-primary" onClick={buscar} disabled={buscando}>
                        <i className="bi bi-search me-1" aria-hidden="true"></i>{buscando ? "Buscando..." : "Buscar"}
                    </button>
                </div>
            </div>

            {candidatas && candidatas.length === 0 && (
                <div className="alert alert-light border small mb-3">
                    La salida {buscado} no tiene líneas sin precio de los productos de este resguardo para este cliente.
                </div>
            )}

            {candidatas && candidatas.length > 0 && (
                <div className="table-responsive mb-3">
                    <table className="table table-sm align-middle mb-0">
                        <thead>
                            <tr className="small text-uppercase text-body-secondary">
                                <th style={{ width: "2rem" }}></th>
                                <th>Producto</th>
                                <th>Fecha · nota</th>
                                <th>Proveedor · lote</th>
                                <th>Cámara</th>
                                <th className="text-end">Cajas</th>
                                <th className="text-end">Kilos</th>
                                <th className="text-end">Pendiente</th>
                            </tr>
                        </thead>
                        <tbody>
                            {candidatas.map((c) => (
                                <tr key={c.id}>
                                    <td>
                                        <input type="checkbox" className="form-check-input" checked={elegidas.has(c.id)}
                                            aria-label={`Ligar ${c.producto} ${c.kilos} kg`} onChange={() => alternar(c.id)} />
                                    </td>
                                    <td className="fw-semibold">{c.producto}</td>
                                    <td className="small text-nowrap">
                                        {formatearFechaNumerica(new Date(c.fecha + "T00:00:00"))} · {c.notas}
                                    </td>
                                    <td className="small">{c.proveedor} · lote {c.lote_proveedor}</td>
                                    <td className="small">{c.camara}</td>
                                    <td className="text-end">{c.cajas.toLocaleString("es-MX")}</td>
                                    <td className="text-end fw-semibold">{formatearKg(c.kilos)}</td>
                                    <td className="text-end small text-body-secondary">
                                        {formatearKg(lineaDe(c.producto_id)?.kilos_pendientes ?? "0")}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {error && (
                <div className="text-danger small fw-semibold mb-2">
                    <i className="bi bi-exclamation-circle-fill me-1" aria-hidden="true"></i>{error}
                </div>
            )}

            <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                <button type="button" className="btn btn-outline-secondary" onClick={onCerrar} disabled={guardando}>
                    Cancelar
                </button>
                {guardando ? (
                    <LoadingButton isLoading text="Ligando..." onClick={() => Promise.resolve()} />
                ) : (
                    <button type="button" className="btn btn-primary" onClick={guardar} disabled={!candidatas?.length}>
                        <i className="bi bi-link-45deg me-1" aria-hidden="true"></i>Ligar entrega
                    </button>
                )}
            </div>
        </Modal>
    );
}

export default LigarEntregaModal;
