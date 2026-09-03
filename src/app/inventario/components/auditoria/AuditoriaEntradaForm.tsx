import { useEffect, useMemo, useState } from "react";
import LoadingButton from "../../../../shared/components/LoadingButton";
import SearchableSelect from "../../../../shared/components/SearchableSelect";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import type { EntradaApi } from "../../interfaces/entradas/Entrada";
import { obtenerEntrada, type EntradaResumen } from "../../services/entrada.service";
import type {
    CabeceraEdicionAuditada,
    EditarEntradaAuditadaRequest,
    LineaEdicionAuditada,
} from "../../interfaces/auditoria/EdicionEntrada";

interface AuditoriaEntradaFormProps {
    /** Lista ligera para el selector; el detalle se pide al elegir una entrada. */
    entradas: EntradaResumen[];
    onGuardar: (entradaId: number, payload: EditarEntradaAuditadaRequest) => Promise<void>;
}

interface CamposLinea {
    lote_proveedor: string;
    precio_venta_planeado: string;
    fecha_caducidad: string;
    observaciones: string;
}

const CLASE_ETIQUETA = "form-label small text-uppercase fw-semibold text-body-secondary mb-1";

function camposDeLinea(entrada: EntradaApi): Record<number, CamposLinea> {
    const mapa: Record<number, CamposLinea> = {};
    for (const detalle of entrada.detalles) {
        mapa[detalle.id] = {
            lote_proveedor: detalle.lote_proveedor,
            precio_venta_planeado: detalle.precio_venta_planeado ?? "",
            fecha_caducidad: detalle.fecha_caducidad ?? "",
            observaciones: detalle.observaciones,
        };
    }
    return mapa;
}

