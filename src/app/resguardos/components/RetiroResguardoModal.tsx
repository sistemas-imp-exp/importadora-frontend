import { useEffect, useMemo, useState } from "react";
import Modal from "../../../shared/components/Modal";
import CampoNumero from "../../../shared/components/CampoNumero";
import LoadingButton from "../../../shared/components/LoadingButton";
import { formatearKg } from "../../../shared/utils/numeros";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import SelectorLotesModal from "../../inventario/components/salidas/SelectorLotesModal";
import { construirLotesDisponibles, type LoteDisponible } from "../../inventario/utils/lotesDisponibles";
import { formatearPeso } from "../../inventario/utils/existencias";
import type { CrearRetiroRequest, LineaResguardo, Resguardo } from "../interfaces/Resguardo";
import { obtenerLotesParaRetiro } from "../services/resguardos.service";

interface Props {
    resguardo: Resguardo;
    onCerrar: () => void;
    onRegistrar: (retiro: CrearRetiroRequest) => Promise<void>;
}

/** Un lote elegido para entregar parte del resguardo de una línea. */
interface Entrega {
    uid: number;
    lineaId: number;
    lote: LoteDisponible;
    cajas: string;
    kilos: string;
}

const CLASE_ETIQUETA = "form-label small text-uppercase fw-semibold text-body-secondary mb-1";

