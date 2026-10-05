import type { MovimientoCamaraApi } from "../../interfaces/movimientos/MovimientoCamara";
import type { Camara } from "../../interfaces/camaras/Camara";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import TablaResponsive from "../../../../shared/components/TablaResponsive";
import BotonAccionFila from "../../../../shared/components/tabla/BotonAccionFila";

interface MovimientosCamaraTableProps {
    movimientos: MovimientoCamaraApi[];
    camaras: Camara[];
    /** Recibo en destino; solo con edición en Inventario. */
    onEditarRecibo?: (movimiento: MovimientoCamaraApi) => void;
}

function MovimientosCamaraTable({ movimientos, camaras, onEditarRecibo }: MovimientosCamaraTableProps) {
    const columnas = onEditarRecibo ? 7 : 6;

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
                        <th>Recibo origen</th>
                        <th>Recibo destino</th>
                        {onEditarRecibo && <th className="fija-der text-end">Acciones</th>}
                    </tr>
                </thead>
                <tbody>
                    {movimientos.length === 0 ? (
                        <tr>
                            <td colSpan={columnas} className="text-center text-body-secondary py-5">
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
                                <td className="text-nowrap">{movimiento.recibo_origen || "—"}</td>
                                <td className="text-nowrap">
                                    {movimiento.recibo_destino_propio ? (
                                        <span className="fw-semibold">{movimiento.recibo_destino}</span>
                                    ) : (
                                        <span
                                            className="badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle"
                                            title="Aún sin recibo propio en destino: se muestra el de origen"
                                        >
                                            Heredado{movimiento.recibo_destino ? ` · ${movimiento.recibo_destino}` : ""}
                                        </span>
                                    )}
                                </td>
                                {onEditarRecibo && (
                                    <td className="fija-der text-end">
                                        <BotonAccionFila
                                            icono="bi-receipt"
                                            etiqueta={`Editar recibo en destino del movimiento ${movimiento.id}`}
                                            onClick={() => onEditarRecibo(movimiento)}
                                        />
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </TablaResponsive>
    );
}

export default MovimientosCamaraTable;
