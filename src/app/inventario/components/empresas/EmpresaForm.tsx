import { useState, useEffect, useRef } from "react";
import LoadingButton from "../../../../shared/components/LoadingButton";
import type { Empresa } from "../../interfaces/empresas/Empresa";

interface EmpresaFormProps {
    onGuardar: (empresa: Empresa) => Promise<void>;
    onCancelar: () => void;
    empresa: Empresa | null;
}

function EmpresaForm({ onGuardar, onCancelar, empresa }: EmpresaFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState<Empresa>({ id: 0, nombre: "" });
    const nombreInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        setForm(empresa ? { id: empresa.id, nombre: empresa.nombre } : { id: 0, nombre: "" });
        if (!empresa && nombreInputRef.current) {
            nombreInputRef.current.focus();
        }
    }, [empresa]);

    async function guardar(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!form.nombre.trim()) {
            setError("El nombre es obligatorio.");
            return;
        }

        setIsLoading(true);
        try {
            await onGuardar(form);
            setForm({ id: 0, nombre: "" });
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

            <div className="d-flex justify-content-end gap-2 pt-3 mt-4 border-top">
                <button type="button" className="btn btn-outline-secondary" onClick={onCancelar}>
                    Cancelar
                </button>
                {isLoading ? (
                    <LoadingButton isLoading={isLoading} text="Guardar" onClick={() => { }} />
                ) : (
                    <button type="submit" className="btn btn-primary">
                        <i className="bi bi-plus-lg me-1"></i>
                        {form.id === 0 ? "Registrar empresa" : "Guardar cambios"}
                    </button>
                )}
            </div>
        </form>
    );
}

export default EmpresaForm;
