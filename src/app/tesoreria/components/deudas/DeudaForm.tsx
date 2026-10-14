import { useState } from "react";
import LoadingButton from "../../../../shared/components/LoadingButton";
import SearchableSelect from "../../../../shared/components/SearchableSelect";
import { hoyISO } from "../../../../shared/utils/fechas";
import type { Divisa } from "../../interfaces/divisas/Divisa";
import type { Deuda, DeudaRequest, Deudor } from "../../interfaces/deudas/Deuda";

interface DeudaFormProps {
    /** Estado inicial desde props: la vista le pone `key` para cambiar de registro. */
    deuda: Deuda | null;
    deudores: Deudor[];
    divisas: Divisa[];
    /** Deudor preseleccionado al crear (p. ej. si la lista está filtrada por uno). */
    deudorInicial?: number;
    onGuardar: (datos: DeudaRequest) => Promise<void>;
    onCancelar: () => void;
}

function DeudaForm({ deuda, deudores, divisas, deudorInicial, onGuardar, onCancelar }: DeudaFormProps) {
    const activas = divisas.filter((d) => d.activa);
    const [form, setForm] = useState({
        deudor: (deuda?.deudor.id ?? deudorInicial ?? "") as number | "",
        concepto: deuda?.concepto ?? "",
        divisa: deuda?.divisa.id ?? activas[0]?.id ?? 0,
        monto: deuda ? String(Number(deuda.monto_inicial)) : "",
        fecha: deuda?.fecha ?? hoyISO(),
        notas: deuda?.notas ?? "",
    });
    const [guardando, setGuardando] = useState(false);
    // Con cargos o abonos activos solo se cambian concepto y notas (lo demás descuadraría el historial).
    const bloqueada = !!deuda?.movimientos.some((m) => !m.cancelado);
    const [error, setError] = useState<string | null>(null);

    // Al editar se conserva el deudor aunque ya esté inactivo.
    const opcionesDeudor = deudores
        .filter((d) => d.activo || d.id === deuda?.deudor.id)
        .map((d) => ({ value: d.id, label: d.nombre }));

    function validar(): string | null {
        if (!form.deudor) return "Selecciona el deudor.";
        if (!form.concepto.trim()) return "El concepto es obligatorio.";
        if (!form.divisa) return "Selecciona la divisa.";
        const monto = Number(form.monto);
        if (!bloqueada && (Number.isNaN(monto) || monto <= 0)) return "El monto debe ser mayor que cero.";
        if (!form.fecha) return "La fecha es obligatoria.";
        if (form.fecha > hoyISO()) return "La fecha no puede ser futura.";
        return null;
    }

    async function guardar(e: React.FormEvent) {
        e.preventDefault();
        const mensaje = validar();
        if (mensaje) {
            setError(mensaje);
            return;
        }
        setError(null);
        setGuardando(true);
        try {
            await onGuardar({
                deudor_id: Number(form.deudor),
                concepto: form.concepto.trim(),
                divisa_id: form.divisa,
                monto_inicial: Number(form.monto),
                fecha: form.fecha,
                notas: form.notas.trim(),
            });
        } catch {
            // El toast con el mensaje del servidor lo muestra la vista.
        } finally {
            setGuardando(false);
        }
    }

    const simbolo = divisas.find((d) => d.id === form.divisa)?.simbolo ?? "$";

    return (
        <form onSubmit={guardar}>
            <div className="row g-3">
                <div className="col-md-8">
                    <label className="form-label" htmlFor="deuda-deudor">Deudor <span className="text-danger">*</span></label>
                    {bloqueada ? (
                        <input id="deuda-deudor" className="form-control" value={deuda?.deudor.nombre ?? ""} disabled />
                    ) : (
                        <SearchableSelect
                            id="deuda-deudor"
                            options={opcionesDeudor}
                            value={form.deudor}
                            onChange={(valor) => setForm({ ...form, deudor: valor })}
                            placeholder="Buscar deudor..."
                        />
                    )}
                    {opcionesDeudor.length === 0 && (
                        <div className="form-text text-warning">No hay deudores activos: regístralos en Deudores.</div>
                    )}
                </div>
                <div className="col-md-4">
                    <label className="form-label" htmlFor="deuda-fecha">Fecha <span className="text-danger">*</span></label>
                    <input
                        id="deuda-fecha"
                        disabled={bloqueada}
                        type="date"
                        className="form-control"
                        value={form.fecha}
                        max={hoyISO()}
                        onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                    />
                </div>
                <div className="col-12">
                    <label className="form-label" htmlFor="deuda-concepto">Concepto <span className="text-danger">*</span></label>
                    <input
                        id="deuda-concepto"
                        className="form-control"
                        placeholder="Ej. Venta de camarón"
                        value={form.concepto}
                        onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                    />
                </div>
                <div className="col-md-4">
                    <label className="form-label" htmlFor="deuda-divisa">Divisa <span className="text-danger">*</span></label>
                    <select
                        id="deuda-divisa"
                        disabled={bloqueada}
                        className="form-select"
                        value={form.divisa}
                        onChange={(e) => setForm({ ...form, divisa: Number(e.target.value) })}
                    >
                        {activas.map((d) => (
                            <option key={d.id} value={d.id}>{d.nombre} ({d.codigo})</option>
                        ))}
                    </select>
                </div>
                <div className="col-md-4">
                    <label className="form-label" htmlFor="deuda-monto">Monto sin salida de caja <span className="text-danger">*</span></label>
                    <div className="input-group">
                        <span className="input-group-text">{simbolo}</span>
                        <input
                            id="deuda-monto"
                        disabled={bloqueada}
                            type="number"
                            min="0"
                            step="0.01"
                            className="form-control"
                            placeholder="0.00"
                            value={form.monto}
                            onChange={(e) => setForm({ ...form, monto: e.target.value })}
                        />
                    </div>
                </div>
                <div className="col-12">
                    <label className="form-label" htmlFor="deuda-notas">Notas</label>
                    <textarea
                        id="deuda-notas"
                        className="form-control"
                        rows={2}
                        value={form.notas}
                        onChange={(e) => setForm({ ...form, notas: e.target.value })}
                    />
                </div>
            </div>

            {bloqueada && (
                <div className="alert alert-warning py-2 small mt-3 mb-0">
                    <i className="bi bi-lock me-1" aria-hidden="true"></i>
                    Tiene cargos o abonos de caja: solo se pueden cambiar el concepto y las notas.
                </div>
            )}

            <p className="small text-body-secondary mt-3 mb-0">
                <i className="bi bi-info-circle me-1" aria-hidden="true"></i>
                Aquí se registra lo que se debe <strong>sin salida de caja</strong> (p. ej. una venta a crédito). Si el dinero
                sale de caja, captúralo como egreso en Movimientos con «Cargo a deuda». Los abonos son ingresos en Movimientos.
            </p>

            {error && (
                <div className="alert alert-danger py-2 small mt-3 mb-0" role="alert">
                    <i className="bi bi-exclamation-circle-fill me-1"></i>{error}
                </div>
            )}

            <div className="d-flex justify-content-end gap-2 pt-3 mt-3 border-top">
                <button type="button" className="btn btn-outline-secondary" onClick={onCancelar} disabled={guardando}>
                    Cancelar
                </button>
                {guardando ? (
                    <LoadingButton isLoading text="Guardando..." onClick={() => { }} />
                ) : (
                    <button type="submit" className="btn btn-primary">
                        <i className="bi bi-save me-1"></i>{deuda ? "Guardar cambios" : "Registrar deuda"}
                    </button>
                )}
            </div>
        </form>
    );
}

export default DeudaForm;
