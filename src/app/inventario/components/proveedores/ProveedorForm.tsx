import { useState, useEffect, useRef } from "react";
import LoadingButton from "../../../../shared/components/LoadingButton";
import type { Proveedor } from "../../interfaces/proveedores/Proveedor";

interface ProveedorFormProps {
    onGuardar: (proveedor: Proveedor) => Promise<void>;
    onCancelar: () => void;
    proveedor: Proveedor | null;
}

const VACIO: Proveedor = { id: 0, nombre: "", activo: true };

function ProveedorForm({ onGuardar, onCancelar, proveedor }: ProveedorFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState<Proveedor>(VACIO);
    const nombreInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        setForm(proveedor ? { ...proveedor } : VACIO);
        if (!proveedor && nombreInputRef.current) {
            nombreInputRef.current.focus();
        }
    }, [proveedor]);

    async function guardar(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!form.nombre.trim()) {
            setError("El nombre es obligatorio.");
            return;
        }

        setIsLoading(true);
        try {
            await onGuardar({ ...form, nombre: form.nombre.trim().toUpperCase() });
            setForm(VACIO);
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
                        id="proveedor-activo"
                        checked={form.activo}
                        onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="proveedor-activo">Activo</label>
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
                            {form.id === 0 ? "Registrar proveedor" : "Guardar cambios"}
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
}

export default ProveedorForm;
