import { useEffect, useRef, useState } from "react";
import LoadingButton from "../../../shared/components/LoadingButton";
import type { Usuario } from "../interfaces/Usuario";
import type { Area } from "../interfaces/Area";

interface UsuarioFormProps {
    usuario: Usuario | null;
    areas: Area[];
    onGuardar: (usuario: Usuario) => Promise<void>;
    onCancelar: () => void;
}

const FORM_VACIO = {
    id: 0,
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    email: "",
    is_active: true,
    is_superuser: false,
    foto: null as string | null,
    areas: [] as string[],
};

function UsuarioForm({ usuario, areas, onGuardar, onCancelar }: UsuarioFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState(FORM_VACIO);
    const usernameInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (usuario) {
            setForm({ ...usuario, password: "" });
        } else {
            setForm(FORM_VACIO);
        }

        if (!usuario && usernameInputRef.current) {
            usernameInputRef.current.focus();
        }
    }, [usuario]);

    function alternarArea(codigo: string) {
        setForm((f) => ({
            ...f,
            areas: f.areas.includes(codigo)
                ? f.areas.filter((c) => c !== codigo)
                : [...f.areas, codigo],
        }));
    }

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
                    <label className="form-label">Usuario</label>
                    <input
                        ref={usernameInputRef}
                        className="form-control"
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                    />
                </div>

                <div className="col-md-6 col-sm-12">
                    <label className="form-label">
                        Contraseña {form.id !== 0 && <small className="text-secondary">(dejar en blanco para no cambiarla)</small>}
                    </label>
                    <input
                        type="password"
                        className="form-control"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                </div>

                <div className="col-md-6 col-sm-12 mt-3">
                    <label className="form-label">Nombre</label>
                    <input
                        className="form-control"
                        value={form.first_name}
                        onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    />
                </div>

                <div className="col-md-6 col-sm-12 mt-3">
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

                <div className="col-12 mt-3 d-flex gap-4">
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="usuario-activo"
                            checked={form.is_active}
                            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                        />
                        <label className="form-check-label" htmlFor="usuario-activo">Activo</label>
                    </div>

                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="usuario-superusuario"
                            checked={form.is_superuser}
                            onChange={(e) => setForm({ ...form, is_superuser: e.target.checked })}
                        />
                        <label className="form-check-label" htmlFor="usuario-superusuario">Superusuario</label>
                    </div>
                </div>

                <div className="col-12 mt-3">
                    <label className="form-label d-block">Áreas con acceso</label>
                    {areas.length === 0 ? (
                        <small className="text-secondary">No hay áreas registradas.</small>
                    ) : (
                        <div className="d-flex flex-wrap gap-3">
                            {areas.map((area) => (
                                <div className="form-check" key={area.codigo}>
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id={`area-${area.codigo}`}
                                        checked={form.areas.includes(area.codigo)}
                                        onChange={() => alternarArea(area.codigo)}
                                    />
                                    <label className="form-check-label" htmlFor={`area-${area.codigo}`}>
                                        {area.nombre}
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
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
                            {form.id === 0 ? "Crear usuario" : "Guardar cambios"}
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
}

export default UsuarioForm;
