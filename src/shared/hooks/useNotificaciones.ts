import { useContext } from "react";
import { NotificacionesContext } from "../context/NotificacionesContext";

export const useNotificaciones = () => useContext(NotificacionesContext);
