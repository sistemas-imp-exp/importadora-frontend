import { Route } from "react-router-dom";
import PerfilView from "./views/PerfilView";

export const perfilRoutes = (
    <>
        <Route path="/perfil" element={<PerfilView />} />
    </>
);
