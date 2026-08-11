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

    async function guardar(e: React.FormEvent) {
        e.preventDefault();
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
            <div className="row">
                <div className="col-md-6 col-sm-12">
                    <label className="form-label">Código</label>
                    <input
                        ref={codigoInputRef}
                        className="form-control"
                        value={form.codigo}
                        onChange={(e) =>
                            setForm({ ...form, codigo: e.target.value })
                        }
                    />
                </div>

                <div className="col-md-6 col-sm-12">
                    <label className="form-label">Nombre</label>
                    <input
                        className="form-control"
                        value={form.nombre}
                        onChange={(e) =>
                            setForm({ ...form, nombre: e.target.value })
                        }
                    />
                </div>

                <div className="col-md-6 col-sm-12">
                    <label className="form-label">Símbolo</label>
                    <input
                        className="form-control"
                        value={form.simbolo}
                        onChange={(e) =>
                            setForm({ ...form, simbolo: e.target.value })
                        }
                    />
                </div>

                <div className="col-md-2 d-flex align-items-end">
                    <div className="form-check mt-3">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            checked={form.activa}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    activa: e.target.checked
                                })
                            }
                        />

                        <label className="form-check-label">
                            Activa
                        </label>
                    </div>
                </div>
            </div>
            <div className="row mt-4">
                <div className="col-12 d-flex justify-content-between">
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
                        <>
                            <button type="submit" className="btn btn-primary">
                                <i className="bi bi-plus-lg me-1"></i>
                                {form.id === 0 ? "Registrar divisa" : "Guardar cambios"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </form>
    );
}

export default DivisaForm;