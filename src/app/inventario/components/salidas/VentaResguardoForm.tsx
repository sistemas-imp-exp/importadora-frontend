import { useMemo, useState } from "react";
import CampoNumero from "../../../../shared/components/CampoNumero";
import LoadingButton from "../../../../shared/components/LoadingButton";
import { formatearKg } from "../../../../shared/utils/numeros";
import { formatearDinero } from "../../utils/existencias";
import { totalesPorProducto } from "../../utils/totalesProducto";
import SelectorProductosModal from "./SelectorProductosModal";
import type { Cliente } from "../../interfaces/clientes/Cliente";
import type { ExistenciaApi } from "../../interfaces/existencias/Existencia";
import type { Producto } from "../../interfaces/productos/Producto";
import { referenciaSalida, type CrearSalidaRequest, type SalidaApi } from "../../interfaces/salidas/Salida";

interface Props {
    clientes: Cliente[];
    productos: Producto[];
    existencias: ExistenciaApi[];
    salida?: SalidaApi | null;
    onGuardar: (salida: CrearSalidaRequest) => Promise<void>;
    onCancelar?: () => void;
}

interface LineaForm {
    uid: number;
    id?: number;
    producto_id: number;
    cajas: string;
    total_kilos: string;
    precio_x_kilo: string;
    total_venta: string;
    notas: string;
    // Lo ya entregado con retiros: la línea no puede bajar de ahí ni cambiar de producto.
    kilos_retirados: number;
}

const CLASE_ETIQUETA = "form-label small text-uppercase fw-semibold text-body-secondary mb-1";

let contadorUid = 0;

function lineaDeProducto(productoId: number): LineaForm {
    return {
        uid: ++contadorUid, producto_id: productoId, cajas: "", total_kilos: "", precio_x_kilo: "", total_venta: "", notas: "",
        kilos_retirados: 0,
    };
}

function lineasDesdeSalida(salida: SalidaApi): LineaForm[] {
    return salida.detalles.map((d) => ({
        uid: ++contadorUid,
        id: d.id,
        producto_id: d.producto.id,
        cajas: d.cajas ? String(d.cajas) : "",
        total_kilos: d.total_kilos,
        precio_x_kilo: d.precio_x_kilo ?? "",
        total_venta: d.total_venta ?? "",
        notas: d.notas ?? "",
        kilos_retirados: Number(d.kilos_retirados) || 0,
    }));
}

/**
 * Venta en resguardo: el cliente compra producto que se queda guardado. Se vende
 * por producto (sin lote: todavía no se sabe de qué lote se le va a surtir), no
 * lleva folio de salida ni descuenta existencias, y se cobra completa. Lo que se
 * lleve después se registra como retiro en Resguardos, del lote que haya.
 */
