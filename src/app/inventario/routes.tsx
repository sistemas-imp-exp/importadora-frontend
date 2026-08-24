import { Route } from "react-router-dom";
import EmpresasView from "./views/empresas/EmpresasView";
import CamarasView from "./views/camaras/CamarasView";
import ProveedoresView from "./views/proveedores/ProveedoresView";
import ClientesView from "./views/clientes/ClientesView";
import ProductosView from "./views/productos/ProductosView";
import EntradasView from "./views/entradas/EntradasView";
import SalidasView from "./views/salidas/SalidasView";

export const inventarioRoutes = (
    <>
        <Route path="/inventario/empresas" element={<EmpresasView />} />
        <Route path="/inventario/camaras" element={<CamarasView />} />
        <Route path="/inventario/proveedores" element={<ProveedoresView />} />
        <Route path="/inventario/clientes" element={<ClientesView />} />
        <Route path="/inventario/productos" element={<ProductosView />} />
        <Route path="/inventario/entradas" element={<EntradasView />} />
        <Route path="/inventario/salidas" element={<SalidasView />} />
    </>
);
