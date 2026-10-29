import { Route } from "react-router-dom";
import NotificacionesView from "./views/NotificacionesView";

// Sin área: cada quien ve las de sus áreas (el backend filtra).
export const notificacionesRoutes = (
    <>
        <Route path="/notificaciones" element={<NotificacionesView />} />
        <Route path="/notificaciones/:id" element={<NotificacionesView />} />
    </>
);
