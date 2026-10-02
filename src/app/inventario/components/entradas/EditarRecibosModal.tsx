import { useState } from "react";
import Modal from "../../../../shared/components/Modal";
import { useToastContext } from "../../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import type { EntradaApi } from "../../interfaces/entradas/Entrada";
import { editarRecibosEntrada } from "../../services/entrada.service";

interface EditarRecibosModalProps {
    entrada: EntradaApi;
    nombreCamara: (id: number | null) => string;
    onCerrar: () => void;
    onGuardado: () => void;
}

/**
 * Recibo de ingreso (IMP) por línea. Se permite aunque la entrada ya tenga
 * salidas: el folio suele llegar después y no altera cajas, kilos ni costo.
 * Solo las líneas que van a cámara llevan recibo. Estado inicial desde props:
 * la vista le pone `key` con el id de la entrada.
 */
function EditarRecibosModal({ entrada, nombreCamara, onCerrar, onGuardado }: EditarRecibosModalProps) {
    const { mostrarToast } = useToastContext();
    const lineas = entrada.detalles.filter((d) => d.camara !== null);
    const [recibos, setRecibos] = useState<Record<number, string>>(
        () => Object.fromEntries(lineas.map((d) => [d.id, d.lote_general_codigo ?? ""])),
    );
    const [guardando, setGuardando] = useState(false);

    const cambios = lineas.filter((d) => recibos[d.id].trim().toUpperCase() !== (d.lote_general_codigo ?? ""));

    function aplicarATodas(valor: string) {
        setRecibos(Object.fromEntries(lineas.map((d) => [d.id, valor])));
    }

    async function guardar(e: React.FormEvent) {
        e.preventDefault();
        setGuardando(true);
        try {
            await editarRecibosEntrada(entrada.id, Object.fromEntries(cambios.map((d) => [d.id, recibos[d.id]])));
            mostrarToast("Recibos guardados", "El cambio quedó registrado en Auditoría de entradas.", "success");
            onGuardado();
        } catch (err) {
            mostrarToast("Error al guardar", obtenerMensajeError(err), "danger");
        } finally {
            setGuardando(false);
        }
    }

    return (
        <Modal title={`Recibo de ingreso · entrada ${entrada.id}`} show onClose={onCerrar} size="modal-lg" closeDisabled={guardando}>
            <form onSubmit={guardar}>
                {lineas.length === 0 ? (
                    <p className="text-body-secondary mb-0">Esta entrada no tiene líneas en cámara: no lleva recibo de ingreso.</p>
                ) : (
                    <>
                        <p className="small text-body-secondary">
                            Cada línea puede tener su propio recibo (IMP). Las que compartan recibo deben estar en la misma cámara.
                        </p>
                        <table className="table table-sm align-middle mb-2">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Cámara</th>
                                    <th className="num">Cajas</th>
                                    <th>Lote proveedor</th>
                                    <th style={{ width: "12rem" }}>Recibo ingreso</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lineas.map((d) => (
                                    <tr key={d.id}>
                                        <td className="text-nowrap fw-semibold">{d.producto.talla} {d.producto.tipo}</td>
                                        <td className="text-nowrap">{nombreCamara(d.camara)}</td>
                                        <td className="num">{d.cajas.toLocaleString("es-MX")}</td>
                                        <td className="text-nowrap">{d.lote_proveedor || "—"}</td>
                                        <td>
                                            <input
                                                className="form-control form-control-sm text-uppercase"
                                                aria-label={`Recibo de ingreso de ${d.producto.talla} ${d.producto.tipo}`}
                                                placeholder="IMP-…"
                                                maxLength={30}
                                                value={recibos[d.id]}
                                                onChange={(e) => setRecibos({ ...recibos, [d.id]: e.target.value })}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {lineas.length > 1 && (
                            <button
                                type="button"
                                className="btn btn-link btn-sm px-0"
                                onClick={() => aplicarATodas(recibos[lineas[0].id])}
                            >
                                Usar el recibo de la primera línea en todas
                            </button>
                        )}
                    </>
                )}
                <div className="d-flex justify-content-end gap-2 mt-3">
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onCerrar} disabled={guardando}>
                        Cancelar
                    </button>
                    {lineas.length > 0 && (
                        <button type="submit" className="btn btn-primary btn-sm" disabled={guardando || cambios.length === 0}>
                            {guardando && <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>}
                            Guardar recibos
                        </button>
                    )}
                </div>
            </form>
        </Modal>
    );
}

export default EditarRecibosModal;
