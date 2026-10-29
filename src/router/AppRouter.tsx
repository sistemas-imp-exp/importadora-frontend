import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import Login from "../pages/auth/Login";
import CambiarPasswordObligatorio from "../pages/auth/CambiarPasswordObligatorio";

import { dashboardRoutes } from "../app/dashboard/routes";
import { tesoreriaRoutes } from "../app/tesoreria/routes";
import { perfilRoutes } from "../app/perfil/routes";
import { usuariosRoutes } from "../app/usuarios/routes";
import { inventarioRoutes } from "../app/inventario/routes";
import { carteraRoutes } from "../app/cartera/routes";
import { notificacionesRoutes } from "../app/notificaciones/routes";

import PrivateRoute from "./PrivateRoute";

function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>

                {/* Sin registro público: las cuentas las crea un superusuario en Usuarios. */}
                <Route path="/login" element={<Login />} />
                <Route path="/cambiar-password" element={<CambiarPasswordObligatorio />} />

                <Route element={<PrivateRoute />}>
                    <Route element={<MainLayout />}>
                        {dashboardRoutes}
                        {perfilRoutes}
                        {notificacionesRoutes}
                        <Route element={<PrivateRoute area="TES" />}>
                            {tesoreriaRoutes}
                        </Route>
                        <Route element={<PrivateRoute area="INV" />}>
                            {inventarioRoutes}
                        </Route>
                        <Route element={<PrivateRoute area="CAR" />}>
                            {carteraRoutes}
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