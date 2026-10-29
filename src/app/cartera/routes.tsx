import { Navigate, Route } from "react-router-dom";
import InicioCarteraView from "./views/InicioCarteraView";
import ClientesCarteraView from "./views/ClientesCarteraView";
import ClienteCarteraDetalleView from "./views/ClienteCarteraDetalleView";
import PagosView from "./views/PagosView";
import AjustesView from "./views/AjustesView";
import ReporteSaldosView from "./views/ReporteSaldosView";
import ResguardosView from "../resguardos/views/ResguardosView";

export const carteraRoutes = (
    <>
        <Route path="/cartera" element={<InicioCarteraView />} />
        <Route path="/cartera/clientes" element={<ClientesCarteraView />} />
        <Route path="/cartera/clientes/:id" element={<ClienteCarteraDetalleView />} />
        <Route path="/cartera/pagos" element={<PagosView />} />
        <Route path="/cartera/ajustes" element={<AjustesView />} />
        <Route path="/cartera/resguardos" element={<ResguardosView area="CAR" />} />
        <Route path="/cartera/reportes" element={<Navigate to="/cartera/reportes/saldos" replace />} />
        <Route path="/cartera/reportes/saldos" element={<ReporteSaldosView />} />
    </>
);
