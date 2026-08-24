import { Route } from "react-router-dom";
import EmpresasView from "./views/empresas/EmpresasView";
import CamarasView from "./views/camaras/CamarasView";

export const inventarioRoutes = (
    <>
        <Route path="/inventario/empresas" element={<EmpresasView />} />
        <Route path="/inventario/camaras" element={<CamarasView />} />
    </>
);
