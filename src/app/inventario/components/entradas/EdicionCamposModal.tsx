import { useState } from "react";
import Modal from "../../../../shared/components/Modal";
import { useToastContext } from "../../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import type { EntradaApi } from "../../interfaces/entradas/Entrada";
import { editarCamposEntrada, type CamposLinea } from "../../services/entrada.service";

interface EdicionCamposModalProps {
    entrada: EntradaApi;
    nombreCamara: (id: number | null) => string;
    onCerrar: () => void;
    onGuardado: () => void;
}

/** "130.5" y "130.50" son el mismo precio; vacío es "sin precio". */
function precioNormalizado(valor: string): string {
    return valor.trim() === "" ? "" : Number(valor).toFixed(2);
}

interface ValoresLinea {
    recibo: string;
    precio: string;
}

/**
 * Edición de campos por línea que no altera existencias: recibo de ingreso
 * (IMP) y precio de venta planeado, que alimenta la utilidad de Existencias.
 * Se permite aunque la entrada ya tenga salidas y cada cambio queda en
 * Auditoría de entradas. Solo las líneas en cámara llevan recibo.
 * Estado inicial desde props: la vista le pone `key` con el id de la entrada.
 */
function EdicionCamposModal({ entrada, nombreCamara, onCerrar, onGuardado }: EdicionCamposModalProps) {
    const { mostrarToast } = useToastContext();
    const lineas = entrada.detalles;
    const iniciales: Record<number, ValoresLinea> = Object.fromEntries(
        lineas.map((d) => [d.id, { recibo: d.lote_general_codigo ?? "", precio: d.precio_venta_planeado ?? "" }]),
    );
    const [valores, setValores] = useState<Record<number, ValoresLinea>>(iniciales);
    const [guardando, setGuardando] = useState(false);

    function cambiar(id: number, campo: keyof ValoresLinea, valor: string) {
        setValores((actual) => ({ ...actual, [id]: { ...actual[id], [campo]: valor } }));
    }

    // Solo viaja lo que cambió, para no dejar en la bitácora ediciones vacías.
    const cambios: Record<number, CamposLinea> = {};
    for (const d of lineas) {
        const linea: CamposLinea = {};
        if (d.camara !== null && valores[d.id].recibo.trim().toUpperCase() !== iniciales[d.id].recibo) {
            linea.recibo = valores[d.id].recibo;
        }
        if (precioNormalizado(valores[d.id].precio) !== precioNormalizado(iniciales[d.id].precio)) {
            linea.precio_venta_planeado = valores[d.id].precio;
        }
        if (Object.keys(linea).length > 0) cambios[d.id] = linea;
    }
    const hayCambios = Object.keys(cambios).length > 0;
    const enCamara = lineas.filter((d) => d.camara !== null);

    async function guardar(e: React.FormEvent) {
        e.preventDefault();
        if (Object.values(cambios).some((c) => c.precio_venta_planeado && Number(c.precio_venta_planeado) < 0)) {
            mostrarToast("Precio inválido", "El precio de venta no puede ser negativo.", "warning");
            return;
        }
        setGuardando(true);
        try {
            await editarCamposEntrada(entrada.id, cambios);
            mostrarToast("Cambios guardados", "Quedaron registrados en Auditoría de entradas.", "success");
            onGuardado();
        } catch (err) {
            mostrarToast("Error al guardar", obtenerMensajeError(err), "danger");
        } finally {
            setGuardando(false);
        }
    }

    return (
        <Modal title={`Edición de campos · entrada ${entrada.id}`} show onClose={onCerrar} size="modal-xl" closeDisabled={guardando}>
            <form onSubmit={guardar}>
                <p className="small text-body-secondary">
                    Recibo de ingreso (IMP) y precio de venta por kilo de cada línea. Se pueden editar aunque la entrada ya
                    tenga salidas; el precio de venta calcula la utilidad en Existencias. Las líneas que compartan recibo deben
                    estar en la misma cámara.
                </p>
                <div className="table-responsive">
                    <table className="table table-sm align-middle mb-2">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Cámara</th>
                                <th className="num">Cajas</th>
                                <th>Lote proveedor</th>
                                <th className="num">Costo/kg</th>
                                <th style={{ width: "11rem" }}>Recibo ingreso</th>
                                <th style={{ width: "10rem" }}>Precio venta/kg</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lineas.map((d) => {
                                const nombre = `${d.producto.talla} ${d.producto.tipo}`;
                                return (
                                    <tr key={d.id}>
                                        <td className="text-nowrap fw-semibold">{nombre}</td>
                                        <td className="text-nowrap">{nombreCamara(d.camara)}</td>
                                        <td className="num">{d.cajas.toLocaleString("es-MX")}</td>
                                        <td className="text-nowrap">{d.lote_proveedor || "—"}</td>
                                        <td className="num">{d.costo_por_kilo ? `$${d.costo_por_kilo}` : "—"}</td>
                                        <td>
                                            {d.camara !== null ? (
                                                <input
                                                    className="form-control form-control-sm text-uppercase"
                                                    aria-label={`Recibo de ingreso de ${nombre}`}
                                                    placeholder="IMP-…"
                                                    maxLength={30}
                                                    value={valores[d.id].recibo}
                                                    onChange={(e) => cambiar(d.id, "recibo", e.target.value)}
                                                />
                                            ) : (
                                                <span className="small text-body-secondary" title="Venta directa: no va a cámara">Sin recibo</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="input-group input-group-sm">
                                                <span className="input-group-text">$</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="form-control text-end"
                                                    aria-label={`Precio de venta por kilo de ${nombre}`}
                                                    placeholder="0.00"
                                                    value={valores[d.id].precio}
                                                    onChange={(e) => cambiar(d.id, "precio", e.target.value)}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {enCamara.length > 1 && (
                    <button
                        type="button"
                        className="btn btn-link btn-sm px-0"
                        onClick={() => enCamara.forEach((d) => cambiar(d.id, "recibo", valores[enCamara[0].id].recibo))}
                    >
                        Usar el recibo de la primera línea en todas
                    </button>
                )}
                <div className="d-flex justify-content-end gap-2 mt-3">
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onCerrar} disabled={guardando}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={guardando || !hayCambios}>
                        {guardando && <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>}
                        Guardar cambios
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default EdicionCamposModal;
