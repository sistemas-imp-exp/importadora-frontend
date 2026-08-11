import { useState } from "react";
import LoadingButton from "../../../shared/components/LoadingButton";

interface PasswordFormProps {
    onGuardar: (datos: {
        password_actual: string;
        password_nueva: string;
        password_nueva2: string;
    }) => Promise<void>;
}

const FORM_VACIO = { password_actual: "", password_nueva: "", password_nueva2: "" };

function PasswordForm({ onGuardar }: PasswordFormProps) {
    const [form, setForm] = useState(FORM_VACIO);
    const [isLoading, setIsLoading] = useState(false);

    async function guardar(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onGuardar(form);
            setForm(FORM_VACIO);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={guardar}>
            <div className="mb-3">
                <label className="form-label">Contraseña actual</label>
                <input
                    type="password"
                    className="form-control"
                    value={form.password_actual}
                    onChange={(e) => setForm({ ...form, password_actual: e.target.value })}
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Contraseña nueva</label>
                <input
                    type="password"
                    className="form-control"
                    value={form.password_nueva}
                    onChange={(e) => setForm({ ...form, password_nueva: e.target.value })}
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Confirmar contraseña nueva</label>
                <input
                    type="password"
                    className="form-control"
                    value={form.password_nueva2}
                    onChange={(e) => setForm({ ...form, password_nueva2: e.target.value })}
                />
            </div>

            <div className="text-end">
                {isLoading ? (
                    <LoadingButton isLoading={isLoading} text="Actualizar" onClick={() => { }} />
                ) : (
                    <button type="submit" className="btn btn-primary">
                        <i className="bi bi-shield-lock me-1"></i>
                        Actualizar contraseña
                    </button>
                )}
            </div>
        </form>
    );
}

export default PasswordForm;
