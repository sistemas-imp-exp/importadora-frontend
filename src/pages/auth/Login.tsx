import { type FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { login as loginService } from "../../shared/services/auth.service";
import { useAuth } from "../../shared/hooks/useAuth";
import { useToastContext } from "../../shared/context/ToastProvider";


export default function Login() {
    const auth = useAuth();
    const navigate = useNavigate();

    const { mostrarToast } = useToastContext();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    if (auth.isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();

        setLoading(true);

        try {
            const response = await loginService({
                username,
                password,
            });

            auth.login(
                response.access,
                response.refresh,
                response.user
            );

            mostrarToast(
                "Inicio de sesión",
                `Bienvenido ${response.user.first_name || response.user.username}`,
                "success"
            );
            
            navigate("/", { replace: true });
        } catch {
            mostrarToast(
                "Inicio de sesión invalido",
                "Usuario o contraseña incorrectos",
                "danger"
            )
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
                            Iniciar sesión
                        </h4>

                        <form onSubmit={handleSubmit}>

                            <div className="input-group mb-3">

                                <input
                                    className="form-control"
                                    placeholder="Usuario"
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