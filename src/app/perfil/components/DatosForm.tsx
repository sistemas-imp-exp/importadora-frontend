import { useEffect, useState } from "react";
import LoadingButton from "../../../shared/components/LoadingButton";
import type { User } from "../../../shared/interfaces/auth";

interface DatosFormProps {
    user: User;
    onGuardar: (datos: { first_name: string; last_name: string; email: string }) => Promise<void>;
}

function DatosForm({ user, onGuardar }: DatosFormProps) {
    const [form, setForm] = useState({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setForm({
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
        });
    }, [user]);

    async function guardar(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onGuardar(form);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={guardar}>
            <div className="row">
                <div className="col-md-6 col-sm-12">
                    <label className="form-label">Nombre</label>
                    <input
                        className="form-control"
                        value={form.first_name}
                        onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    />
                </div>

                <div className="col-md-6 col-sm-12">
                    <label className="form-label">Apellido</label>
                    <input
                        className="form-control"
                        value={form.last_name}
                        onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    />
                </div>

                <div className="col-12 mt-3">
                    <label className="form-label">Correo</label>
                    <input
                        type="email"
                        className="form-control"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                </div>
            </div>

            <div className="mt-4 text-end">
                {isLoading ? (
                    <LoadingButton isLoading={isLoading} text="Guardar" onClick={() => { }} />
                ) : (
                    <button type="submit" className="btn btn-primary">
                        <i className="bi bi-check-lg me-1"></i>
                        Guardar cambios
                    </button>
                )}
            </div>
        </form>
    );
}

export default DatosForm;
