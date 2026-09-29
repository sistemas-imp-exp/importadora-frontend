import type { MovimientoCamaraApi } from "../../interfaces/movimientos/MovimientoCamara";
import type { Camara } from "../../interfaces/camaras/Camara";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import TablaResponsive from "../../../../shared/components/TablaResponsive";

interface MovimientosCamaraTableProps {
    movimientos: MovimientoCamaraApi[];
    camaras: Camara[];
}

function MovimientosCamaraTable({ movimientos, camaras }: MovimientosCamaraTableProps) {
    function nombreCamara(id: number): string {
        return camaras.find((c) => c.id === id)?.nombre ?? "—";
    }

    return (
        <TablaResponsive alturaMaxima="70vh">
            <table className="table tabla-datos">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Lote</th>
                        <th>Traslado</th>
                        <th className="num">Cajas</th>
                    </tr>
                </thead>
                <tbody>
                    {movimientos.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="text-center text-body-secondary py-5">
                                No hay movimientos registrados.
                            </td>
                        </tr>
                    ) : (
                        movimientos.map((movimiento) => (
                            <tr key={movimiento.id} className="fila-principal">
                                <td className="text-nowrap">{formatearFechaNumerica(new Date(movimiento.fecha + "T00:00:00"))}</td>
                                <td className="text-nowrap">{movimiento.lote_origen || "—"}</td>
                                <td className="text-nowrap">
                                    {nombreCamara(movimiento.camara_origen)}
                                    <i className="bi bi-arrow-right mx-2 text-body-secondary" aria-label="hacia"></i>
                                    <span className="fw-semibold">{nombreCamara(movimiento.camara_destino)}</span>
                                </td>
                                <td className="num">{movimiento.cajas.toLocaleString("es-MX")}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </TablaResponsive>
    );
}

export default MovimientosCamaraTable;
