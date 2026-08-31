import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import Login from "../pages/auth/Login";
import Registro from "../pages/auth/Registro";

import { dashboardRoutes } from "../app/dashboard/routes";
import { tesoreriaRoutes } from "../app/tesoreria/routes";
import { perfilRoutes } from "../app/perfil/routes";
import { usuariosRoutes } from "../app/usuarios/routes";
import { inventarioRoutes } from "../app/inventario/routes";

import PrivateRoute from "./PrivateRoute";

function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>

                <Route path="/login" element={<Login />} />
                <Route path="/registro" element={<Registro />} />

                <Route element={<PrivateRoute />}>
                    <Route element={<MainLayout />}>
                        {dashboardRoutes}
                        {perfilRoutes}
                        <Route element={<PrivateRoute area="TES" />}>
                            {tesoreriaRoutes}
                        </Route>
                        <Route element={<PrivateRoute area="INV" />}>
                            {inventarioRoutes}
                        </Route>
                        <Route element={<PrivateRoute area="ADMIN" />}>
                            {usuariosRoutes}
                        </Route>
                    </Route>
                </Route>

            </Routes>
        </BrowserRouter>
    );
}

export default AppRouter;