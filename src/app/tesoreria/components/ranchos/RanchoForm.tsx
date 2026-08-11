import { useEffect, useRef, useState } from "react";
import LoadingButton from "../../../../shared/components/LoadingButton";
import type { Rancho } from "../../interfaces/nomina/Rancho";

interface RanchoFormProps {
    onGuardar: (rancho: Rancho) => Promise<void>;
    onCancelar: () => void;
    rancho: Rancho | null;
}

function RanchoForm({ onGuardar, onCancelar, rancho }: RanchoFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    const [form, setForm] = useState({
        id: 0,
        nombre: "",
        activo: true
    });
    const nombreInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (rancho) {
            setForm({
                id: rancho.id ?? 0,
                nombre: rancho.nombre,
                activo: rancho.activo
            });
        } else {
            setForm({
                id: 0,
                nombre: "",
                activo: true
            });
        }

        if (!rancho && nombreInputRef.current) {
            nombreInputRef.current.focus();
        }
    }, [rancho]);

    async function guardar(e: React.FormEvent) {
        e.preventDefault();
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
            <div className="row">
                <div className="col-md-8 col-sm-12">
                    <label className="form-label">Nombre</label>
                    <input
                        ref={nombreInputRef}
                        className="form-control"
                        value={form.nombre}
                        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    />
                </div>

                <div className="col-md-4 d-flex align-items-end">
                    <div className="form-check mt-3">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            checked={form.activo}
                            onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                        />
                        <label className="form-check-label">Activo</label>
                    </div>
                </div>
            </div>
            <div className="row mt-4">
                <div className="col-12 d-flex justify-content-between">
                    <button type="button" className="btn btn-outline-secondary" onClick={onCancelar}>
                        Cancelar
                    </button>
                    {isLoading ? (
                        <LoadingButton isLoading={isLoading} text="Guardar" onClick={() => { }} />
                    ) : (
                        <button type="submit" className="btn btn-primary">
                            <i className="bi bi-plus-lg me-1"></i>
                            {form.id === 0 ? "Registrar rancho" : "Guardar cambios"}
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
}

export default RanchoForm;
