import type { AlertaCaducidadApi } from "../../interfaces/alertas/AlertaCaducidad";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import { CLASE_BADGE_NIVEL, CLASE_FILA_NIVEL, ETIQUETA_NIVEL } from "../../utils/caducidad";

interface AlertasCaducidadTableProps {
    alertas: AlertaCaducidadApi[];
}

function AlertasCaducidadTable({ alertas }: AlertasCaducidadTableProps) {
    return (
        <div className="table-responsive">
            <table className="table table-striped table-sm mb-0">
                <thead>
                    <tr>
                        <th className="text-wrap">Nivel</th>
                        <th className="text-wrap">Caducidad</th>
                        <th className="text-wrap text-end">Días restantes</th>
                        <th className="text-wrap">Cámara</th>
                        <th className="text-wrap">Proveedor</th>
                        <th className="text-wrap">Talla</th>
                        <th className="text-wrap">Tipo</th>
                        <th className="text-wrap">Lote proveedor</th>
                        <th className="text-wrap text-end">Cajas disponibles</th>
                        <th className="text-wrap text-end">Kilos disponibles</th>
                    </tr>
                </thead>
                <tbody>
                    {alertas.length === 0 ? (
                        <tr>
                            <td colSpan={10} className="text-center text-muted py-4">
                                No hay lotes por vencer con los filtros actuales.
                            </td>
                        </tr>
                    ) : (
                        alertas.map((alerta) => (
                            <tr key={alerta.id} className={CLASE_FILA_NIVEL[alerta.nivel]}>
                                <td>
                                    <span className={`badge ${CLASE_BADGE_NIVEL[alerta.nivel]}`}>
                                        {ETIQUETA_NIVEL[alerta.nivel]}
                                    </span>
                                </td>
                                <td className="text-wrap">{formatearFechaNumerica(new Date(alerta.fecha_caducidad + "T00:00:00"))}</td>
                                <td className="text-end fw-bold">
                                    {alerta.dias_restantes < 0
                                        ? `Vencido hace ${Math.abs(alerta.dias_restantes)} día(s)`
                                        : `${alerta.dias_restantes} día(s)`}
                                </td>
                                <td className="text-wrap">{alerta.camara ?? "—"}</td>
                                <td className="text-wrap">{alerta.proveedor ?? "—"}</td>
                                <td className="text-wrap">{alerta.talla}</td>
                                <td className="text-wrap">{alerta.tipo}</td>
                                <td className="text-wrap">{alerta.lote_proveedor}</td>
                                <td className="text-end fw-bold">{alerta.cajas_disponibles}</td>
                                <td className="text-end">{alerta.kilos_disponibles}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default AlertasCaducidadTable;
