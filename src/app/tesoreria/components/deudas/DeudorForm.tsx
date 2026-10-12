import { useState } from "react";
import LoadingButton from "../../../../shared/components/LoadingButton";
import { TIPOS_DEUDOR, type Deudor, type DeudorRequest, type TipoDeudor } from "../../interfaces/deudas/Deuda";

interface DeudorFormProps {
    /** Estado inicial desde props: la vista le pone `key` para cambiar de registro. */
    deudor: Deudor | null;
    onGuardar: (datos: DeudorRequest) => Promise<void>;
    onCancelar: () => void;
}

function DeudorForm({ deudor, onGuardar, onCancelar }: DeudorFormProps) {
    const [form, setForm] = useState<DeudorRequest>({
        nombre: deudor?.nombre ?? "",
        tipo: deudor?.tipo ?? "E",
        telefono: deudor?.telefono ?? "",
        notas: deudor?.notas ?? "",
        activo: deudor?.activo ?? true,
    });
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function guardar(e: React.FormEvent) {
        e.preventDefault();
        if (!form.nombre.trim()) {
            setError("El nombre es obligatorio.");
            return;
        }
        setError(null);
        setGuardando(true);
        try {
            await onGuardar({ ...form, nombre: form.nombre.trim(), telefono: form.telefono.trim() });
        } catch {
            // El toast con el mensaje del servidor lo muestra la vista.
        } finally {
            setGuardando(false);
        }
    }

    return (
        <form onSubmit={guardar}>
            <div className="row g-3">
                <div className="col-md-8">
                    <label className="form-label" htmlFor="deudor-nombre">Nombre <span className="text-danger">*</span></label>
                    <input
                        id="deudor-nombre"
                        className="form-control"
                        value={form.nombre}
                        autoFocus
                        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    />
                </div>
                <div className="col-md-4">
                    <label className="form-label" htmlFor="deudor-tipo">Tipo</label>
                    <select
                        id="deudor-tipo"
                        className="form-select"
                        value={form.tipo}
                        onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoDeudor })}
                    >
                        {Object.entries(TIPOS_DEUDOR).map(([valor, etiqueta]) => (
                            <option key={valor} value={valor}>{etiqueta}</option>
                        ))}
                    </select>
                </div>
                <div className="col-md-4">
                    <label className="form-label" htmlFor="deudor-telefono">Teléfono</label>
                    <input
                        id="deudor-telefono"
                        className="form-control"
                        value={form.telefono}
                        onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    />
                </div>
                <div className="col-md-8">
                    <label className="form-label" htmlFor="deudor-notas">Notas</label>
                    <input
                        id="deudor-notas"
                        className="form-control"
                        value={form.notas}
                        onChange={(e) => setForm({ ...form, notas: e.target.value })}
                    />
                </div>
            </div>

            {error && (
                <div className="alert alert-danger py-2 small mt-3 mb-0" role="alert">
                    <i className="bi bi-exclamation-circle-fill me-1"></i>{error}
                </div>
            )}

            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 pt-3 mt-4 border-top">
                <div className="form-check">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        id="deudor-activo"
                        checked={form.activo}
                        onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="deudor-activo">Activo</label>
                </div>
                <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-secondary" onClick={onCancelar} disabled={guardando}>
                        Cancelar
                    </button>
                    {guardando ? (
                        <LoadingButton isLoading text="Guardando..." onClick={() => { }} />
                    ) : (
                        <button type="submit" className="btn btn-primary">
                            <i className="bi bi-save me-1"></i>{deudor ? "Guardar cambios" : "Registrar deudor"}
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
}

export default DeudorForm;
