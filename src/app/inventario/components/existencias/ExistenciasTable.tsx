import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import { formatearDinero, type FilaExistencia, type TotalesExistencias } from "../../utils/existencias";
import TablaResponsive from "../../../../shared/components/TablaResponsive";
import type { DensidadTabla } from "../../../../shared/hooks/useDensidadTabla";
import { columnasFijas } from "../../../../shared/components/tabla/columnasFijas";
import BadgeCaducidad from "../BadgeCaducidad";

interface ExistenciasTableProps {
    filas: FilaExistencia[];
    totales: TotalesExistencias;
    hayFiltros: boolean;
    densidad: DensidadTabla;
    /** Fila de totales al pie; Movimientos la oculta al mostrar un solo lote. */
    mostrarTotales?: boolean;
    alturaMaxima?: string;
}

// Lo que identifica al lote (dónde está y qué es) se queda fijo al desplazar a
// la derecha para comparar cantidades sin perder de vista de qué fila se trata.
const [FIJA_CAMARA, FIJA_PRODUCTO] = columnasFijas(["9rem", "10rem"]);
const COLUMNAS = 15;

function ExistenciasTable({
    filas, totales, hayFiltros, densidad, mostrarTotales = true, alturaMaxima = "70vh",
}: ExistenciasTableProps) {
    return (
        <TablaResponsive alturaMaxima={alturaMaxima}>
            <table className={`table tabla-datos ${densidad === "compacta" ? "densidad-compacta" : ""}`}>
                <thead>
                    <tr>
                        <th className="fija-izq" style={FIJA_CAMARA}>Cámara</th>
                        <th className="fija-izq fija-izq-borde" style={FIJA_PRODUCTO}>Producto</th>
                        <th>Proveedor</th>
                        <th>Fecha entrada</th>
                        <th>Recibo ingreso</th>
                        <th>Factura</th>
                        <th className="num">Kg/caja</th>
                        <th className="num">Cajas disp.</th>
                        <th className="num">Entrada kg</th>
                        <th className="num">Salida kg</th>
                        <th className="num">Saldo kg</th>
                        <th className="num">Costo/kg</th>
                        <th className="num">Total</th>
                        <th>Caducidad</th>
                        <th>Lote proveedor</th>
                    </tr>
                </thead>
                <tbody>
                    {filas.length === 0 ? (
                        <tr>
                            <td colSpan={COLUMNAS} className="text-center text-body-secondary py-5">
                                <i className="bi bi-box-seam fs-3 d-block mb-2" aria-hidden="true"></i>
                                {hayFiltros ? "Nada coincide con los filtros." : "No hay existencias."}
                            </td>
                        </tr>
                    ) : (
                        filas.map((fila) => (
                            <tr key={fila.detalleId} className="fila-principal">
                                <td className="fija-izq truncar" style={FIJA_CAMARA} title={fila.camaraNombre}>{fila.camaraNombre}</td>
                                <td className="fija-izq fija-izq-borde text-nowrap fw-semibold" style={FIJA_PRODUCTO}>
                                    {fila.talla} {fila.tipo}
                                </td>
                                <td className="truncar" title={fila.proveedorNombre}>{fila.proveedorNombre}</td>
                                <td className="text-nowrap">{formatearFechaNumerica(new Date(fila.fecha + "T00:00:00"))}</td>
                                <td className="text-nowrap">{fila.reciboIngreso}</td>
                                <td className="text-nowrap">{fila.factura}</td>
                                <td className="num">{fila.pesoPorCaja ? formatearDinero(Number(fila.pesoPorCaja)) : "—"}</td>
                                <td className="num fw-semibold">{fila.cajasDisponibles.toLocaleString("es-MX")}</td>
                                <td className="num">{formatearDinero(Number(fila.totalKilos))}</td>
                                <td className="num">{formatearDinero(fila.kilosVendidos)}</td>
                                <td className="num fw-semibold">{formatearDinero(Number(fila.kilosDisponibles))}</td>
                                <td className="num">{fila.costoPorKilo ? `$${formatearDinero(Number(fila.costoPorKilo))}` : "—"}</td>
                                <td className="num">
                                    {fila.totalPesos !== null ? (
                                        `$${formatearDinero(fila.totalPesos)}`
                                    ) : (
                                        <span className="text-body-secondary" title="Lote sin costo capturado: no suma al total">—</span>
                                    )}
                                </td>
                                <td><BadgeCaducidad fechaCaducidad={fila.fechaCaducidad} /></td>
                                <td className="text-nowrap">{fila.loteProveedor}</td>
                            </tr>
                        ))
                    )}
                </tbody>
                {mostrarTotales && filas.length > 0 && (
                    <tfoot>
                        <tr>
                            <td className="fija-izq" style={FIJA_CAMARA}></td>
                            <td className="fija-izq fija-izq-borde fw-bold text-nowrap" style={FIJA_PRODUCTO}>
                                Total ({totales.totalLotes} lotes)
                            </td>
                            <td colSpan={5}></td>
                            <td className="num fw-bold">{totales.totalCajas.toLocaleString("es-MX")}</td>
                            <td colSpan={2}></td>
                            <td className="num fw-bold">{formatearDinero(totales.totalKilosDisponibles)}</td>
                            <td></td>
                            <td className="num fw-bold">${formatearDinero(totales.totalPesos)}</td>
                            <td colSpan={2}></td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </TablaResponsive>
    );
}

export default ExistenciasTable;
