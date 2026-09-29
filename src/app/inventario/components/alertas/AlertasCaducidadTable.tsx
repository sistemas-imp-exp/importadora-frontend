import type { AlertaCaducidadApi } from "../../interfaces/alertas/AlertaCaducidad";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import { CLASE_BADGE_NIVEL, ETIQUETA_NIVEL, RANGO_NIVEL } from "../../utils/caducidad";
import { formatearDinero } from "../../utils/existencias";
import TablaResponsive from "../../../../shared/components/TablaResponsive";

interface AlertasCaducidadTableProps {
    alertas: AlertaCaducidadApi[];
}

function AlertasCaducidadTable({ alertas }: AlertasCaducidadTableProps) {
    return (
        <TablaResponsive alturaMaxima="70vh">
            <table className="table tabla-datos">
                <thead>
                    <tr>
                        <th>Nivel</th>
                        <th>Caducidad</th>
                        <th className="num">Días restantes</th>
                        <th>Producto</th>
                        <th>Cámara</th>
                        <th>Proveedor</th>
                        <th>Lote proveedor</th>
                        <th className="num">Cajas disp.</th>
                        <th className="num">Kilos disp.</th>
                    </tr>
                </thead>
                <tbody>
                    {alertas.length === 0 ? (
                        <tr>
                            <td colSpan={9} className="text-center text-body-secondary py-5">
                                <i className="bi bi-check2-circle fs-3 d-block mb-2" aria-hidden="true"></i>
                                No hay lotes por vencer con los filtros actuales.
                            </td>
                        </tr>
                    ) : (
                        alertas.map((alerta) => (
                            <tr key={alerta.id} className="fila-principal">
                                <td>
                                    <span className={`badge ${CLASE_BADGE_NIVEL[alerta.nivel]}`} title={RANGO_NIVEL[alerta.nivel]}>
                                        {ETIQUETA_NIVEL[alerta.nivel]}
                                    </span>
                                </td>
                                <td className="text-nowrap">{formatearFechaNumerica(new Date(alerta.fecha_caducidad + "T00:00:00"))}</td>
                                <td className="num fw-semibold">
                                    {alerta.dias_restantes < 0
                                        ? `Vencido hace ${Math.abs(alerta.dias_restantes)} día(s)`
                                        : `${alerta.dias_restantes} día(s)`}
                                </td>
                                <td className="text-nowrap fw-semibold">{alerta.talla} {alerta.tipo}</td>
                                <td className="text-nowrap">{alerta.camara ?? "—"}</td>
                                <td className="truncar" title={alerta.proveedor ?? undefined}>{alerta.proveedor ?? "—"}</td>
                                <td className="text-nowrap">{alerta.lote_proveedor}</td>
                                <td className="num fw-semibold">{alerta.cajas_disponibles.toLocaleString("es-MX")}</td>
                                <td className="num">{formatearDinero(Number(alerta.kilos_disponibles))}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </TablaResponsive>
    );
}

export default AlertasCaducidadTable;
