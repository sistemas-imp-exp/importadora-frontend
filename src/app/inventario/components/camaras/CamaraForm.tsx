import { useState, useEffect, useRef } from "react";
import LoadingButton from "../../../../shared/components/LoadingButton";
import type { Camara } from "../../interfaces/camaras/Camara";
import type { Empresa } from "../../interfaces/empresas/Empresa";

interface CamaraFormProps {
    onGuardar: (camara: Camara) => Promise<void>;
    onCancelar: () => void;
    camara: Camara | null;
    empresas: Empresa[];
}

const VACIO: Camara = { id: 0, nombre: "", ubicacion: "", tipo: "propia", empresa: null, activo: true };

function CamaraForm({ onGuardar, onCancelar, camara, empresas }: CamaraFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState<Camara>(VACIO);
    const nombreInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        setForm(camara ? { ...camara } : VACIO);
        if (!camara && nombreInputRef.current) {
            nombreInputRef.current.focus();
        }
    }, [camara]);

    async function guardar(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!form.nombre.trim()) {
            setError("El nombre es obligatorio.");
            return;
        }

        setIsLoading(true);
        try {
            await onGuardar({ ...form, nombre: form.nombre.trim().toUpperCase(), ubicacion: form.ubicacion.trim().toUpperCase() });
            setForm(VACIO);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={guardar}>
            <div className="row g-3">
                <div className="col-md-6 col-sm-12">
                    <label className="form-label">Nombre <span className="text-danger">*</span></label>
                    <input
                        ref={nombreInputRef}
                        className="form-control"
                        value={form.nombre}
                        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    />
                </div>

                <div className="col-md-6 col-sm-12">
                    <label className="form-label">Ubicación</label>
                    <input
                        className="form-control"
                        value={form.ubicacion}
                        onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
                    />
                </div>

                <div className="col-md-6 col-sm-12">
                    <label className="form-label">Tipo</label>
                    <select
                        className="form-select"
                        value={form.tipo}
                        onChange={(e) => setForm({ ...form, tipo: e.target.value as Camara["tipo"] })}
                    >
                        <option value="propia">Propia</option>
                        <option value="tercero">Rentada de tercero</option>
                    </select>
                </div>

                <div className="col-md-6 col-sm-12">
                    <label className="form-label">Empresa (si es propia)</label>
                    <select
                        className="form-select"
                        value={form.empresa ?? ""}
                        onChange={(e) => setForm({ ...form, empresa: e.target.value ? Number(e.target.value) : null })}
                    >
                        <option value="">Sin empresa</option>
                        {empresas.map((empresa) => (
                            <option key={empresa.id} value={empresa.id}>{empresa.nombre}</option>
                        ))}
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
                        id="camara-activa"
                        checked={form.activo}
                        onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="camara-activa">Activa</label>
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
                            {form.id === 0 ? "Registrar cámara" : "Guardar cambios"}
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
}

export default CamaraForm;
