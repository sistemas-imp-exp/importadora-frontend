import { Route, Navigate } from "react-router-dom";
import EmpresasView from "./views/empresas/EmpresasView";
import CamarasView from "./views/camaras/CamarasView";
import ProveedoresView from "./views/proveedores/ProveedoresView";
import ClientesView from "./views/clientes/ClientesView";
import ProductosView from "./views/productos/ProductosView";
import EntradasView from "./views/entradas/EntradasView";
import SalidasView from "./views/salidas/SalidasView";
import MovimientosCamaraView from "./views/movimientos/MovimientosCamaraView";
import ExistenciasView from "./views/existencias/ExistenciasView";
import AlertasCaducidadView from "./views/alertas/AlertasCaducidadView";
import AuditoriaEntradasView from "./views/auditoria/AuditoriaEntradasView";

export const inventarioRoutes = (
    <>
        <Route path="/inventario" element={<Navigate to="/inventario/entradas" replace />} />
        <Route path="/inventario/empresas" element={<EmpresasView />} />
        <Route path="/inventario/camaras" element={<CamarasView />} />
        <Route path="/inventario/proveedores" element={<ProveedoresView />} />
        <Route path="/inventario/clientes" element={<ClientesView />} />
        <Route path="/inventario/productos" element={<ProductosView />} />
        <Route path="/inventario/entradas" element={<EntradasView />} />
        <Route path="/inventario/salidas" element={<SalidasView />} />
        <Route path="/inventario/movimientos-camara" element={<MovimientosCamaraView />} />
        <Route path="/inventario/existencias" element={<ExistenciasView />} />
        <Route path="/inventario/alertas-caducidad" element={<AlertasCaducidadView />} />
        <Route path="/inventario/auditoria-entradas" element={<AuditoriaEntradasView />} />
    </>
);
