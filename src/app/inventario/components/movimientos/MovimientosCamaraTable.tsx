import type { MovimientoCamaraApi } from "../../interfaces/movimientos/MovimientoCamara";
import type { Camara } from "../../interfaces/camaras/Camara";

interface MovimientosCamaraTableProps {
    movimientos: MovimientoCamaraApi[];
    camaras: Camara[];
}

function MovimientosCamaraTable({ movimientos, camaras }: MovimientosCamaraTableProps) {
    function nombreCamara(id: number): string {
        return camaras.find((c) => c.id === id)?.nombre ?? "—";
    }

    return (
        <div className="table-responsive">
            <table className="table table-striped table-sm mb-0">
                <thead>
                    <tr>
                        <th className="text-wrap">Fecha</th>
                        <th className="text-wrap">Lote</th>
                        <th className="text-wrap">Cámara origen</th>
                        <th className="text-wrap">Cámara destino</th>
                        <th className="text-wrap text-end">Cajas</th>
                    </tr>
                </thead>
                <tbody>
                    {movimientos.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="text-center text-muted py-4">
                                No hay movimientos registrados.
                            </td>
                        </tr>
                    ) : (
                        movimientos.map((movimiento) => (
                            <tr key={movimiento.id}>
                                <td className="text-wrap">{movimiento.fecha}</td>
                                <td className="text-wrap">{movimiento.lote_origen || "—"}</td>
                                <td className="text-wrap">{nombreCamara(movimiento.camara_origen)}</td>
                                <td className="text-wrap">{nombreCamara(movimiento.camara_destino)}</td>
                                <td className="text-end">{movimiento.cajas}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default MovimientosCamaraTable;
