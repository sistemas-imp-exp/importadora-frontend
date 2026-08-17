import { useEffect, useRef, useState } from "react";
import LoadingButton from "../../../../shared/components/LoadingButton";
import type { Puesto } from "../../interfaces/nomina/Puesto";

interface PuestoFormProps {
    onGuardar: (puesto: Puesto) => Promise<void>;
    onCancelar: () => void;
    puesto: Puesto | null;
}

function PuestoForm({ onGuardar, onCancelar, puesto }: PuestoFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        id: 0,
        nombre: "",
        activo: true
    });
    const nombreInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (puesto) {
            setForm({
                id: puesto.id ?? 0,
                nombre: puesto.nombre,
                activo: puesto.activo
            });
        } else {
            setForm({
                id: 0,
                nombre: "",
                activo: true
            });
        }

        if (!puesto && nombreInputRef.current) {
            nombreInputRef.current.focus();
        }
    }, [puesto]);

    function validarFormulario(): string | null {
        if (!form.nombre.trim()) return "El nombre es obligatorio.";
        return null;
    }

    async function guardar(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const mensajeError = validarFormulario();
        if (mensajeError) {
            setError(mensajeError);
            return;
        }

        setIsLoading(true);
        try {
            await onGuardar(form);
            setForm({ id: 0, nombre: "", activo: true });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={guardar}>
            <div className="row g-3">
                <div className="col-12">
                    <label className="form-label">Nombre <span className="text-danger">*</span></label>
                    <input
                        ref={nombreInputRef}
                        className="form-control"
                        value={form.nombre}
                        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    />
                </div>
            </div>

            {error && (
                <div className="alert alert-danger py-2 small mt-3 mb-0" role="alert">
                    <i className="bi bi-exclamation-circle-fill me-1"></i>
                    {error}
                </div>
            )}

            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 pt-3 mt-4 border-top">
                <div className="form-check">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        id="puesto-activo"
                        checked={form.activo}
                        onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="puesto-activo">Activo</label>
                </div>

                <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-secondary" onClick={onCancelar}>
                        Cancelar
                    </button>
                    {isLoading ? (
                        <LoadingButton isLoading={isLoading} text="Guardar" onClick={() => { }} />
                    ) : (
                        <button type="submit" className="btn btn-primary">
                            <i className="bi bi-plus-lg me-1"></i>
                            {form.id === 0 ? "Registrar puesto" : "Guardar cambios"}
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
}

export default PuestoForm;