function VentaResguardoForm({ clientes, productos, existencias, salida, onGuardar, onCancelar }: Props) {
    const [clienteId, setClienteId] = useState<number>(salida?.cliente?.id ?? 0);
    const [fecha, setFecha] = useState(salida?.fecha ?? "");
    const [nota, setNota] = useState(salida?.notas ?? "");
    const [lineas, setLineas] = useState<LineaForm[]>(() => (salida ? lineasDesdeSalida(salida) : []));
    const [modalAbierto, setModalAbierto] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);

    // Existencia de cada producto sumando todos sus lotes (sin importar IMP, factura ni lote).
    const totales = useMemo(() => totalesPorProducto(productos, existencias), [productos, existencias]);
    const totalDe = (productoId: number) => totales.find((t) => t.producto.id === productoId);

    function actualizar(uid: number, cambios: Partial<LineaForm>) {
        setLineas((actual) => actual.map((l) => {
            if (l.uid !== uid) return l;
            const nueva = { ...l, ...cambios };
            if ("total_kilos" in cambios || "precio_x_kilo" in cambios) {
                const kilos = Number(nueva.total_kilos);
                const precio = Number(nueva.precio_x_kilo);
                if (kilos > 0 && precio > 0) nueva.total_venta = (kilos * precio).toFixed(2);
            }
            return nueva;
        }));
        setError(null);
    }

    function validar(): string | null {
        if (!clienteId) return "Selecciona el cliente.";
        if (!fecha) return "La fecha es obligatoria.";
        if (!nota.trim()) return "La nota de venta es obligatoria.";
        if (lineas.length === 0) return "Agrega al menos un producto con el buscador.";
        for (const [i, l] of lineas.entries()) {
            if (!(Number(l.total_kilos) > 0)) return `Captura los kilos de la línea ${i + 1}.`;
            if (Number(l.total_kilos) < l.kilos_retirados) {
                return `De la línea ${i + 1} ya se entregaron ${formatearKg(l.kilos_retirados)} kg: no puede quedar con menos.`;
            }
        }
        return null;
    }

    async function guardar(e: React.SyntheticEvent) {
        e.preventDefault();
        const mensaje = validar();
        if (mensaje) {
            setError(mensaje);
            return;
        }
        setGuardando(true);
        try {
            await onGuardar({
                es_resguardo: true,
                folio_de_salida: "",
                cliente_id: clienteId,
                fecha,
                notas: nota.trim().toUpperCase(),
                detalles: lineas.map((l) => ({
                    ...(l.id ? { id: l.id } : {}),
                    producto_id: l.producto_id,
                    cajas: Number(l.cajas) || 0,
                    total_kilos: Number(l.total_kilos),
                    precio_x_kilo: l.precio_x_kilo === "" ? null : Number(l.precio_x_kilo),
                    total_venta: l.total_venta === "" ? null : Number(l.total_venta),
                    notas: l.notas.trim().toUpperCase(),
                })),
            });
            if (!salida) {
                setClienteId(0);
                setFecha("");
                setNota("");
                setLineas([]);
            }
        } catch {
            // El error ya se muestra vía toast en la vista; se conservan los datos para corregir.
        } finally {
            setGuardando(false);
        }
    }

    const totalKilos = lineas.reduce((acc, l) => acc + (Number(l.total_kilos) || 0), 0);
    const totalVenta = lineas.reduce((acc, l) => acc + (Number(l.total_venta) || 0), 0);

    return (
        <div className={`card card-outline mb-3 ${salida ? "card-warning" : "card-primary"}`}>
            <div className="card-header">
                <h3 className="card-title fs-6 fw-bold m-0">
                    {salida ? `Editando venta en resguardo ${referenciaSalida(salida)}` : "Registrar venta en resguardo"}
                </h3>
            </div>
            <form onSubmit={guardar}>
                <div className="card-body">
                    <div className="alert alert-light border small py-2 d-flex gap-2 align-items-start" role="note">
                        <i className="bi bi-safe text-body-secondary mt-1" aria-hidden="true"></i>
                        <span>
                            El producto se queda guardado: se vende <strong>por producto</strong>, sin lote ni folio de
                            salida, y no descuenta existencias. Se cobra completo (IMPORTADORA). Lo que se lleve el cliente
                            se registra después en <strong>Resguardos</strong>, del lote que haya.
                        </span>
                    </div>

                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-5">
                            <label className={CLASE_ETIQUETA} htmlFor="resguardo-cliente">Cliente <span className="text-danger">*</span></label>
                            <select id="resguardo-cliente" className="form-select form-select-sm" value={clienteId}
                                onChange={(e) => { setClienteId(Number(e.target.value)); setError(null); }}>
                                <option value={0}>Seleccione cliente...</option>
                                {clientes.map((c) => (
                                    <option key={c.id} value={c.id} disabled={!c.activo}>{c.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-6 col-md-3">
                            <label className={CLASE_ETIQUETA} htmlFor="resguardo-fecha">Fecha <span className="text-danger">*</span></label>
                            <input id="resguardo-fecha" type="date" className="form-control form-control-sm" value={fecha}
                                onChange={(e) => { setFecha(e.target.value); setError(null); }} />
                        </div>
                        <div className="col-6 col-md-4">
                            <label className={CLASE_ETIQUETA} htmlFor="resguardo-nota">Nota de venta <span className="text-danger">*</span></label>
                            <input id="resguardo-nota" className="form-control form-control-sm" placeholder="Ej. 1570/24B"
                                value={nota} onChange={(e) => { setNota(e.target.value); setError(null); }} />
                        </div>
                    </div>

                    <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center border-bottom pb-2 mb-3">
                        <h6 className="d-flex align-items-center gap-2 fw-bold mb-0">
                            <i className="bi bi-list-check text-body-secondary" aria-hidden="true"></i>
                            Productos vendidos
                            <span className="badge text-bg-secondary">{lineas.length}</span>
                        </h6>
                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setModalAbierto(true)}>
                            <i className="bi bi-search me-1" aria-hidden="true"></i>Buscar productos
                        </button>
                    </div>

                    {lineas.length === 0 ? (
                        <div className="text-center text-body-secondary py-4 small">
                            Aún no hay productos. Usa <strong>Buscar productos</strong> para elegir lo que compró el cliente,
                            con la existencia total de cada uno.
                        </div>
                    ) : (
                    <div className="table-responsive">
                        <table className="table table-sm align-middle mb-0">
                            <thead>
                                <tr className="small text-uppercase text-body-secondary">
                                    <th style={{ minWidth: "280px" }}>Producto</th>
                                    <th className="text-end" style={{ minWidth: "90px" }}>Cajas</th>
                                    <th className="text-end" style={{ minWidth: "130px" }}>Kilos</th>
                                    <th className="text-end" style={{ minWidth: "130px" }}>Precio/kg</th>
                                    <th className="text-end" style={{ minWidth: "140px" }}>Total venta</th>
                                    <th style={{ minWidth: "150px" }}>Nota</th>
                                    <th style={{ width: "40px" }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {lineas.map((l, i) => {
                                    const conRetiros = l.kilos_retirados > 0;
                                    const total = totalDe(l.producto_id);
                                    const existencia = total?.kilos ?? 0;
                                    return (
                                        <tr key={l.uid}>
                                            <td>
                                                <div className="fw-semibold">{total ? `${total.producto.talla} ${total.producto.tipo}` : "—"}</div>
                                                <div className={`small ${existencia < Number(l.total_kilos || 0) ? "text-warning-emphasis" : "text-body-secondary"}`}>
                                                    Existencia: {formatearKg(existencia)} kg · {(total?.cajas ?? 0).toLocaleString("es-MX")} cajas
                                                    {conRetiros && ` · entregado ${formatearKg(l.kilos_retirados)} kg`}
                                                </div>
                                            </td>
                                            <td>
                                                <CampoNumero decimales={0} className="form-control form-control-sm text-end" aria-label={`Cajas línea ${i + 1}`}
                                                    value={l.cajas} onChange={(v) => actualizar(l.uid, { cajas: v })} />
                                            </td>
                                            <td>
                                                <CampoNumero decimales={3} className="form-control form-control-sm text-end fw-bold" aria-label={`Kilos línea ${i + 1}`}
                                                    value={l.total_kilos} onChange={(v) => actualizar(l.uid, { total_kilos: v })} />
                                            </td>
                                            <td>
                                                <div className="input-group input-group-sm">
                                                    <span className="input-group-text">$</span>
                                                    <CampoNumero decimales={4} className="form-control text-end" aria-label={`Precio por kg línea ${i + 1}`}
                                                        value={l.precio_x_kilo} onChange={(v) => actualizar(l.uid, { precio_x_kilo: v })} />
                                                </div>
                                            </td>
                                            <td>
                                                <div className="input-group input-group-sm">
                                                    <span className="input-group-text">$</span>
                                                    <CampoNumero className="form-control text-end" aria-label={`Total venta línea ${i + 1}`}
                                                        value={l.total_venta} onChange={(v) => actualizar(l.uid, { total_venta: v })} />
                                                </div>
                                            </td>
                                            <td>
                                                <input className="form-control form-control-sm" aria-label={`Nota línea ${i + 1}`}
                                                    value={l.notas} onChange={(e) => actualizar(l.uid, { notas: e.target.value })} />
                                            </td>
                                            <td>
                                                <button type="button" className="btn btn-sm btn-outline-danger"
                                                    disabled={conRetiros}
                                                    title={conRetiros ? "Ya se entregó parte: no se puede quitar" : "Quitar producto"}
                                                    aria-label={`Quitar línea ${i + 1}`}
                                                    onClick={() => setLineas((a) => a.filter((x) => x.uid !== l.uid))}>
                                                    <i className="bi bi-trash" aria-hidden="true"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="border-top">
                                    <td colSpan={2} className="text-end fw-semibold text-uppercase small text-body-secondary">Totales:</td>
                                    <td className="text-end fw-bold">{formatearKg(totalKilos)} kg</td>
                                    <td></td>
                                    <td className="text-end fw-bold">${formatearDinero(totalVenta)}</td>
                                    <td colSpan={2}></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    )}
                </div>

                {error && (
                    <div className="card-footer bg-white border-top-0 py-2 text-danger small fw-semibold">
                        <i className="bi bi-exclamation-circle-fill me-1" aria-hidden="true"></i> {error}
                    </div>
                )}

                <div className="card-footer d-flex justify-content-end gap-2">
                    {salida && onCancelar && (
                        <button type="button" className="btn btn-outline-secondary" onClick={onCancelar}>Cancelar edición</button>
                    )}
                    {guardando ? (
                        <LoadingButton isLoading text="Guardando..." onClick={() => Promise.resolve()} />
                    ) : (
                        <button type="submit" className="btn btn-primary">
                            <i className="bi bi-save me-1" aria-hidden="true"></i> {salida ? "Guardar cambios" : "Registrar venta en resguardo"}
                        </button>
                    )}
                </div>
            </form>

            {modalAbierto && (
                <SelectorProductosModal
                    totales={totales}
                    yaAgregados={lineas.map((l) => l.producto_id)}
                    onAgregar={(elegidos) => {
                        setLineas((a) => [...a, ...elegidos.map((t) => lineaDeProducto(t.producto.id))]);
                        setModalAbierto(false);
                        setError(null);
                    }}
                    onCerrar={() => setModalAbierto(false)}
                />
            )}
        </div>
    );
}

export default VentaResguardoForm;
