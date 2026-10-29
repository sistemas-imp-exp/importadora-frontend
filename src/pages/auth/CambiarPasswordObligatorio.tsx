import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import PasswordForm from "../../app/perfil/components/PasswordForm";
import { CargandoSesion } from "../../router/PrivateRoute";
import { useAuth } from "../../shared/hooks/useAuth";
import { useToastContext } from "../../shared/context/ToastProvider";
import { cambiarPassword } from "../../shared/services/auth.service";
import { sesion } from "../../shared/services/sesion";
import { obtenerMensajeError } from "../../shared/utils/apiError";
import type { CambiarPasswordRequest } from "../../shared/interfaces/auth";

/** Primer ingreso o contraseña restablecida por el superusuario: hay que cambiarla para seguir. */
export default function CambiarPasswordObligatorio() {
    const { user, cargando, updateUser, logout } = useAuth();
    const navigate = useNavigate();
    const { mostrarToast } = useToastContext();
    const [error, setError] = useState<string | null>(null);

    if (cargando) return <CargandoSesion />;
    if (!user) return <Navigate to="/login" replace />;
    if (!user.debe_cambiar_password) return <Navigate to="/" replace />;

    async function guardar(datos: CambiarPasswordRequest) {
        setError(null);
        try {
            const respuesta = await cambiarPassword(datos);
            sesion.setAccess(respuesta.access);
            updateUser(respuesta.user);
            mostrarToast("Contraseña actualizada", `Bienvenido ${respuesta.user.first_name || respuesta.user.username}`, "success");
            navigate("/", { replace: true });
        } catch (err) {
            setError(obtenerMensajeError(err));
            throw err;
        }
    }

    return (
        <div className="login-page bg-body-secondary">
            <div className="login-box" style={{ width: 420 }}>
                <div className="card card-outline card-warning">
                    <div className="card-header text-center">
                        <h3 className="h5 mb-0">Cambia tu contraseña</h3>
                    </div>
                    <div className="card-body">
                        <p className="small text-body-secondary">
                            Hola <strong>{user.first_name || user.username}</strong>: tu contraseña actual es provisional.
                            Crea una nueva para continuar. Debe tener al menos 10 caracteres, no ser solo números ni
                            parecerse a tu usuario.
                        </p>
                        {error && (
                            <div className="alert alert-danger py-2 small" role="alert">{error}</div>
                        )}
                        <PasswordForm onGuardar={guardar} />
                        <button type="button" className="btn btn-link btn-sm w-100 mt-2" onClick={() => logout()}>
                            Salir sin cambiarla
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
