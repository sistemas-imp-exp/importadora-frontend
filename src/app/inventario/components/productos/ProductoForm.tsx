import { useState, useEffect, useRef } from "react";
import LoadingButton from "../../../../shared/components/LoadingButton";
import type { Producto } from "../../interfaces/productos/Producto";

interface ProductoFormProps {
    onGuardar: (producto: Producto) => Promise<void>;
    onCancelar: () => void;
    producto: Producto | null;
}

const VACIO: Producto = { id: 0, talla: "", tipo: "", categoria: "", presentacion: "", activo: true };

function ProductoForm({ onGuardar, onCancelar, producto }: ProductoFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState<Producto>(VACIO);
    const tallaInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        setForm(producto ? { ...producto } : VACIO);
        if (!producto && tallaInputRef.current) {
            tallaInputRef.current.focus();
        }
    }, [producto]);

    async function guardar(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!form.talla.trim()) {
            setError("La talla es obligatoria.");
            return;
        }
        if (!form.tipo.trim()) {
            setError("El tipo es obligatorio.");
            return;
        }

        setIsLoading(true);
        try {
            await onGuardar(form);
            setForm(VACIO);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={guardar}>
            <div className="row g-3">
                <div className="col-md-6 col-sm-12">
                    <label className="form-label">Talla <span className="text-danger">*</span></label>
                    <input
                        ref={tallaInputRef}
                        className="form-control"
                        placeholder="Ej. 41-50"
                        value={form.talla}
                        onChange={(e) => setForm({ ...form, talla: e.target.value })}
                    />
                </div>

                <div className="col-md-6 col-sm-12">
                    <label className="form-label">Tipo <span className="text-danger">*</span></label>
                    <input
                        className="form-control"
                        placeholder="Ej. FREEZADO, MARQUETA"
                        value={form.tipo}
                        onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    />
                </div>

                <div className="col-md-6 col-sm-12">
                    <label className="form-label">Categoría</label>
                    <input
                        className="form-control"
                        placeholder="Ej. Camarón, Pescado"
                        value={form.categoria}
                        onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    />
                </div>

                <div className="col-md-6 col-sm-12">
                    <label className="form-label">Presentación</label>
                    <select
                        className="form-select"
                        value={form.presentacion}
                        onChange={(e) => setForm({ ...form, presentacion: e.target.value as Producto["presentacion"] })}
                    >
                        <option value="">Sin especificar</option>
                        <option value="entero">Entero</option>
                        <option value="colas">Colas</option>
                    </select>
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
                        id="producto-activo"
                        checked={form.activo}
                        onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="producto-activo">Activo</label>
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
                            {form.id === 0 ? "Registrar producto" : "Guardar cambios"}
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
}

export default ProductoForm;
