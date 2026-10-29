import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../shared/hooks/useAuth";

interface Props {
    area?: string;
}

export function CargandoSesion() {
    return (
        <div className="d-flex justify-content-center align-items-center vh-100" role="status">
            <div className="spinner-border text-primary" aria-hidden="true"></div>
            <span className="visually-hidden">Cargando sesión…</span>
        </div>
    );
}

export default function PrivateRoute({ area }: Props) {
    const { isAuthenticated, hasArea, cargando, user } = useAuth();

    if (cargando) {
        return <CargandoSesion />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Contraseña provisional: no se usa el sistema hasta cambiarla.
    if (user?.debe_cambiar_password) {
        return <Navigate to="/cambiar-password" replace />;
    }

    if (area && !hasArea(area)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
