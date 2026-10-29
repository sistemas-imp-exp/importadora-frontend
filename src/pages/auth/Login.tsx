import { type FormEvent, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { login as loginService } from "../../shared/services/auth.service";
import { leerMotivoSalida, limpiarMotivoSalida } from "../../shared/services/sesion";
import { useAuth } from "../../shared/hooks/useAuth";
import { useToastContext } from "../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../shared/utils/apiError";
import { MINUTOS_INACTIVIDAD } from "../../shared/hooks/useInactividad";

const AVISOS_SALIDA = {
    inactividad: `Tu sesión se cerró tras ${MINUTOS_INACTIVIDAD} minutos sin actividad. Vuelve a iniciar sesión.`,
    expirada: "Tu sesión terminó. Vuelve a iniciar sesión.",
} as const;


export default function Login() {
    const auth = useAuth();
    const navigate = useNavigate();

    const { mostrarToast } = useToastContext();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [motivo] = useState(leerMotivoSalida);

    useEffect(() => {
        limpiarMotivoSalida();
    }, []);

    if (auth.cargando) {
        return null;
    }

    if (auth.isAuthenticated) {
        return <Navigate to={auth.user?.debe_cambiar_password ? "/cambiar-password" : "/"} replace />;
    }

    const aviso = motivo === "inactividad" || motivo === "expirada" ? AVISOS_SALIDA[motivo] : null;

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();

        setLoading(true);
        setError(null);

        try {
            const response = await loginService({
                username,
                password,
            });

            auth.login(response.access, response.user);

            if (response.user.debe_cambiar_password) {
                navigate("/cambiar-password", { replace: true });
                return;
            }

            mostrarToast(
                "Inicio de sesión",
                `Bienvenido ${response.user.first_name || response.user.username}`,
                "success"
            );

            navigate("/", { replace: true });
        } catch (err) {
            // El backend da un mensaje genérico (no revela si el usuario existe)
            // o el tiempo de espera tras varios intentos fallidos.
            setError(obtenerMensajeError(err));
            setPassword("");
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
                        alt="Importadora y Exportadora de Mariscos de Centro América y el Caribe"
                        style={{ height: 240, width: "auto" }}
                    />
                </div>

                <div className="card card-outline card-primary">

                    <div className="card-header text-center">
                        <h3 className="mb-0">
                            <b>Importadora y Exportadora de Mariscos de Centro América y el Caribe</b>
                        </h3>
                    </div>

                    <div className="card-body">

                        <h4 className="login-box-msg">
                            Iniciar sesión
                        </h4>

                        {aviso && !error && (
                            <div className="alert alert-info py-2 small" role="status">
                                <i className="bi bi-clock-history me-1" aria-hidden="true"></i>{aviso}
                            </div>
                        )}
                        {error && (
                            <div className="alert alert-danger py-2 small" role="alert">
                                <i className="bi bi-exclamation-triangle me-1" aria-hidden="true"></i>{error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>

                            <div className="input-group mb-3">

                                <input
                                    className="form-control"
                                    placeholder="Usuario"
                                    autoComplete="username"
                                    autoFocus
                                    required
                                    value={username}
                                    onChange={(e) =>
                                        setUsername(e.target.value)
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
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
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
                                {loading ? "Entrando..." : "Entrar"}
                            </button>

                        </form>

                    </div>

                </div>

            </div>
        </div>
    );
}