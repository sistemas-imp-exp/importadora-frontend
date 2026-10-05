import type { MovimientoCamaraApi } from "../../interfaces/movimientos/MovimientoCamara";
import type { Camara } from "../../interfaces/camaras/Camara";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import { getFullName } from "../../../../shared/utils/userUtils";
import TablaResponsive from "../../../../shared/components/TablaResponsive";
import BotonAccionFila from "../../../../shared/components/tabla/BotonAccionFila";
import { columnasFijas } from "../../../../shared/components/tabla/columnasFijas";
import BadgeCaducidad from "../BadgeCaducidad";
import { formatearDinero } from "../../utils/existencias";

interface MovimientosCamaraTableProps {
    movimientos: MovimientoCamaraApi[];
    camaras: Camara[];
    /** Recibo en destino; solo con edición en Inventario. */
    onEditarRecibo?: (movimiento: MovimientoCamaraApi) => void;
}

// Fecha y lote quedan fijos al desplazar a la derecha para no perder de vista la fila.
const [FIJA_FECHA, FIJA_LOTE] = columnasFijas(["6.5rem", "14rem"]);

function MovimientosCamaraTable({ movimientos, camaras, onEditarRecibo }: MovimientosCamaraTableProps) {
    const columnas = onEditarRecibo ? 14 : 13;

    function nombreCamara(id: number): string {
        return camaras.find((c) => c.id === id)?.nombre ?? "—";
    }

    return (
        <TablaResponsive alturaMaxima="70vh">
            <table className="table tabla-datos">
                <thead>
                    <tr>
                        <th className="fija-izq" style={FIJA_FECHA}>Fecha</th>
                        <th className="fija-izq fija-izq-borde" style={FIJA_LOTE}>Lote</th>
                        <th>Traslado</th>
                        <th className="num">Cajas</th>
                        <th className="num">Kilos</th>
                        <th>Proveedor</th>
                        <th>Factura</th>
                        <th>Empresa</th>
                        <th>Recibo origen</th>
                        <th>Recibo destino</th>
                        <th className="num" title="Lo que queda hoy en destino de lo que se movió">Queda en destino</th>
                        <th>Caducidad</th>
                        <th>Registró</th>
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
                                <td className="fija-izq text-nowrap" style={FIJA_FECHA}>
                                    {formatearFechaNumerica(new Date(movimiento.fecha + "T00:00:00"))}
                                </td>
                                <td className="fija-izq fija-izq-borde truncar fw-semibold" style={FIJA_LOTE} title={movimiento.lote_origen}>
                                    {movimiento.lote_origen || "—"}
                                </td>
                                <td className="text-nowrap">
                                    {nombreCamara(movimiento.camara_origen)}
                                    <i className="bi bi-arrow-right mx-2 text-body-secondary" aria-label="hacia"></i>
                                    <span className="fw-semibold">{nombreCamara(movimiento.camara_destino)}</span>
                                </td>
                                <td className="num">{movimiento.cajas.toLocaleString("es-MX")}</td>
                                <td className="num">{formatearDinero(Number(movimiento.kilos))}</td>
                                <td className="truncar" title={movimiento.proveedor}>{movimiento.proveedor}</td>
                                <td className="text-nowrap">{movimiento.factura || "—"}</td>
                                <td className="text-nowrap">{movimiento.empresa}</td>
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
                                <td className="num text-nowrap">
                                    <span className="fw-semibold">{movimiento.cajas_disponibles_destino.toLocaleString("es-MX")}</span> cajas
                                    <div className="small text-body-secondary">
                                        {formatearDinero(Number(movimiento.kilos_disponibles_destino))} kg
                                    </div>
                                </td>
                                <td><BadgeCaducidad fechaCaducidad={movimiento.fecha_caducidad} /></td>
                                <td className="text-nowrap small">{movimiento.creado_por ? getFullName(movimiento.creado_por) : "—"}</td>
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
