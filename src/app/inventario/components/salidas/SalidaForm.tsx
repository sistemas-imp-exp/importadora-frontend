import { useState } from "react";
import LoadingButton from "../../../../shared/components/LoadingButton";
import type { CrearSalidaLineaRequest, CrearSalidaRequest } from "../../interfaces/salidas/Salida";
import type { EntradaApi } from "../../interfaces/entradas/Entrada";
import type { Cliente } from "../../interfaces/clientes/Cliente";
import type { Camara } from "../../interfaces/camaras/Camara";
import type { Producto } from "../../interfaces/productos/Producto";

interface LoteDisponible {
    entradaDetalleId: number;
    producto: Producto;
    loteProveedor: string;
    cajasOriginales: number;
}

interface SalidaFormProps {
    clientes: Cliente[];
    camaras: Camara[];
    productos: Producto[];
    entradas: EntradaApi[];
    onGuardar: (salida: CrearSalidaRequest) => Promise<void>;
}

interface LineaForm {
    entrada_detalle: number | "";
    producto_id: number;
    camara: number | "";
    cajas: string;
    total_kilos: string;
    factura_proveedor: string;
    precio_x_kilo: string;
    total_venta: string;
}

function lineaVacia(productos: Producto[]): LineaForm {
    return {
        entrada_detalle: "",
        producto_id: productos[0]?.id ?? 0,
        camara: "",
        cajas: "",
        total_kilos: "",
        factura_proveedor: "",
        precio_x_kilo: "",
        total_venta: "",
    };
}

function cabeceraVacia() {
    return { folio_de_salida: "", cliente_id: 0, fecha: "", notas: "" };
}

