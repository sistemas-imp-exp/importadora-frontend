import { Navigate, Route } from "react-router-dom";
import AnimalesView from "./views/AnimalesView";
import AnimalDetalleView from "./views/AnimalDetalleView";
import MovimientosView from "./views/MovimientosView";
import CatalogosView from "./views/CatalogosView";
import ReporteInventarioView from "./views/ReporteInventarioView";
import ReporteMovimientosView from "./views/ReporteMovimientosView";

export const ganadoRoutes = (
    <>
        <Route path="/ganado" element={<Navigate to="/ganado/animales" replace />} />
        <Route path="/ganado/animales" element={<AnimalesView />} />
        <Route path="/ganado/animales/:id" element={<AnimalDetalleView />} />
        <Route path="/ganado/movimientos" element={<MovimientosView />} />
        <Route path="/ganado/catalogos" element={<CatalogosView />} />
        <Route path="/ganado/reportes" element={<Navigate to="/ganado/reportes/inventario" replace />} />
        <Route path="/ganado/reportes/inventario" element={<ReporteInventarioView />} />
        <Route path="/ganado/reportes/movimientos" element={<ReporteMovimientosView />} />
    </>
);