function hoyISO(): string {
    const hoy = new Date();
    return new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

let contadorUid = 0;

/**
 * Registro de un retiro: el cliente se lleva parte de lo que dejó guardado de
 * UNA venta. Cada producto pendiente puede surtirse de cualquier lote del mismo
 * producto (otro proveedor si hace falta, según existencias).
 */
function RetiroResguardoModal({ resguardo, onCerrar, onRegistrar }: Props) {
    const pendientes = useMemo(
        () => resguardo.lineas.filter((l) => Number(l.kilos_pendientes) > 0),
        [resguardo]
    );
    const [fecha, setFecha] = useState(hoyISO);
    const [folio, setFolio] = useState("");
    const [nota, setNota] = useState("");
    const [entregas, setEntregas] = useState<Entrega[]>([]);
    const [lotes, setLotes] = useState<LoteDisponible[] | null>(null);
    const [eligiendoPara, setEligiendoPara] = useState<LineaResguardo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);

    // Los lotes con existencia de los productos pendientes, una sola vez al abrir.
    useEffect(() => {
        let cancelado = false;
        obtenerLotesParaRetiro([...new Set(pendientes.map((l) => l.producto_id))])
            .then((datos) => { if (!cancelado) setLotes(construirLotesDisponibles(datos)); })
            .catch((e) => { if (!cancelado) { setLotes([]); setError(obtenerMensajeError(e)); } });
        return () => { cancelado = true; };
    }, [pendientes]);

    function asignado(lineaId: number): number {
        return entregas.filter((e) => e.lineaId === lineaId).reduce((acc, e) => acc + (Number(e.kilos) || 0), 0);
    }

    function agregar(linea: LineaResguardo, elegidos: LoteDisponible[]) {
        // Propone lo que falte de la línea, sin pasar de lo que tiene el lote.
        let restante = Number(linea.kilos_pendientes) - asignado(linea.id);
        const nuevas = elegidos.map((lote) => {
            const kilos = Math.max(0, Math.min(restante, Number(lote.kilosDisponibles)));
            restante -= kilos;
            const peso = Number(lote.pesoPorCaja);
            return {
                uid: ++contadorUid, lineaId: linea.id, lote,
                cajas: peso > 0 ? String(Math.floor(kilos / peso)) : "0",
                kilos: kilos ? kilos.toFixed(3) : "",
            };
        });
        setEntregas((actual) => [...actual, ...nuevas]);
        setEligiendoPara(null);
        setError(null);
    }

    function actualizar(uid: number, cambios: Partial<Entrega>) {
        setEntregas((actual) => actual.map((e) => {
            if (e.uid !== uid) return e;
            const nueva = { ...e, ...cambios };
            const peso = Number(nueva.lote.pesoPorCaja);
            if ("cajas" in cambios && Number(nueva.cajas) > 0 && peso > 0) {
                nueva.kilos = (Number(nueva.cajas) * peso).toFixed(3);
            }
            return nueva;
        }));
        setError(null);
    }

    function validar(): string | null {
        if (!fecha) return "La fecha es obligatoria.";
        if (fecha < resguardo.fecha) return "El retiro no puede ser anterior a la venta.";
        if (!folio.trim()) return "Captura el folio de la salida de cámara.";
        if (!nota.trim()) return "Captura la nota del retiro.";
        if (entregas.length === 0) return "Agrega al menos un lote de donde salga el producto.";
        for (const e of entregas) {
            if (!(Number(e.kilos) > 0)) return `Captura los kilos que salen del lote ${e.lote.loteProveedor}.`;
        }
        for (const linea of pendientes) {
            if (asignado(linea.id) > Number(linea.kilos_pendientes) + 1e-9) {
                return `De ${linea.producto} solo quedan ${formatearKg(linea.kilos_pendientes)} kg en resguardo.`;
            }
        }
        const porLote = new Map<number, { cajas: number; kilos: number; lote: LoteDisponible }>();
        for (const e of entregas) {
            const actual = porLote.get(e.lote.entradaDetalleId) ?? { cajas: 0, kilos: 0, lote: e.lote };
            porLote.set(e.lote.entradaDetalleId, {
                cajas: actual.cajas + (Number(e.cajas) || 0), kilos: actual.kilos + Number(e.kilos), lote: e.lote,
            });
        }
        for (const { cajas, kilos, lote } of porLote.values()) {
            if (cajas > lote.cajasDisponibles || kilos > Number(lote.kilosDisponibles) + 1e-9) {
                return `El lote ${lote.loteProveedor} solo tiene ${lote.cajasDisponibles} cajas · ${formatearKg(lote.kilosDisponibles)} kg.`;
            }
        }
        return null;
    }

    async function guardar() {
        const mensaje = validar();
        if (mensaje) {
            setError(mensaje);
            return;
        }
        setGuardando(true);
        try {
            await onRegistrar({
                venta: resguardo.id,
                fecha,
                folio_de_salida: folio.trim().toUpperCase(),
                notas: nota.trim().toUpperCase(),
                detalles: entregas.map((e) => ({
                    retiro_de: e.lineaId,
                    entrada_detalle: e.lote.entradaDetalleId,
                    cajas: Number(e.cajas) || 0,
                    total_kilos: Number(e.kilos),
                })),
            });
        } catch (e) {
            setError(obtenerMensajeError(e));
        } finally {
            setGuardando(false);
        }
    }

    const lotesDe = (linea: LineaResguardo) => (lotes ?? []).filter((l) => l.productoId === linea.producto_id);

    return (
        <>
            <Modal
                show={eligiendoPara === null}
                onClose={onCerrar}
                closeDisabled={guardando}
                size="modal-xl"
                title={`Registrar retiro · ${resguardo.cliente.nombre}`}
            >
                <p className="small text-body-secondary mb-3">
                    Venta <strong>{resguardo.folio_de_salida}</strong> · nota <strong>{resguardo.notas}</strong>. El producto
                    puede salir de cualquier lote del mismo producto, aunque sea de otro proveedor. No se cobra de nuevo:
                    ya se cobró en la venta.
                </p>

                <div className="row g-3 mb-3">
                    <div className="col-12 col-md-4">
                        <label className={CLASE_ETIQUETA} htmlFor="retiro-fecha">Fecha <span className="text-danger">*</span></label>
                        <input id="retiro-fecha" type="date" className="form-control form-control-sm" value={fecha}
                            min={resguardo.fecha} onChange={(e) => setFecha(e.target.value)} />
                    </div>
                    <div className="col-6 col-md-4">
                        <label className={CLASE_ETIQUETA} htmlFor="retiro-folio">Folio salida de cámara <span className="text-danger">*</span></label>
                        <input id="retiro-folio" className="form-control form-control-sm" placeholder="Ej. SI5358"
                            value={folio} onChange={(e) => setFolio(e.target.value)} />
                    </div>
                    <div className="col-6 col-md-4">
                        <label className={CLASE_ETIQUETA} htmlFor="retiro-nota">Nota <span className="text-danger">*</span></label>
                        <input id="retiro-nota" className="form-control form-control-sm" placeholder="Ej. 1584/24B"
                            value={nota} onChange={(e) => setNota(e.target.value)} />
                    </div>
                </div>

                {pendientes.map((linea) => {
                    const deLinea = entregas.filter((e) => e.lineaId === linea.id);
                    const kilosAsignados = asignado(linea.id);
                    const excedido = kilosAsignados > Number(linea.kilos_pendientes) + 1e-9;
                    return (
                        <section key={linea.id} className="border rounded p-2 mb-3">
                            <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between mb-2">
                                <div>
                                    <span className="fw-semibold">{linea.producto}</span>
                                    <span className="small text-body-secondary ms-2">
                                        Pendiente {formatearKg(linea.kilos_pendientes)} kg
                                    </span>
                                    <span className={`badge ms-2 border ${excedido ? "bg-danger-subtle text-danger-emphasis border-danger-subtle" : "text-bg-light"}`}>
                                        A entregar {formatearKg(kilosAsignados)} kg
                                    </span>
                                </div>
                                <button type="button" className="btn btn-sm btn-outline-primary" disabled={lotes === null}
                                    onClick={() => setEligiendoPara(linea)}>
                                    <i className="bi bi-search me-1" aria-hidden="true"></i>
                                    {lotes === null ? "Cargando lotes..." : "Elegir lote"}
                                </button>
                            </div>
                            {deLinea.length > 0 && (
                                <div className="table-responsive">
                                    <table className="table table-sm align-middle mb-0">
                                        <thead>
                                            <tr className="small text-uppercase text-body-secondary">
                                                <th>Proveedor · lote</th>
                                                <th>Cámara</th>
                                                <th className="text-end">Peso/caja</th>
                                                <th className="text-end">Disponible</th>
                                                <th className="text-end" style={{ width: "7rem" }}>Cajas</th>
                                                <th className="text-end" style={{ width: "9rem" }}>Kilos</th>
                                                <th style={{ width: "40px" }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {deLinea.map((e) => (
                                                <tr key={e.uid}>
                                                    <td className="text-wrap">
                                                        <div className="fw-semibold">{e.lote.proveedorNombre}</div>
                                                        <div className="small text-body-secondary">
                                                            lote {e.lote.loteProveedor}{e.lote.factura ? ` · ${e.lote.factura}` : ""}
                                                        </div>
                                                    </td>
                                                    <td className="small">{e.lote.camaraNombre}</td>
                                                    <td className="text-end small">{formatearPeso(Number(e.lote.pesoPorCaja))} kg</td>
                                                    <td className="text-end small text-body-secondary">
                                                        {e.lote.cajasDisponibles} cj · {formatearKg(e.lote.kilosDisponibles)} kg
                                                    </td>
                                                    <td>
                                                        <CampoNumero decimales={0} className="form-control form-control-sm text-end"
                                                            aria-label="Cajas" value={e.cajas} onChange={(v) => actualizar(e.uid, { cajas: v })} />
                                                    </td>
                                                    <td>
                                                        <CampoNumero decimales={3} className="form-control form-control-sm text-end fw-bold"
                                                            aria-label="Kilos" value={e.kilos} onChange={(v) => actualizar(e.uid, { kilos: v })} />
                                                    </td>
                                                    <td>
                                                        <button type="button" className="btn btn-sm btn-outline-danger"
                                                            aria-label={`Quitar lote ${e.lote.loteProveedor}`} title="Quitar"
                                                            onClick={() => setEntregas((a) => a.filter((x) => x.uid !== e.uid))}>
                                                            <i className="bi bi-trash" aria-hidden="true"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    );
                })}

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
                        <LoadingButton isLoading text="Registrando..." onClick={() => Promise.resolve()} />
                    ) : (
                        <button type="button" className="btn btn-primary" onClick={guardar}>
                            <i className="bi bi-box-arrow-right me-1" aria-hidden="true"></i>Registrar retiro
                        </button>
                    )}
                </div>
            </Modal>

            {eligiendoPara && (
                <SelectorLotesModal
                    show
                    titulo={`Lotes de ${eligiendoPara.producto}`}
                    lotes={lotesDe(eligiendoPara)}
                    yaAgregados={entregas.filter((e) => e.lineaId === eligiendoPara.id).map((e) => e.lote.entradaDetalleId)}
                    onAgregar={(elegidos) => agregar(eligiendoPara, elegidos)}
                    onCerrar={() => setEligiendoPara(null)}
                />
            )}
        </>
    );
}

export default RetiroResguardoModal;