function SalidaForm({ clientes, camaras, productos, entradas, onGuardar }: SalidaFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cabecera, setCabecera] = useState(cabeceraVacia());
    const [lineas, setLineas] = useState<LineaForm[]>([lineaVacia(productos)]);

    const lotesDisponibles: LoteDisponible[] = entradas.flatMap((entrada) =>
        entrada.detalles.map((detalle) => ({
            entradaDetalleId: detalle.id,
            producto: detalle.producto,
            loteProveedor: detalle.lote_proveedor,
            cajasOriginales: detalle.cajas,
        }))
    );

    function nombreCamara(id: number | ""): string {
        if (id === "") return "";
        return camaras.find((c) => c.id === id)?.nombre ?? "";
    }

    function actualizarLinea(index: number, cambios: Partial<LineaForm>) {
        setLineas((actual) => actual.map((linea, i) => (i === index ? { ...linea, ...cambios } : linea)));
    }

    function agregarLinea() {
        setLineas((actual) => [...actual, lineaVacia(productos)]);
    }

    function quitarLinea(index: number) {
        setLineas((actual) => (actual.length === 1 ? actual : actual.filter((_, i) => i !== index)));
    }

    function validar(): string | null {
        if (!cabecera.folio_de_salida.trim()) return "El folio de salida es obligatorio.";
        if (!cabecera.cliente_id) return "Seleccione un cliente.";
        if (!cabecera.fecha) return "La fecha es obligatoria.";

        for (const linea of lineas) {
            if (!linea.entrada_detalle) return "Seleccione el lote de origen en cada línea.";
            if (!linea.producto_id) return "Seleccione un producto en cada línea.";
            if (!linea.cajas || Number(linea.cajas) <= 0) return "Ingrese las cajas de cada línea.";
            if (!linea.total_kilos || Number(linea.total_kilos) <= 0) return "Ingrese el total de kilos de cada línea.";
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
            folio_de_salida: cabecera.folio_de_salida.trim(),
            cliente_id: cabecera.cliente_id,
            fecha: cabecera.fecha,
            notas: cabecera.notas.trim(),
            detalles: lineas.map((linea): CrearSalidaLineaRequest => ({
                producto_id: linea.producto_id,
                entrada_detalle: Number(linea.entrada_detalle),
                camara: linea.camara === "" ? null : Number(linea.camara),
                cajas: Number(linea.cajas),
                total_kilos: Number(linea.total_kilos),
                factura_proveedor: linea.factura_proveedor.trim(),
                precio_x_kilo: linea.precio_x_kilo === "" ? null : Number(linea.precio_x_kilo),
                total_venta: linea.total_venta === "" ? null : Number(linea.total_venta),
            })),
        };

        setIsLoading(true);
        try {
            await onGuardar(payload);
            setCabecera(cabeceraVacia());
            setLineas([lineaVacia(productos)]);
        } catch {
            // El error ya se muestra vía toast en la vista; el formulario conserva los datos para corregir.
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="card card-outline card-primary mb-3">
            <div className="card-header">
                <h3 className="card-title fs-6 fw-bold m-0">Registrar salida</h3>
            </div>

            <form onSubmit={guardar}>
                <div className="card-body">
                    <div className="row g-2 mb-3">
                        <div className="col-md-3 col-sm-6">
                            <label className="form-label small fw-bold">Folio de salida <span className="text-danger">*</span></label>
                            <input
                                className="form-control form-control-sm"
                                value={cabecera.folio_de_salida}
                                onChange={(e) => setCabecera({ ...cabecera, folio_de_salida: e.target.value })}
                            />
                        </div>
                        <div className="col-md-3 col-sm-6">
                            <label className="form-label small fw-bold">Cliente <span className="text-danger">*</span></label>
                            <select
                                className="form-select form-select-sm"
                                value={cabecera.cliente_id}
                                onChange={(e) => setCabecera({ ...cabecera, cliente_id: Number(e.target.value) })}
                            >
                                <option value={0}>Selecciona...</option>
                                {clientes.map((c) => (
                                    <option key={c.id} value={c.id} disabled={!c.activo}>{c.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-3 col-sm-6">
                            <label className="form-label small fw-bold">Fecha <span className="text-danger">*</span></label>
                            <input
                                type="date"
                                className="form-control form-control-sm"
                                value={cabecera.fecha}
                                onChange={(e) => setCabecera({ ...cabecera, fecha: e.target.value })}
                            />
                        </div>
                        <div className="col-md-3 col-sm-6">
                            <label className="form-label small fw-bold">Notas (folio interno)</label>
                            <input
                                className="form-control form-control-sm"
                                value={cabecera.notas}
                                onChange={(e) => setCabecera({ ...cabecera, notas: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-sm align-middle">
                            <thead>
                                <tr>
                                    <th>Lote de origen</th>
                                    <th>Producto</th>
                                    <th>Cámara</th>
                                    <th>Cajas</th>
                                    <th>Total kilos</th>
                                    <th>Factura proveedor</th>
                                    <th>Precio/kg</th>
                                    <th>Total venta</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {lineas.map((linea, index) => (
                                    <tr key={index}>
                                        <td style={{ minWidth: "220px" }}>
                                            <select
                                                className="form-select form-select-sm"
                                                value={linea.entrada_detalle}
                                                onChange={(e) => {
                                                    const id = e.target.value === "" ? "" : Number(e.target.value);
                                                    const lote = lotesDisponibles.find((l) => l.entradaDetalleId === id);
                                                    actualizarLinea(index, {
                                                        entrada_detalle: id,
                                                        producto_id: lote ? lote.producto.id : linea.producto_id,
                                                    });
                                                }}
                                            >
                                                <option value="">Selecciona un lote...</option>
                                                {lotesDisponibles.map((lote) => (
                                                    <option key={lote.entradaDetalleId} value={lote.entradaDetalleId}>
                                                        {lote.producto.talla} {lote.producto.tipo} — lote {lote.loteProveedor} ({lote.cajasOriginales} cajas originales)
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="text-wrap small">
                                            {productos.find((p) => p.id === linea.producto_id)
                                                ? `${productos.find((p) => p.id === linea.producto_id)!.talla} ${productos.find((p) => p.id === linea.producto_id)!.tipo}`
                                                : "—"}
                                        </td>
                                        <td style={{ minWidth: "150px" }}>
                                            <select
                                                className="form-select form-select-sm"
                                                value={linea.camara}
                                                onChange={(e) => actualizarLinea(index, { camara: e.target.value === "" ? "" : Number(e.target.value) })}
                                            >
                                                <option value="">Sin cámara</option>
                                                {camaras.map((c) => (
                                                    <option key={c.id} value={c.id} disabled={!c.activo}>{c.nombre}</option>
                                                ))}
                                            </select>
                                            {linea.camara !== "" && <div className="small text-muted">{nombreCamara(linea.camara)}</div>}
                                        </td>
                                        <td style={{ width: "90px" }}>
                                            <input
                                                type="number" min="0" className="form-control form-control-sm"
                                                value={linea.cajas}
                                                onChange={(e) => actualizarLinea(index, { cajas: e.target.value })}
                                            />
                                        </td>
                                        <td style={{ width: "110px" }}>
                                            <input
                                                type="number" min="0" step="0.01" className="form-control form-control-sm"
                                                value={linea.total_kilos}
                                                onChange={(e) => actualizarLinea(index, { total_kilos: e.target.value })}
                                            />
                                        </td>
                                        <td style={{ minWidth: "120px" }}>
                                            <input
                                                className="form-control form-control-sm"
                                                value={linea.factura_proveedor}
                                                onChange={(e) => actualizarLinea(index, { factura_proveedor: e.target.value })}
                                            />
                                        </td>
                                        <td style={{ width: "100px" }}>
                                            <input
                                                type="number" min="0" step="0.01" className="form-control form-control-sm"
                                                value={linea.precio_x_kilo}
                                                onChange={(e) => actualizarLinea(index, { precio_x_kilo: e.target.value })}
                                            />
                                        </td>
                                        <td style={{ width: "110px" }}>
                                            <input
                                                type="number" min="0" step="0.01" className="form-control form-control-sm"
                                                value={linea.total_venta}
                                                onChange={(e) => actualizarLinea(index, { total_venta: e.target.value })}
                                            />
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => quitarLinea(index)}
                                                disabled={lineas.length === 1}
                                                title="Quitar línea"
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={agregarLinea}>
                        <i className="bi bi-plus-lg me-1"></i> Agregar línea
                    </button>
                </div>

                {error && (
                    <div className="card-footer bg-white border-top-0 py-2 text-danger small fw-semibold">
                        <i className="bi bi-exclamation-circle-fill me-1"></i> {error}
                    </div>
                )}

                <div className="card-footer d-flex justify-content-end">
                    {isLoading ? (
                        <LoadingButton isLoading={isLoading} text="Guardando..." onClick={() => Promise.resolve()} />
                    ) : (
                        <button type="submit" className="btn btn-primary">
                            <i className="bi bi-save me-1"></i> Registrar salida
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

export default SalidaForm;
