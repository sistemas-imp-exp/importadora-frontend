import { useEffect, useState } from "react";
import LoadingButton from "../../../../shared/components/LoadingButton";
import SearchableSelect from "../../../../shared/components/SearchableSelect";
import type { CrearEntradaLineaRequest, CrearEntradaRequest, EntradaApi } from "../../interfaces/entradas/Entrada";
import type { Proveedor } from "../../interfaces/proveedores/Proveedor";
import type { Camara } from "../../interfaces/camaras/Camara";
import type { Producto } from "../../interfaces/productos/Producto";

interface EntradaFormProps {
    proveedores: Proveedor[];
    camaras: Camara[];
    productos: Producto[];
    entrada?: EntradaApi | null;
    onGuardar: (entrada: CrearEntradaRequest) => Promise<void>;
    onCancelar?: () => void;
}

interface LineaForm {
    id?: number;
    producto_id: number;
    lote_proveedor: string;
    camara: number | "";
    cajas: string;
    peso_por_caja: string;
    total_kilos: string;
    costo_por_kilo: string;
    precio_venta_planeado: string;
    observaciones: string;
}

function lineaVacia(): LineaForm {
    return {
        producto_id: 0,
        lote_proveedor: "",
        camara: "",
        cajas: "",
        peso_por_caja: "",
        total_kilos: "",
        costo_por_kilo: "",
        precio_venta_planeado: "",
        observaciones: "",
    };
}

function cabeceraVacia() {
    return { fecha: "", proveedor_id: 0, factura: "", pedimento: "", recibo_ingreso: "" };
}

function lineasDesdeEntrada(entrada: EntradaApi): LineaForm[] {
    return entrada.detalles.map((d) => ({
        id: d.id,
        producto_id: d.producto.id,
        lote_proveedor: d.lote_proveedor,
        camara: d.camara ?? "",
        cajas: String(d.cajas),
        peso_por_caja: d.peso_por_caja ?? "",
        total_kilos: d.total_kilos,
        costo_por_kilo: d.costo_por_kilo ?? "",
        precio_venta_planeado: d.precio_venta_planeado ?? "",
        observaciones: d.observaciones,
    }));
}

