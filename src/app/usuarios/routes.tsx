import { Route } from "react-router-dom";
import UsuariosView from "./views/UsuariosView";
import RolesView from "./views/RolesView";

export const usuariosRoutes = (
    <>
        <Route path="/usuarios" element={<UsuariosView />} />
        <Route path="/usuarios/roles" element={<RolesView />} />
    </>
);
