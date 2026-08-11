import { type FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { registro as registroService } from "../../shared/services/auth.service";
import { useAuth } from "../../shared/hooks/useAuth";
import { useToastContext } from "../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../shared/utils/apiError";

export default function Registro() {
    const auth = useAuth();
    const navigate = useNavigate();

    const { mostrarToast } = useToastContext();

    const [form, setForm] = useState({
        username: "",
        password: "",
        password2: "",
        first_name: "",
        last_name: "",
    });
    const [loading, setLoading] = useState(false);

    if (auth.isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();

        setLoading(true);

        try {
            const response = await registroService(form);

            auth.login(
                response.access,
                response.refresh,
                response.user
            );

            mostrarToast(
                "Cuenta creada",
                `Bienvenido ${response.user.first_name || response.user.username}`,
                "success"
            );

            navigate("/", { replace: true });
        } catch (error) {
            mostrarToast(
                "No se pudo crear la cuenta",
                obtenerMensajeError(error),
                "danger"
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page bg-body-secondary">
            <div className="login-box">

                <div className="login-logo">
                    <img
                        src="/logo.png"
                        alt="Importadora y Exportadora de Mariscos"
                        style={{ height: 240, width: "auto" }}
                    />
                </div>

                <div className="card card-outline card-primary">

                    <div className="card-header text-center">
                        <h3 className="mb-0">
                            <b>Importadora y Exportadora de Mariscos del Sur y el Caribe</b>
                        </h3>
                    </div>

                    <div className="card-body">

                        <h4 className="login-box-msg">
                            Crear cuenta
                        </h4>

                        <form onSubmit={handleSubmit}>

                            <div className="row">
                                <div className="col-6">
                                    <div className="mb-3">
                                        <input
                                            className="form-control"
                                            placeholder="Nombre"
                                            value={form.first_name}
                                            onChange={(e) =>
                                                setForm({ ...form, first_name: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="mb-3">
                                        <input
                                            className="form-control"
                                            placeholder="Apellido"
                                            value={form.last_name}
                                            onChange={(e) =>
                                                setForm({ ...form, last_name: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="input-group mb-3">

                                <input
                                    className="form-control"
                                    placeholder="Usuario"
                                    value={form.username}
                                    onChange={(e) =>
                                        setForm({ ...form, username: e.target.value })
                                    }
                                />

                                <div className="input-group-text">
                                    <span className="bi bi-person"></span>
                                </div>

                            </div>

                            <div className="input-group mb-3">

                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Contraseña"
                                    value={form.password}
                                    onChange={(e) =>
                                        setForm({ ...form, password: e.target.value })
                                    }
                                />

                                <div className="input-group-text">
                                    <span className="bi bi-lock-fill"></span>
                                </div>

                            </div>

                            <div className="input-group mb-3">

                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Confirmar contraseña"
                                    value={form.password2}
                                    onChange={(e) =>
                                        setForm({ ...form, password2: e.target.value })
                                    }
                                />

                                <div className="input-group-text">
                                    <span className="bi bi-lock-fill"></span>
                                </div>

                            </div>

                            <button
                                className="btn btn-primary w-100"
                                disabled={loading}
                            >
                                {loading ? "Creando cuenta..." : "Crear cuenta"}
                            </button>

                        </form>

                        <p className="mb-0 mt-3 text-center">
                            <Link to="/login">
                                Ya tengo una cuenta, iniciar sesión
                            </Link>
                        </p>

                    </div>

                </div>

            </div>
        </div>
    );
}
