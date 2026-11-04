import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BotonGuardar from "../../cartera/components/BotonGuardar";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import { hoyISO } from "../../../shared/utils/fechas";
import type { EditarMovimientoRequest, Movimiento } from "../interfaces/Ganado";
import { obtenerMovimiento } from "../services/ganado.service";
import { claseBadge, claseTipo, dinero, fecha, nombreUsuario } from "../utils/ganado";

interface Props {
    id: number;
    editable: boolean;
    onGuardar: (cambios: EditarMovimientoRequest) => Promise<void>;
    onCerrar: () => void;
}

/** Animales del movimiento; se corrigen fecha, contraparte, importe y notas (lo demás: cancelar y recapturar). */
function DetalleMovimiento({ id, editable, onGuardar, onCerrar }: Props) {
    const [movimiento, setMovimiento] = useState<Movimiento | null>(null);
    const [form, setForm] = useState<EditarMovimientoRequest | null>(null);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let vigente = true;
        obtenerMovimiento(id)
            .then((m) => {
                if (!vigente) return;
                setMovimiento(m);
                setForm({ fecha: m.fecha, contraparte: m.contraparte, importe: m.importe, notas: m.notas });
            })
            .catch((err) => vigente && setError(obtenerMensajeError(err)));
        return () => { vigente = false; };
    }, [id]);

    if (!movimiento || !form) {
        return error ? <div className="alert alert-danger">{error}</div> : <p className="text-body-secondary">Cargando…</p>;
    }

    const puedeEditar = editable && !movimiento.cancelado;
    const conContraparte = ["COMPRA", "REGALO", "VENTA"].includes(movimiento.motivo);
    const conImporte = movimiento.motivo === "COMPRA" || movimiento.motivo === "VENTA";

    async function enviar(e: React.SyntheticEvent) {
        e.preventDefault();
        if (!form) return;
        setError(null);
        setGuardando(true);
        try {
            await onGuardar({ ...form, importe: form.importe === "" ? null : form.importe });
        } catch (err) {
            setError(obtenerMensajeError(err));
        } finally {
            setGuardando(false);
        }
    }

    return (
        <form onSubmit={enviar}>
            <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
                <span className={claseTipo(movimiento.tipo)}>{movimiento.tipo_nombre}{movimiento.motivo_nombre && ` · ${movimiento.motivo_nombre}`}</span>
                <span className="fw-semibold">
                    {movimiento.tipo === "TRASPASO" ? `${movimiento.rancho.nombre} → ${movimiento.rancho_destino?.nombre}` : movimiento.rancho.nombre}
                </span>
                <span className="ms-auto small text-body-secondary">
                    Capturó {nombreUsuario(movimiento.usuario)}
                    {movimiento.editado_por && ` · editó ${nombreUsuario(movimiento.editado_por)}`}
                </span>
            </div>
            {movimiento.cancelado && (
                <div className="alert alert-secondary py-2 small">
                    Cancelado por {nombreUsuario(movimiento.usuario_cancelacion)}: {movimiento.motivo_cancelacion}
                </div>
            )}
            <div className="row g-3">
                <div className="col-sm-4">
                    <label className="form-label" htmlFor="det-fecha">Fecha</label>
                    <input id="det-fecha" type="date" className="form-control" max={hoyISO()} disabled={!puedeEditar}
                        value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
                </div>
                {conContraparte && (
                    <div className="col-sm-4">
                        <label className="form-label" htmlFor="det-contraparte">{movimiento.motivo === "VENTA" ? "Comprador" : movimiento.motivo === "COMPRA" ? "Vendedor" : "Quién lo regaló"}</label>
                        <input id="det-contraparte" className="form-control" disabled={!puedeEditar} maxLength={150}
                            value={form.contraparte} onChange={(e) => setForm({ ...form, contraparte: e.target.value })} />
                    </div>
                )}
                {conImporte && (
                    <div className="col-sm-4">
                        <label className="form-label" htmlFor="det-importe">Importe</label>
                        {puedeEditar ? (
                            <input id="det-importe" type="number" min="0" step="0.01" className="form-control text-end"
                                value={form.importe ?? ""} onChange={(e) => setForm({ ...form, importe: e.target.value })} />
                        ) : (
                            <input id="det-importe" className="form-control text-end" disabled value={dinero(form.importe)} />
                        )}
                    </div>
                )}
                <div className="col-12">
                    <label className="form-label" htmlFor="det-notas">{movimiento.motivo === "MUERTE" ? "Causa de la muerte" : "Notas"}</label>
                    <input id="det-notas" className="form-control" disabled={!puedeEditar}
                        value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
                </div>
            </div>

            <h6 className="mt-4">{movimiento.cabezas} cabeza(s) · {movimiento.resumen}</h6>
            <div className="table-responsive border rounded" style={{ maxHeight: "35vh" }}>
                <table className="table table-sm tabla-datos mb-0">
                    <thead className="sticky-top">
                        <tr><th>Arete</th><th>Folio</th><th>Especie</th><th>Categoría</th><th>Sexo</th><th>Raza / color</th></tr>
                    </thead>
                    <tbody>
                        {movimiento.animales?.map((a) => (
                            <tr key={a.id}>
                                <td className="font-monospace">{a.arete || <span className="text-body-secondary">Sin arete</span>}</td>
                                <td><Link to={`/ganado/animales/${a.id}`}>{a.folio}</Link></td>
                                <td className="small">{a.especie}</td>
                                <td>{a.categoria}</td>
                                <td>{a.sexo === "H" ? "Hembra" : "Macho"}</td>
                                <td className="small">{a.raza}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {puedeEditar && (
                <p className="small text-body-secondary mt-2 mb-0">
                    Para cambiar los animales o los ranchos, cancela el movimiento y captúralo de nuevo.
                </p>
            )}

            {error && <div className="alert alert-danger py-2 small mt-3 mb-0">{error}</div>}
            <div className="d-flex justify-content-between align-items-center gap-2 pt-3 mt-3 border-top">
                <span className={claseBadge("light")}>{movimiento.folio} · {fecha(movimiento.fecha)}</span>
                <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-secondary" onClick={onCerrar}>Cerrar</button>
                    {puedeEditar && <BotonGuardar guardando={guardando} texto="Guardar cambios" />}
                </div>
            </div>
        </form>
    );
}

export default DetalleMovimiento;
