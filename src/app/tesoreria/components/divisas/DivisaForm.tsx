import { useState, useEffect, useRef } from "react";
import LoadingButton from "../../../../shared/components/LoadingButton";
import type { Divisa } from "../../interfaces/divisas/Divisa";

interface DivisaFormProps {
    onGuardar: (divisa: Divisa) => Promise<void>;
    onCancelar: () => void;
    divisa: Divisa | null;
}

function DivisaForm({ onGuardar, onCancelar, divisa }: DivisaFormProps) {

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


    const [form, setForm] = useState({
        id: 0,
        codigo: "",
        nombre: "",
        simbolo: "",
        activa: true
    });
    const codigoInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (divisa) {
            setForm({
                id: divisa.id ?? 0,
                codigo: divisa.codigo,
                nombre: divisa.nombre,
                simbolo: divisa.simbolo,
                activa: divisa.activa
            });
        } else {
            setForm({
                id:0,
                codigo: "",
                nombre: "",
                simbolo: "",
                activa: true
            });
        }

        if (!divisa && codigoInputRef.current) {
            codigoInputRef.current.focus();
        }
    }, [divisa]);

    function validarFormulario(): string | null {
        if (!form.codigo.trim()) return "El código es obligatorio.";
        if (!form.nombre.trim()) return "El nombre es obligatorio.";
        if (!form.simbolo.trim()) return "El símbolo es obligatorio.";
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
            setForm({
                id: 0,
                codigo: "",
                nombre: "",
                simbolo: "",
                activa: true
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={guardar}>
            <div className="row g-3">
                <div className="col-md-4 col-sm-12">
                    <label className="form-label">Código <span className="text-danger">*</span></label>
                    <input
                        ref={codigoInputRef}
                        className="form-control"
                        value={form.codigo}
                        onChange={(e) =>
                            setForm({ ...form, codigo: e.target.value })
                        }
                    />
                </div>

                <div className="col-md-4 col-sm-12">
                    <label className="form-label">Nombre <span className="text-danger">*</span></label>
                    <input
                        className="form-control"
                        value={form.nombre}
                        onChange={(e) =>
                            setForm({ ...form, nombre: e.target.value })
                        }
                    />
                </div>

                <div className="col-md-4 col-sm-12">
                    <label className="form-label">Símbolo <span className="text-danger">*</span></label>
                    <input
                        className="form-control"
                        value={form.simbolo}
                        onChange={(e) =>
                            setForm({ ...form, simbolo: e.target.value })
                        }
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
                        id="divisa-activa"
                        checked={form.activa}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                activa: e.target.checked
                            })
                        }
                    />
                    <label className="form-check-label" htmlFor="divisa-activa">
                        Activa
                    </label>
                </div>

                <div className="d-flex gap-2">
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={onCancelar}
                    >
                        Cancelar
                    </button>
                    {isLoading ? (
                        <LoadingButton
                            isLoading={isLoading}
                            text="Guardar"
                            onClick={() => { }}
                        />
                    ) : (
                        <button type="submit" className="btn btn-primary">
                            <i className="bi bi-plus-lg me-1"></i>
                            {form.id === 0 ? "Registrar divisa" : "Guardar cambios"}
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
}

export default DivisaForm;