function EntradaForm({ proveedores, camaras, productos, entrada, onGuardar, onCancelar }: EntradaFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cabecera, setCabecera] = useState(cabeceraVacia());
    const [lineas, setLineas] = useState<LineaForm[]>([lineaVacia()]);

    useEffect(() => {
        if (entrada) {
            setCabecera({
                fecha: entrada.fecha,
                proveedor_id: entrada.proveedor?.id ?? 0,
                factura: entrada.factura,
                pedimento: entrada.pedimento,
                recibo_ingreso: entrada.recibo_ingreso,
            });
            setLineas(lineasDesdeEntrada(entrada));
        } else {
            setCabecera(cabeceraVacia());
            setLineas([lineaVacia()]);
        }
        setError(null);
    }, [entrada]);

    function actualizarLinea(index: number, cambios: Partial<LineaForm>) {
        setLineas((actual) =>
            actual.map((linea, i) => {
                if (i !== index) return linea;
                const nueva = { ...linea, ...cambios };
                if ("cajas" in cambios || "peso_por_caja" in cambios) {
                    const cajas = Number(nueva.cajas);
                    const peso = Number(nueva.peso_por_caja);
                    if (cajas > 0 && peso > 0) {
                        nueva.total_kilos = (cajas * peso).toFixed(2);
                    }
                }
                return nueva;
            })
        );
    }

    function agregarLinea() {
        setLineas((actual) => [...actual, lineaVacia()]);
    }

    function quitarLinea(index: number) {
        setLineas((actual) => (actual.length === 1 ? actual : actual.filter((_, i) => i !== index)));
    }

    function validar(): string | null {
        if (!cabecera.fecha) return "La fecha es obligatoria.";
        if (!cabecera.proveedor_id) return "Seleccione un proveedor.";
        if (lineas.length === 0) return "Agregue al menos una línea.";

        for (const linea of lineas) {
            if (!linea.producto_id) return "Seleccione un producto en cada línea.";
            if (!linea.lote_proveedor.trim()) return "El lote de proveedor es obligatorio en cada línea.";
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

        const payload: CrearEntradaRequest = {
            fecha: cabecera.fecha,
            proveedor_id: cabecera.proveedor_id,
            factura: cabecera.factura.trim(),
            pedimento: cabecera.pedimento.trim(),
            recibo_ingreso: cabecera.recibo_ingreso.trim(),
            detalles: lineas.map((linea): CrearEntradaLineaRequest => ({
                ...(linea.id ? { id: linea.id } : {}),
                producto_id: linea.producto_id,
                lote_proveedor: linea.lote_proveedor.trim(),
                camara: linea.camara === "" ? null : Number(linea.camara),
                cajas: Number(linea.cajas),
                peso_por_caja: linea.peso_por_caja === "" ? null : Number(linea.peso_por_caja),
                total_kilos: Number(linea.total_kilos),
                costo_por_kilo: linea.costo_por_kilo === "" ? null : Number(linea.costo_por_kilo),
                precio_venta_planeado: linea.precio_venta_planeado === "" ? null : Number(linea.precio_venta_planeado),
                observaciones: linea.observaciones.trim(),
            })),
        };

        setIsLoading(true);
        try {
            await onGuardar(payload);
            if (!entrada) {
                setCabecera(cabeceraVacia());
                setLineas([lineaVacia()]);
            }
        } catch {
            // El error ya se muestra vía toast en la vista; el formulario conserva los datos para corregir.
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className={`card card-outline mb-3 ${entrada ? "card-warning" : "card-primary"}`}>
            <div className="card-header d-flex justify-content-between align-items-center">
                <h3 className="card-title fs-6 fw-bold m-0">
                    {entrada ? `Editando entrada #${entrada.id}` : "Registrar entrada"}
                </h3>
                {entrada && onCancelar && (
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onCancelar}>
                        Cancelar edición
                    </button>
                )}
            </div>

            <form onSubmit={guardar}>
                <div className="card-body">
                    <div className="row g-2 mb-3">
                        <div className="col-12 col-sm-6 col-md-3">
                            <label className="form-label small fw-bold">Fecha <span className="text-danger">*</span></label>
                            <input
                                type="date"
                                className="form-control form-control-sm"
                                value={cabecera.fecha}
                                onChange={(e) => setCabecera({ ...cabecera, fecha: e.target.value })}
                            />
                        </div>
                        <div className="col-12 col-sm-6 col-md-3">
                            <label className="form-label small fw-bold">Proveedor <span className="text-danger">*</span></label>
                            <select
                                className="form-select form-select-sm"
                                value={cabecera.proveedor_id}
                                onChange={(e) => setCabecera({ ...cabecera, proveedor_id: Number(e.target.value) })}
                            >
                                <option value={0}>Selecciona...</option>
                                {proveedores.map((p) => (
                                    <option key={p.id} value={p.id} disabled={!p.activo}>{p.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-12 col-sm-6 col-md-3">
                            <label className="form-label small fw-bold">Factura</label>
                            <input
                                className="form-control form-control-sm"
                                value={cabecera.factura}
                                onChange={(e) => setCabecera({ ...cabecera, factura: e.target.value })}
                            />
                        </div>
                        <div className="col-12 col-sm-6 col-md-3">
                            <label className="form-label small fw-bold">Pedimento</label>
                            <input
                                className="form-control form-control-sm"
                                value={cabecera.pedimento}
                                onChange={(e) => setCabecera({ ...cabecera, pedimento: e.target.value })}
                            />
                        </div>
                        <div className="col-12 col-sm-6 col-md-3">
                            <label className="form-label small fw-bold">Recibo de ingreso</label>
                            <input
                                className="form-control form-control-sm"
                                placeholder="Ej. IMP1797 (opcional)"
                                value={cabecera.recibo_ingreso}
                                onChange={(e) => setCabecera({ ...cabecera, recibo_ingreso: e.target.value })}
                            />
                            <div className="form-text">
                                Si lo llenas, agrupa las líneas que van a resguardo (mismas cámara). Las de venta directa no se ven afectadas.
                            </div>
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-sm align-middle">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Lote proveedor</th>
                                    <th>Cámara</th>
                                    <th>Cajas</th>
                                    <th>Kg/caja</th>
                                    <th>Total kilos</th>
                                    <th>Costo/kg</th>
                                    <th>Precio venta planeado</th>
                                    <th>Observaciones</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {lineas.map((linea, index) => (
                                    <tr key={index}>
                                        <td style={{ minWidth: "160px" }}>
                                            <SearchableSelect
                                                placeholder="Buscar producto..."
                                                options={productos.map((p) => ({
                                                    value: p.id,
                                                    label: `${p.talla} ${p.tipo}`,
                                                    disabled: !p.activo,
                                                }))}
                                                value={linea.producto_id === 0 ? "" : linea.producto_id}
                                                onChange={(v) => actualizarLinea(index, { producto_id: v === "" ? 0 : v })}
                                            />
                                        </td>
                                        <td style={{ minWidth: "120px" }}>
                                            <input
                                                className="form-control form-control-sm"
                                                value={linea.lote_proveedor}
                                                onChange={(e) => actualizarLinea(index, { lote_proveedor: e.target.value })}
                                            />
                                        </td>
                                        <td style={{ minWidth: "150px" }}>
                                            <select
                                                className="form-select form-select-sm"
                                                value={linea.camara}
                                                onChange={(e) => actualizarLinea(index, { camara: e.target.value === "" ? "" : Number(e.target.value) })}
                                            >
                                                <option value="">Venta directa (sin cámara)</option>
                                                {camaras.map((c) => (
                                                    <option key={c.id} value={c.id} disabled={!c.activo}>{c.nombre}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td style={{ width: "90px" }}>
                                            <input
                                                type="number" min="0" className="form-control form-control-sm"
                                                value={linea.cajas}
                                                onChange={(e) => actualizarLinea(index, { cajas: e.target.value })}
                                            />
                                        </td>
                                        <td style={{ width: "90px" }}>
                                            <input
                                                type="number" min="0" step="0.01" className="form-control form-control-sm"
                                                value={linea.peso_por_caja}
                                                onChange={(e) => actualizarLinea(index, { peso_por_caja: e.target.value })}
                                            />
                                        </td>
                                        <td style={{ width: "110px" }}>
                                            <input
                                                type="number" min="0" step="0.01" className="form-control form-control-sm"
                                                value={linea.total_kilos}
                                                onChange={(e) => actualizarLinea(index, { total_kilos: e.target.value })}
                                            />
                                        </td>
                                        <td style={{ width: "100px" }}>
                                            <input
                                                type="number" min="0" step="0.01" className="form-control form-control-sm"
                                                value={linea.costo_por_kilo}
                                                onChange={(e) => actualizarLinea(index, { costo_por_kilo: e.target.value })}
                                            />
                                        </td>
                                        <td style={{ width: "120px" }}>
                                            <input
                                                type="number" min="0" step="0.01" className="form-control form-control-sm"
                                                value={linea.precio_venta_planeado}
                                                onChange={(e) => actualizarLinea(index, { precio_venta_planeado: e.target.value })}
                                            />
                                        </td>
                                        <td style={{ minWidth: "140px" }}>
                                            <input
                                                className="form-control form-control-sm"
                                                value={linea.observaciones}
                                                onChange={(e) => actualizarLinea(index, { observaciones: e.target.value })}
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
                            <i className="bi bi-save me-1"></i> {entrada ? "Guardar cambios" : "Registrar entrada"}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

export default EntradaForm;
