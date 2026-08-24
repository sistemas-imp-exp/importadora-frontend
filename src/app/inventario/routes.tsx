import { Route } from "react-router-dom";
import EmpresasView from "./views/empresas/EmpresasView";

export const inventarioRoutes = (
    <>
        <Route path="/inventario/empresas" element={<EmpresasView />} />
    </>
);
