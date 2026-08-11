import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../shared/hooks/useAuth";

interface Props {
    area?: string;
}

export default function PrivateRoute({ area }: Props) {
    const { isAuthenticated, hasArea } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (area && !hasArea(area)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}