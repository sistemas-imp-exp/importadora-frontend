import { useState } from "react";
import LoadingButton from "../../../../shared/components/LoadingButton";
import SearchableSelect from "../../../../shared/components/SearchableSelect";
import type { CrearMovimientoCamaraRequest } from "../../interfaces/movimientos/MovimientoCamara";
import type { EntradaApi } from "../../interfaces/entradas/Entrada";
import type { Camara } from "../../interfaces/camaras/Camara";
import type { Producto } from "../../interfaces/productos/Producto";

interface LoteDisponible {
    entradaDetalleId: number;
    producto: Producto;
    loteProveedor: string;
    camaraOrigen: number | null;
    pesoPorCaja: string | null;
    cajasDisponibles: number;
}

interface MovimientoCamaraFormProps {
    camaras: Camara[];
    entradas: EntradaApi[];
    onGuardar: (movimiento: CrearMovimientoCamaraRequest) => Promise<void>;
}

function formVacio() {
    return { entrada_detalle_origen: "" as number | "", camara_destino: "" as number | "", fecha: "", cajas: "", total_kilos: "" };
}

function MovimientoCamaraForm({ camaras, entradas, onGuardar }: MovimientoCamaraFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState(formVacio());

    // Solo lotes que sí están en una cámara (una línea de "venta directa" no se puede
    // mover) y que todavía tienen cajas disponibles.
    const lotesDisponibles: LoteDisponible[] = entradas
        .flatMap((entrada) =>
            entrada.detalles.map((detalle) => ({
                entradaDetalleId: detalle.id,
                producto: detalle.producto,
                loteProveedor: detalle.lote_proveedor,
                camaraOrigen: detalle.camara,
                pesoPorCaja: detalle.peso_por_caja,
                cajasDisponibles: detalle.cajas_disponibles,
            }))
        )
        .filter((lote) => lote.camaraOrigen !== null && lote.cajasDisponibles > 0);

    const loteSeleccionado = lotesDisponibles.find((l) => l.entradaDetalleId === form.entrada_detalle_origen) ?? null;

    function actualizar(cambios: Partial<ReturnType<typeof formVacio>>) {
        setForm((actual) => {
            const nuevo = { ...actual, ...cambios };
            if ("entrada_detalle_origen" in cambios || "cajas" in cambios) {
                const lote = lotesDisponibles.find((l) => l.entradaDetalleId === nuevo.entrada_detalle_origen);
                const cajas = Number(nuevo.cajas);
                const peso = lote?.pesoPorCaja ? Number(lote.pesoPorCaja) : NaN;
                if (cajas > 0 && peso > 0) {
                    nuevo.total_kilos = (cajas * peso).toFixed(2);
                }
                // Si cambia el lote de origen, la cámara destino elegida podría ya no ser válida.
                if ("entrada_detalle_origen" in cambios && nuevo.camara_destino === lote?.camaraOrigen) {
                    nuevo.camara_destino = "";
                }
            }
            return nuevo;
        });
    }

    function validar(): string | null {
        if (!form.entrada_detalle_origen) return "Seleccione el lote de origen.";
        if (!form.camara_destino) return "Seleccione la cámara destino.";
        if (!form.fecha) return "La fecha es obligatoria.";
        if (!form.cajas || Number(form.cajas) <= 0) return "Ingrese las cajas a mover.";
        if (!form.total_kilos || Number(form.total_kilos) <= 0) return "Ingrese el total de kilos.";
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

        const payload: CrearMovimientoCamaraRequest = {
            entrada_detalle_origen: Number(form.entrada_detalle_origen),
            camara_destino: Number(form.camara_destino),
            fecha: form.fecha,
            cajas: Number(form.cajas),
            total_kilos: Number(form.total_kilos),
        };

        setIsLoading(true);
        try {
            await onGuardar(payload);
            setForm(formVacio());
        } catch {
            // El error ya se muestra vía toast en la vista; el formulario conserva los datos para corregir.
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="card card-outline card-primary mb-3">
            <div className="card-header">
                <h3 className="card-title fs-6 fw-bold m-0">Registrar movimiento entre cámaras</h3>
            </div>

            <form onSubmit={guardar}>
                <div className="card-body">
                    <div className="row g-2 align-items-end">
                        <div className="col-12 col-md-4">
                            <label className="form-label small fw-bold">Lote de origen <span className="text-danger">*</span></label>
                            <SearchableSelect
                                placeholder="Buscar lote..."
                                options={lotesDisponibles.map((lote) => ({
                                    value: lote.entradaDetalleId,
                                    label: `${lote.producto.talla} ${lote.producto.tipo} — lote ${lote.loteProveedor} (${lote.cajasDisponibles} cajas disponibles)`,
                                }))}
                                value={form.entrada_detalle_origen}
                                onChange={(v) => actualizar({ entrada_detalle_origen: v })}
                            />
                        </div>
                        <div className="col-12 col-sm-6 col-md-2">
                            <label className="form-label small fw-bold">Cámara destino <span className="text-danger">*</span></label>
                            <select
                                className="form-select form-select-sm"
                                value={form.camara_destino}
                                onChange={(e) => actualizar({ camara_destino: e.target.value === "" ? "" : Number(e.target.value) })}
                            >
                                <option value="">Selecciona...</option>
                                {camaras
                                    .filter((c) => c.id !== loteSeleccionado?.camaraOrigen)
                                    .map((c) => (
                                        <option key={c.id} value={c.id} disabled={!c.activo}>{c.nombre}</option>
                                    ))}
                            </select>
                        </div>
                        <div className="col-12 col-sm-6 col-md-2">
                            <label className="form-label small fw-bold">Fecha <span className="text-danger">*</span></label>
                            <input
                                type="date"
                                className="form-control form-control-sm"
                                value={form.fecha}
                                onChange={(e) => actualizar({ fecha: e.target.value })}
                            />
                        </div>
                        <div className="col-6 col-sm-3 col-md-2">
                            <label className="form-label small fw-bold">Cajas <span className="text-danger">*</span></label>
                            <input
                                type="number" min="0" className="form-control form-control-sm"
                                value={form.cajas}
                                onChange={(e) => actualizar({ cajas: e.target.value })}
                            />
                        </div>
                        <div className="col-6 col-sm-3 col-md-2">
                            <label className="form-label small fw-bold">Total kilos <span className="text-danger">*</span></label>
                            <input
                                type="number" min="0" step="0.01" className="form-control form-control-sm"
                                value={form.total_kilos}
                                onChange={(e) => actualizar({ total_kilos: e.target.value })}
                            />
                        </div>
                    </div>
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
                            <i className="bi bi-save me-1"></i> Registrar movimiento
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

export default MovimientoCamaraForm;
