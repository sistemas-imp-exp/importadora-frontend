import { useEffect, useMemo, useState } from "react";
import LoadingButton from "../../../../shared/components/LoadingButton";
import SelectorLotesModal from "./SelectorLotesModal";
import { construirLotesDisponibles, type LoteDisponible } from "../../utils/lotesDisponibles";
import type { CrearSalidaLineaRequest, CrearSalidaRequest, SalidaApi } from "../../interfaces/salidas/Salida";
import type { ExistenciaApi } from "../../interfaces/existencias/Existencia";
import type { Cliente } from "../../interfaces/clientes/Cliente";

interface SalidaFormProps {
    clientes: Cliente[];
    existencias: ExistenciaApi[];
    salida?: SalidaApi | null;
    onGuardar: (salida: CrearSalidaRequest) => Promise<void>;
    onCancelar?: () => void;
}

interface LineaForm {
    id?: number;
    entrada_detalle: number;
    producto_id: number;
    // La cámara NO se captura aquí: la hereda el backend del lote de origen
    // (ver SalidaSerializer). Cambiarla es exclusivo de Movimientos entre cámaras.
    cajas: string;
    peso_por_caja: string;
    total_kilos: string;
    precio_x_kilo: string;
    total_venta: string;
    notas: string;
}

const CLASE_ETIQUETA = "form-label small text-uppercase fw-semibold text-body-secondary mb-1";

function cabeceraVacia() {
    return { folio_de_salida: "", cliente_id: 0, fecha: "", notas: "" };
}

