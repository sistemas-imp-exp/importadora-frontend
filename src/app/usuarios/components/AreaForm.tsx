import { useState, useEffect, useRef } from "react";
import LoadingButton from "../../../shared/components/LoadingButton";
import type { Area } from "../interfaces/Area";

interface AreaFormProps {
    onGuardar: (area: Area) => Promise<void>;
    onCancelar: () => void;
    area: Area | null;
}

const FORM_VACIO = {
    id: 0,
    codigo: "",
    nombre: "",
    activo: true,
};

function AreaForm({ onGuardar, onCancelar, area }: AreaFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState(FORM_VACIO);
    const codigoInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (area) {
            setForm({
                id: area.id,
                codigo: area.codigo,
                nombre: area.nombre,
                activo: area.activo,
            });
        } else {
            setForm(FORM_VACIO);
        }

        if (!area && codigoInputRef.current) {
            codigoInputRef.current.focus();
        }
    }, [area]);

    async function guardar(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);

        try {
            await onGuardar({ ...form, codigo: form.codigo.trim().toUpperCase() });
            setForm(FORM_VACIO);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={guardar}>
            <div className="row">
                <div className="col-md-4 col-sm-12">
                    <label className="form-label">Código</label>
                    <input
                        ref={codigoInputRef}
                        className="form-control"
                        value={form.codigo}
                        onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                    />
                </div>

                <div className="col-md-8 col-sm-12">
                    <label className="form-label">Nombre</label>
                    <input
                        className="form-control"
                        value={form.nombre}
                        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    />
                </div>

                <div className="col-12 mt-3">
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="area-activo"
                            checked={form.activo}
                            onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                        />
                        <label className="form-check-label" htmlFor="area-activo">Activo</label>
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
                            {form.id === 0 ? "Registrar rol" : "Guardar cambios"}
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
}

export default AreaForm;
