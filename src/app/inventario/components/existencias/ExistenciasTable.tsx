import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import { CLASE_FILA_NIVEL, ETIQUETA_NIVEL } from "../../utils/caducidad";
import { formatearDinero, type FilaExistencia, type TotalesExistencias } from "../../utils/existencias";

interface ExistenciasTableProps {
    filas: FilaExistencia[];
    totales: TotalesExistencias;
    hayFiltros: boolean;
}

function ExistenciasTable({ filas, totales, hayFiltros }: ExistenciasTableProps) {
    return (
        <div className="table-responsive">
            <table className="table table-striped table-sm mb-0">
                <thead>
                    <tr>
                        <th className="text-wrap">Fecha</th>
                        <th className="text-wrap">Cámara</th>
                        <th className="text-wrap">Proveedor</th>
                        <th className="text-wrap">Talla</th>
                        <th className="text-wrap">Tipo</th>
                        <th className="text-wrap">Lote proveedor</th>
                        <th className="text-wrap">Recibo ingreso</th>
                        <th className="text-wrap">Factura</th>
                        <th className="text-wrap text-end">Peso/caja</th>
                        <th className="text-wrap text-end">Cajas disponibles</th>
                        <th className="text-wrap text-end">Entrada (kg)</th>
                        <th className="text-wrap text-end">Salida (kg)</th>
                        <th className="text-wrap text-end">Saldo (kg)</th>
                        <th className="text-wrap text-end">Costo/kg</th>
                        <th className="text-wrap text-end">Total</th>
                        <th className="text-wrap">Caducidad</th>
                    </tr>
                </thead>
                <tbody>
                    {filas.length === 0 ? (
                        <tr>
                            <td colSpan={16} className="text-center text-muted py-4">
                                {hayFiltros ? "Nada coincide con los filtros." : "No hay existencias."}
                            </td>
                        </tr>
                    ) : (
                        filas.map((fila) => (
                            <tr key={fila.detalleId} className={fila.nivel ? CLASE_FILA_NIVEL[fila.nivel] : undefined}>
                                <td className="text-wrap">{formatearFechaNumerica(new Date(fila.fecha + "T00:00:00"))}</td>
                                <td className="text-wrap">{fila.camaraNombre}</td>
                                <td className="text-wrap">{fila.proveedorNombre}</td>
                                <td className="text-wrap">{fila.talla}</td>
                                <td className="text-wrap">{fila.tipo}</td>
                                <td className="text-wrap">{fila.loteProveedor}</td>
                                <td className="text-wrap">{fila.reciboIngreso}</td>
                                <td className="text-wrap">{fila.factura}</td>
                                <td className="text-end">{fila.pesoPorCaja ?? "—"}</td>
                                <td className="text-end fw-bold">{fila.cajasDisponibles}</td>
                                <td className="text-end">{fila.totalKilos}</td>
                                <td className="text-end">{formatearDinero(fila.kilosVendidos)}</td>
                                <td className="text-end fw-bold">{fila.kilosDisponibles}</td>
                                <td className="text-end">{fila.costoPorKilo ?? "—"}</td>
                                <td className="text-end">{fila.totalPesos !== null ? `$${formatearDinero(fila.totalPesos)}` : "—"}</td>
                                <td className="text-wrap">
                                    {fila.fechaCaducidad ? (
                                        <>
                                            {formatearFechaNumerica(new Date(fila.fechaCaducidad + "T00:00:00"))}
                                            {fila.nivel && (
                                                <span className="badge text-bg-light border ms-1">{ETIQUETA_NIVEL[fila.nivel]}</span>
                                            )}
                                        </>
                                    ) : (
                                        "—"
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
                {filas.length > 0 && (
                    <tfoot>
                        <tr>
                            <td colSpan={9} className="text-end fw-bold">Total ({totales.totalLotes} lotes):</td>
                            <td className="text-end fw-bold">{totales.totalCajas} cajas</td>
                            <td colSpan={2}></td>
                            <td className="text-end fw-bold">{formatearDinero(totales.totalKilosDisponibles)} kg</td>
                            <td></td>
                            <td className="text-end fw-bold">${formatearDinero(totales.totalPesos)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
}

export default ExistenciasTable;