function SalidaForm({ clientes, existencias, salida, onGuardar, onCancelar }: SalidaFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cabecera, setCabecera] = useState(cabeceraVacia());
    const [lineas, setLineas] = useState<LineaForm[]>([]);
    const [modalAbierto, setModalAbierto] = useState(false);

    // Al editar, esta salida ya tenía reservadas ciertas cajas de sus lotes: se le
    // suman de vuelta a lo disponible, porque al guardar se reemplazan, no se suman.
    const yaReservado = useMemo(() => {
        const mapa: Record<number, number> = {};
        if (salida) {
            for (const d of salida.detalles) {
                mapa[d.entrada_detalle] = (mapa[d.entrada_detalle] ?? 0) + d.cajas;
            }
        }
        return mapa;
    }, [salida]);

    const lotesDisponibles = useMemo(
        () => construirLotesDisponibles(existencias, yaReservado),
        [existencias, yaReservado]
    );

    const loteDe = (entradaDetalleId: number): LoteDisponible | null =>
        lotesDisponibles.find((l) => l.entradaDetalleId === entradaDetalleId) ?? null;

    useEffect(() => {
        if (salida) {
            setCabecera({
                folio_de_salida: salida.folio_de_salida,
                cliente_id: salida.cliente?.id ?? 0,
                fecha: salida.fecha,
                notas: salida.notas,
            });
            setLineas(
                salida.detalles.map((d) => {
                    const lote = existencias.find((e) => e.detalle_id === d.entrada_detalle);
                    return {
                        id: d.id,
                        entrada_detalle: d.entrada_detalle,
                        producto_id: d.producto.id,
                        cajas: String(d.cajas),
                        peso_por_caja: lote?.peso_por_caja ?? "",
                        total_kilos: d.total_kilos,
                        precio_x_kilo: d.precio_x_kilo ?? "",
                        total_venta: d.total_venta ?? "",
                        notas: d.notas ?? "",
                    };
                })
            );
        } else {
            setCabecera(cabeceraVacia());
            setLineas([]);
        }
        setError(null);
    }, [salida, existencias]);

    function actualizarLinea(index: number, cambios: Partial<LineaForm>) {
        setLineas((actual) =>
            actual.map((linea, i) => {
                if (i !== index) return linea;
                const nueva = { ...linea, ...cambios };

                if ("cajas" in cambios || "peso_por_caja" in cambios) {
                    const cajas = Number(nueva.cajas);
                    const pesoPorCaja = Number(nueva.peso_por_caja);
                    if (cajas > 0 && pesoPorCaja > 0) {
                        nueva.total_kilos = (cajas * pesoPorCaja).toFixed(2);
                    }
                }

                if ("total_kilos" in cambios || "precio_x_kilo" in cambios) {
                    const kilos = Number(nueva.total_kilos);
                    const precio = Number(nueva.precio_x_kilo);
                    if (kilos > 0 && precio > 0) {
                        nueva.total_venta = (kilos * precio).toFixed(2);
                    }
                }
                return nueva;
            })
        );
    }

    /**
     * Las cajas se topan a la existencia del lote. Se avisa en vez de recortar
     * en silencio: capear sin decirlo hace creer que se registró lo tecleado.
     */
    function cambiarCajas(index: number, valor: string) {
        const lote = loteDe(lineas[index].entrada_detalle);
        const pedidas = Number(valor);

        if (lote && pedidas > lote.cajasDisponibles) {
            setError(
                `${lote.productoNombre} (lote ${lote.loteProveedor}): ` +
                `solo hay ${lote.cajasDisponibles} cajas disponibles, se ajustó a ese máximo.`
            );
            actualizarLinea(index, { cajas: String(lote.cajasDisponibles) });
            return;
        }

        setError(null);
        actualizarLinea(index, { cajas: valor });
    }

    function agregarLotes(elegidos: LoteDisponible[]) {
        setLineas((actual) => [
            ...actual,
            ...elegidos.map((lote) => ({
                entrada_detalle: lote.entradaDetalleId,
                producto_id: lote.productoId,
                cajas: "",
                peso_por_caja: lote.pesoPorCaja ?? "",
                total_kilos: "",
                precio_x_kilo: lote.precioVentaPlaneado ?? "",
                total_venta: "",
                notas: "",
            })),
        ]);
        setModalAbierto(false);
        setError(null);
    }

    function quitarLinea(index: number) {
        setLineas((actual) => actual.filter((_, i) => i !== index));
    }

    function validar(): string | null {
        if (!cabecera.folio_de_salida.trim()) return "El folio de salida es obligatorio.";
        if (!cabecera.cliente_id) return "Seleccione un cliente.";
        if (!cabecera.fecha) return "La fecha es obligatoria.";
        if (lineas.length === 0) return "Agrega al menos un producto con el buscador de facturas o recibos.";

        for (const linea of lineas) {
            const lote = loteDe(linea.entrada_detalle);
            const etiqueta = lote ? lote.productoNombre : "una de las líneas";
            if (!linea.cajas || Number(linea.cajas) <= 0) return `Ingresa las cajas de ${etiqueta}.`;
            if (!linea.total_kilos || Number(linea.total_kilos) <= 0) return `Ingresa el total de kilos de ${etiqueta}.`;
            if (lote && Number(linea.cajas) > lote.cajasDisponibles) {
                return `${etiqueta}: solo hay ${lote.cajasDisponibles} cajas disponibles.`;
            }
        }
        return null;
    }

    async function guardar(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const mensaje = validar();
        if (mensaje) {
            setError(mensaje);
            return;
        }

        const payload: CrearSalidaRequest = {
            folio_de_salida: cabecera.folio_de_salida.trim().toUpperCase(),
            cliente_id: cabecera.cliente_id,
            fecha: cabecera.fecha,
            notas: cabecera.notas.trim().toUpperCase(),
            detalles: lineas.map((linea): CrearSalidaLineaRequest => ({
                ...(linea.id ? { id: linea.id } : {}),
                producto_id: linea.producto_id,
                entrada_detalle: linea.entrada_detalle,
                cajas: Number(linea.cajas),
                total_kilos: Number(linea.total_kilos),
                precio_x_kilo: linea.precio_x_kilo === "" ? null : Number(linea.precio_x_kilo),
                total_venta: linea.total_venta === "" ? null : Number(linea.total_venta),
                notas: linea.notas.trim().toUpperCase(),
            })),
        };

        setIsLoading(true);
        try {
            await onGuardar(payload);
            if (!salida) {
                setCabecera(cabeceraVacia());
                setLineas([]);
            }
        } catch {
            // El error ya se muestra vía toast en la vista; el formulario conserva los datos para corregir.
        } finally {
            setIsLoading(false);
        }
    }

    const totalCajas = lineas.reduce((acc, l) => acc + (Number(l.cajas) || 0), 0);
    const totalKilos = lineas.reduce((acc, l) => acc + (Number(l.total_kilos) || 0), 0);
    const totalVenta = lineas.reduce((acc, l) => acc + (Number(l.total_venta) || 0), 0);

    return (
        <div className={`card card-outline mb-3 ${salida ? "card-warning" : "card-primary"}`}>
            <div className="card-header d-flex flex-wrap gap-2 justify-content-between align-items-center">
                <h3 className="card-title fs-6 fw-bold m-0">
                    {salida ? `Editando salida ${salida.folio_de_salida}` : "Registrar salida"}
                </h3>
            </div>

            <form onSubmit={guardar}>
                <div className="card-body">
                    {/* ---------- Datos de la salida ---------- */}
                    <section className="mb-4">
                        <h6 className="d-flex align-items-center gap-2 fw-bold border-bottom pb-2 mb-3">
                            <i className="bi bi-box-arrow-up text-body-secondary" aria-hidden="true"></i>
                            Datos de la salida
                        </h6>

                        <div className="row g-3">
                            <div className="col-12 col-sm-6 col-lg-3">
                                <label className={CLASE_ETIQUETA}>
                                    Folio de salida <span className="text-danger">*</span>
                                </label>
                                <input
                                    className="form-control form-control-sm"
                                    value={cabecera.folio_de_salida}
                                    onChange={(e) => setCabecera({ ...cabecera, folio_de_salida: e.target.value })}
                                />
                            </div>
                            <div className="col-12 col-sm-6 col-lg-3">
                                <label className={CLASE_ETIQUETA}>
                                    Cliente <span className="text-danger">*</span>
                                </label>
                                <select
                                    className="form-select form-select-sm"
                                    value={cabecera.cliente_id}
                                    onChange={(e) => setCabecera({ ...cabecera, cliente_id: Number(e.target.value) })}
                                >
                                    <option value={0}>Seleccione cliente...</option>
                                    {clientes.map((c) => (
                                        <option key={c.id} value={c.id} disabled={!c.activo}>{c.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-12 col-sm-6 col-lg-3">
                                <label className={CLASE_ETIQUETA}>
                                    Fecha <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={cabecera.fecha}
                                    onChange={(e) => setCabecera({ ...cabecera, fecha: e.target.value })}
                                />
                            </div>
                            <div className="col-12 col-sm-6 col-lg-3">
                                <label className={CLASE_ETIQUETA}>Notas (folio interno)</label>
                                <input
                                    className="form-control form-control-sm"
                                    value={cabecera.notas}
                                    onChange={(e) => setCabecera({ ...cabecera, notas: e.target.value })}
                                />
                            </div>
                        </div>
                    </section>

                    {/* ---------- Productos a surtir ---------- */}
                    <section>
                        <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center border-bottom pb-2 mb-3">
                            <h6 className="d-flex align-items-center gap-2 fw-bold mb-0">
                                <i className="bi bi-list-check text-body-secondary" aria-hidden="true"></i>
                                Productos a surtir
                                <span className="badge text-bg-secondary">{lineas.length}</span>
                            </h6>
                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setModalAbierto(true)}>
                                <i className="bi bi-search me-1" aria-hidden="true"></i>
                                Buscar por factura o recibo
                            </button>
                        </div>

                        {lineas.length === 0 ? (
                            <div className="text-center text-body-secondary py-4 small">
                                Aún no hay productos. Usa <strong>Buscar por factura o recibo</strong> para elegir
                                los lotes de dónde va a salir la mercancía.
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-sm align-middle mb-0">
                                    <thead>
                                        <tr className="small text-uppercase text-body-secondary">
                                            <th>Origen</th>
                                            <th>Producto</th>
                                            <th>Cámara</th>
                                            <th className="text-end">Disp.</th>
                                            <th className="text-end" style={{ minWidth: "90px" }}>Cajas</th>
                                            <th className="text-end" style={{ minWidth: "95px" }}>Peso/caja</th>
                                            <th className="text-end" style={{ minWidth: "110px" }}>Total kilos</th>
                                            <th className="text-end" style={{ minWidth: "115px" }}>Precio/kg</th>
                                            <th className="text-end" style={{ minWidth: "120px" }}>Total venta</th>
                                            <th style={{ minWidth: "150px" }}>Nota</th>
                                            <th style={{ width: "40px" }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lineas.map((linea, index) => {
                                            const lote = loteDe(linea.entrada_detalle);
                                            const excedida = lote !== null && Number(linea.cajas) > lote.cajasDisponibles;
                                            return (
                                                <tr key={linea.entrada_detalle} className={excedida ? "table-danger" : undefined}>
                                                    <td className="text-wrap small">
                                                        <div className="fw-semibold">{lote?.factura || "Sin factura"}</div>
                                                        <div className="text-body-secondary">
                                                            {lote?.recibo ? `Recibo ${lote.recibo} · ` : ""}
                                                            lote {lote?.loteProveedor ?? "—"}
                                                        </div>
                                                    </td>
                                                    <td className="text-wrap fw-semibold">
                                                        {lote ? lote.productoNombre : "—"}
                                                    </td>
                                                    <td className="text-wrap small">{lote?.camaraNombre ?? "—"}</td>
                                                    <td className="text-end small text-body-secondary">
                                                        {lote?.cajasDisponibles ?? "—"}
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number" min="0" max={lote?.cajasDisponibles}
                                                            className="form-control form-control-sm text-end"
                                                            value={linea.cajas}
                                                            onChange={(e) => cambiarCajas(index, e.target.value)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number" min="0" step="0.01"
                                                            className="form-control form-control-sm text-end"
                                                            value={linea.peso_por_caja}
                                                            onChange={(e) => actualizarLinea(index, { peso_por_caja: e.target.value })}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number" min="0" step="0.01"
                                                            className="form-control form-control-sm text-end fw-bold"
                                                            value={linea.total_kilos}
                                                            onChange={(e) => actualizarLinea(index, { total_kilos: e.target.value })}
                                                        />
                                                    </td>
                                                    <td>
                                                        <div className="input-group input-group-sm">
                                                            <span className="input-group-text">$</span>
                                                            <input
                                                                type="number" min="0" step="0.01" className="form-control text-end"
                                                                value={linea.precio_x_kilo}
                                                                onChange={(e) => actualizarLinea(index, { precio_x_kilo: e.target.value })}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="input-group input-group-sm">
                                                            <span className="input-group-text">$</span>
                                                            <input
                                                                type="number" min="0" step="0.01" className="form-control text-end"
                                                                value={linea.total_venta}
                                                                onChange={(e) => actualizarLinea(index, { total_venta: e.target.value })}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <input
                                                            className="form-control form-control-sm"
                                                            placeholder="Ej. Guardado en cámara Pacific"
                                                            value={linea.notas}
                                                            onChange={(e) => actualizarLinea(index, { notas: e.target.value })}
                                                        />
                                                    </td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => quitarLinea(index)}
                                                            title="Quitar producto"
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-top">
                                            <td colSpan={4} className="text-end fw-semibold text-uppercase small text-body-secondary">
                                                Totales:
                                            </td>
                                            <td className="text-end fw-bold">{totalCajas}</td>
                                            <td></td>
                                            <td className="text-end fw-bold">{totalKilos.toFixed(2)} kg</td>
                                            <td></td>
                                            <td className="text-end fw-bold">${totalVenta.toFixed(2)}</td>
                                            <td colSpan={2}></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </section>
                </div>

                {error && (
                    <div className="card-footer bg-white border-top-0 py-2 text-danger small fw-semibold">
                        <i className="bi bi-exclamation-circle-fill me-1"></i> {error}
                    </div>
                )}

                <div className="card-footer d-flex justify-content-end gap-2">
                    {salida && onCancelar && (
                        <button type="button" className="btn btn-outline-secondary" onClick={onCancelar}>
                            Cancelar edición
                        </button>
                    )}
                    {isLoading ? (
                        <LoadingButton isLoading={isLoading} text="Guardando..." onClick={() => Promise.resolve()} />
                    ) : (
                        <button type="submit" className="btn btn-primary">
                            <i className="bi bi-save me-1"></i> {salida ? "Guardar cambios" : "Registrar salida"}
                        </button>
                    )}
                </div>
            </form>

            <SelectorLotesModal
                show={modalAbierto}
                lotes={lotesDisponibles}
                yaAgregados={lineas.map((l) => l.entrada_detalle)}
                onAgregar={agregarLotes}
                onCerrar={() => setModalAbierto(false)}
            />
        </div>
    );
}

export default SalidaForm;
