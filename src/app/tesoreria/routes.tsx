import { Navigate, Route } from "react-router-dom";
import DashboardView from "./views/dashboard/DashboardView";
import MovimientosView from "./views/caja/MovimientosView";
import CajaDiariaView from "./views/caja/CajaDiariaView";
import SaldosInicialesView from "./views/caja/SaldosInicialesView";
import ArqueoCajaView from "./views/arqueo/ArqueoCajaView";
import DivisasView from "./views/divisas/DivisasView";
import DivisaDetalleView from "./views/divisas/DivisaDetalleView";
import MovimientoDetalleView from "./views/caja/MovimientoDetalleView";
import ReporteMovimientosView from "./views/reportes/ReporteMovimientosView";
import RanchosView from "./views/nomina/RanchosView";
import PuestosView from "./views/nomina/PuestosView";
import BancosView from "./views/nomina/BancosView";
import EmpleadosView from "./views/nomina/EmpleadosView";
import NominaSemanalListView from "./views/nomina/NominaSemanalListView";
import NominaSemanalDetalleView from "./views/nomina/NominaSemanalDetalleView";
import ReporteNominaView from "./views/nomina/ReporteNominaView";

export const tesoreriaRoutes = (
    <>
        <Route
            path="/tesoreria"
            element={
                <DashboardView />
            }
        />
        <Route
            path="/tesoreria/divisas"
            element={
                <DivisasView />
            }
        />
        <Route path="/tesoreria/divisas/:id" element={<DivisaDetalleView />} />
        <Route path="/tesoreria/caja/diaria" element={<CajaDiariaView />} />
        <Route path="/tesoreria/caja/saldos-iniciales" element={<SaldosInicialesView />} />
        {/* Enlaces guardados de la pantalla anterior de corte de caja. */}
        <Route path="/tesoreria/caja/corte/*" element={<Navigate to="/tesoreria/caja/diaria" replace />} />

        <Route
            path="/tesoreria/caja/movimientos"
            element={<MovimientosView />}
        />
        <Route path="/tesoreria/caja/movimientos/:id" element={<MovimientoDetalleView />} />

        <Route
            path="/tesoreria/caja/arqueo"
            element={<ArqueoCajaView />}
        />

        <Route
            path="/tesoreria/caja/reportes"
            element={<ReporteMovimientosView />}
        />

        <Route path="/tesoreria/nomina/ranchos" element={<RanchosView />} />
        <Route path="/tesoreria/nomina/puestos" element={<PuestosView />} />
        <Route path="/tesoreria/nomina/bancos" element={<BancosView />} />
        <Route path="/tesoreria/nomina/empleados" element={<EmpleadosView />} />
        <Route path="/tesoreria/nomina/semanal" element={<NominaSemanalListView />} />
        <Route path="/tesoreria/nomina/semanal/:id" element={<NominaSemanalDetalleView />} />
        <Route path="/tesoreria/nomina/reportes" element={<ReporteNominaView />} />
    </>
);