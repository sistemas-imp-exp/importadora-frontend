import { Route } from "react-router-dom";
import UsuariosView from "./views/UsuariosView";
import RolesView from "./views/RolesView";
import BitacoraAccesosView from "./views/BitacoraAccesosView";

export const usuariosRoutes = (
    <>
        <Route path="/usuarios" element={<UsuariosView />} />
        <Route path="/usuarios/roles" element={<RolesView />} />
        <Route path="/usuarios/bitacora" element={<BitacoraAccesosView />} />
    </>
);