function AuditoriaEntradaForm({ entradas, onGuardar }: AuditoriaEntradaFormProps) {
    const [entradaId, setEntradaId] = useState<number | "">("");
    const [entrada, setEntrada] = useState<EntradaApi | null>(null);
    const [cargandoEntrada, setCargandoEntrada] = useState(false);
    const [motivo, setMotivo] = useState("");
    const [factura, setFactura] = useState("");
    const [pedimento, setPedimento] = useState("");
    const [lineas, setLineas] = useState<Record<number, CamposLinea>>({});
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const opciones = useMemo(
        () =>
            entradas.map((e) => ({
                value: e.id,
                label: `#${e.id} · ${formatearFechaNumerica(new Date(e.fecha + "T00:00:00"))} · ${e.proveedor} · ${e.factura || "sin factura"}${e.editado ? " · editada" : ""}`,
            })),
        [entradas]
    );

    // El detalle (con sus lotes) se pide solo de la entrada elegida.
    useEffect(() => {
        if (entradaId === "") {
            setEntrada(null);
            return;
        }
        let cancelado = false;
        setCargandoEntrada(true);
        obtenerEntrada(entradaId)
            .then((datos) => { if (!cancelado) setEntrada(datos); })
            .catch(() => { if (!cancelado) setError("No se pudo cargar la entrada seleccionada."); })
            .finally(() => { if (!cancelado) setCargandoEntrada(false); });
        return () => { cancelado = true; };
    }, [entradaId]);

    useEffect(() => {
        if (!entrada) {
            setFactura("");
            setPedimento("");
            setLineas({});
            return;
        }
        setFactura(entrada.factura);
        setPedimento(entrada.pedimento);
        setLineas(camposDeLinea(entrada));
        setError(null);
    }, [entrada]);

    function actualizarLinea(id: number, cambios: Partial<CamposLinea>) {
        setLineas((actual) => ({ ...actual, [id]: { ...actual[id], ...cambios } }));
    }

    /** Solo se envían los campos que realmente cambiaron respecto a lo guardado. */
    function construirPayload(): EditarEntradaAuditadaRequest | null {
        if (!entrada) return null;

        const cabecera: CabeceraEdicionAuditada = {};
        if (factura !== entrada.factura) cabecera.factura = factura;
        if (pedimento !== entrada.pedimento) cabecera.pedimento = pedimento;

        const originales = camposDeLinea(entrada);
        const lineasCambiadas: LineaEdicionAuditada[] = [];
        for (const detalle of entrada.detalles) {
            const editada = lineas[detalle.id];
            if (!editada) continue;
            const original = originales[detalle.id];
            const cambios: Partial<CamposLinea> = {};
            for (const clave of Object.keys(editada) as Array<keyof CamposLinea>) {
                if (editada[clave] !== original[clave]) cambios[clave] = editada[clave];
            }
            if (Object.keys(cambios).length > 0) lineasCambiadas.push({ id: detalle.id, ...cambios });
        }

        if (Object.keys(cabecera).length === 0 && lineasCambiadas.length === 0) return null;

        return {
            motivo,
            ...(Object.keys(cabecera).length > 0 ? { cabecera } : {}),
            ...(lineasCambiadas.length > 0 ? { lineas: lineasCambiadas } : {}),
        };
    }

    async function guardar(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!entrada) {
            setError("Selecciona la entrada a corregir.");
            return;
        }
        if (!motivo.trim()) {
            setError("El motivo de la corrección es obligatorio: queda registrado en la bitácora.");
            return;
        }

        const payload = construirPayload();
        if (!payload) {
            setError("No hay cambios que guardar.");
            return;
        }

        setGuardando(true);
        try {
            await onGuardar(entrada.id, payload);
            setMotivo("");
        } catch {
            // El error se muestra vía toast en la vista.
        } finally {
            setGuardando(false);
        }
    }

    return (
        <form onSubmit={guardar}>
            <div className="card-body">
                <div className="alert alert-info py-2 small mb-3" role="note">
                    <i className="bi bi-info-circle me-1" aria-hidden="true"></i>
                    Aquí solo se corrigen datos que <strong>no alteran la contabilidad del inventario</strong>.
                    Cajas, kilos, cámara, producto y costo no son editables por ninguna vía una vez que la
                    entrada tiene salidas. Cada cambio queda registrado con tu usuario y el motivo.
                </div>

                <div className="row g-3 mb-3">
                    <div className="col-12 col-lg-6">
                        <label className={CLASE_ETIQUETA}>Entrada a corregir</label>
                        <SearchableSelect
                            placeholder="Buscar entrada por folio, proveedor o factura..."
                            options={opciones}
                            value={entradaId}
                            onChange={(v) => setEntradaId(v)}
                        />
                    </div>
                    <div className="col-12 col-lg-6">
                        <label className={CLASE_ETIQUETA}>
                            Motivo de la corrección <span className="text-danger">*</span>
                        </label>
                        <input
                            className="form-control form-control-sm"
                            placeholder="Ej. Factura mal capturada en recepción"
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                        />
                    </div>
                </div>

                {cargandoEntrada && (
                    <div className="text-body-secondary small py-2">Cargando la entrada...</div>
                )}

                {entrada && (
                    <>
                        <h6 className="fw-bold border-bottom pb-2 mb-3">Cabecera</h6>
                        <div className="row g-3 mb-4">
                            <div className="col-12 col-sm-6 col-lg-3">
                                <label className={CLASE_ETIQUETA}>Factura</label>
                                <input
                                    className="form-control form-control-sm"
                                    value={factura}
                                    onChange={(e) => setFactura(e.target.value)}
                                />
                            </div>
                            <div className="col-12 col-sm-6 col-lg-3">
                                <label className={CLASE_ETIQUETA}>Pedimento</label>
                                <input
                                    className="form-control form-control-sm"
                                    value={pedimento}
                                    onChange={(e) => setPedimento(e.target.value)}
                                    disabled={!entrada.es_internacional}
                                    title={entrada.es_internacional ? undefined : "La entrada es nacional"}
                                />
                            </div>
                        </div>

                        <h6 className="fw-bold border-bottom pb-2 mb-3">Líneas</h6>
                        <div className="table-responsive">
                            <table className="table table-sm align-middle mb-0">
                                <thead>
                                    <tr className="small text-uppercase text-body-secondary">
                                        <th>Producto</th>
                                        <th>Cámara / cantidades</th>
                                        <th style={{ minWidth: "130px" }}>Lote proveedor</th>
                                        <th style={{ minWidth: "120px" }}>P. venta planeado</th>
                                        <th style={{ minWidth: "150px" }}>Caducidad</th>
                                        <th style={{ minWidth: "180px" }}>Observaciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entrada.detalles.map((detalle) => (
                                        <tr key={detalle.id}>
                                            <td className="text-wrap fw-semibold">
                                                {detalle.producto.talla} {detalle.producto.tipo}
                                            </td>
                                            <td className="text-wrap small text-body-secondary">
                                                {detalle.cajas} cajas · {detalle.total_kilos} kg
                                                <div>Disponibles: {detalle.cajas_disponibles}</div>
                                            </td>
                                            <td>
                                                <input
                                                    className="form-control form-control-sm"
                                                    value={lineas[detalle.id]?.lote_proveedor ?? ""}
                                                    onChange={(e) => actualizarLinea(detalle.id, { lote_proveedor: e.target.value })}
                                                />
                                            </td>
                                            <td>
                                                <div className="input-group input-group-sm">
                                                    <span className="input-group-text">$</span>
                                                    <input
                                                        type="number" min="0" step="0.01" className="form-control text-end"
                                                        value={lineas[detalle.id]?.precio_venta_planeado ?? ""}
                                                        onChange={(e) => actualizarLinea(detalle.id, { precio_venta_planeado: e.target.value })}
                                                    />
                                                </div>
                                            </td>
                                            <td>
                                                <input
                                                    type="date"
                                                    className="form-control form-control-sm"
                                                    value={lineas[detalle.id]?.fecha_caducidad ?? ""}
                                                    onChange={(e) => actualizarLinea(detalle.id, { fecha_caducidad: e.target.value })}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    className="form-control form-control-sm"
                                                    value={lineas[detalle.id]?.observaciones ?? ""}
                                                    onChange={(e) => actualizarLinea(detalle.id, { observaciones: e.target.value })}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {error && (
                <div className="card-footer bg-white border-top-0 py-2 text-danger small fw-semibold">
                    <i className="bi bi-exclamation-circle-fill me-1"></i> {error}
                </div>
            )}

            <div className="card-footer d-flex justify-content-end">
                {guardando ? (
                    <LoadingButton isLoading text="Guardando..." onClick={() => Promise.resolve()} />
                ) : (
                    <button type="submit" className="btn btn-primary" disabled={!entrada}>
                        <i className="bi bi-save me-1"></i> Guardar corrección
                    </button>
                )}
            </div>
        </form>
    );
}

export default AuditoriaEntradaForm;
