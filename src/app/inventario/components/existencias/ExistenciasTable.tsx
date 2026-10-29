import type { CSSProperties } from "react";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import {
    formatearDinero, formatearPeso, type ColumnaExistencias, type FilaExistencia, type TotalesExistencias,
} from "../../utils/existencias";
import TablaResponsive from "../../../../shared/components/TablaResponsive";
import type { DensidadTabla } from "../../../../shared/hooks/useDensidadTabla";
import type { OrdenTabla } from "../../../../shared/hooks/useOrdenTabla";
import { columnasFijas } from "../../../../shared/components/tabla/columnasFijas";
import EncabezadoOrdenable from "../../../../shared/components/tabla/EncabezadoOrdenable";
import BadgeCaducidad from "../BadgeCaducidad";
import { formatearKg, formatearPrecioKg } from "../../../../shared/utils/numeros";

interface ExistenciasTableProps {
    filas: FilaExistencia[];
    totales: TotalesExistencias;
    hayFiltros: boolean;
    densidad: DensidadTabla;
    /** Fila de totales al pie; Movimientos la oculta al mostrar un solo lote. */
    mostrarTotales?: boolean;
    alturaMaxima?: string;
    /** Con ambos, los encabezados ordenan; las filas deben llegar ya ordenadas. */
    orden?: OrdenTabla<ColumnaExistencias> | null;
    onOrdenar?: (columna: ColumnaExistencias) => void;
}

// Lo que identifica al lote (dónde está y qué es) se queda fijo al desplazar a
// la derecha para comparar cantidades sin perder de vista de qué fila se trata.
const ANCHOS_FIJOS = ["10.5rem", "14rem"];
const [FIJA_CAMARA, FIJA_PRODUCTO] = columnasFijas(ANCHOS_FIJOS);
// Celda del renglón de grupos que queda sobre las dos columnas fijas.
const FIJA_GRUPO = columnasFijas([`calc(${ANCHOS_FIJOS.join(" + ")})`])[0];
const COLUMNAS = 15;

function ExistenciasTable({
    filas, totales, hayFiltros, densidad, mostrarTotales = true, alturaMaxima = "70vh", orden, onOrdenar,
}: ExistenciasTableProps) {
    const encabezado = (columna: ColumnaExistencias, texto: string, className?: string, style?: CSSProperties) => (
        <EncabezadoOrdenable columna={columna} orden={orden} onOrdenar={onOrdenar} className={className} style={style}>
            {texto}
        </EncabezadoOrdenable>
    );

    return (
        <TablaResponsive alturaMaxima={alturaMaxima}>
            <table className={`table tabla-datos tabla-con-grupos ${densidad === "compacta" ? "densidad-compacta" : ""}`}>
                <thead>
                    <tr className="encabezado-grupos">
                        <th colSpan={2} className="fija-izq fija-izq-borde" style={FIJA_GRUPO}></th>
                        <th colSpan={4} className="inicio-grupo">Ingreso</th>
                        <th colSpan={5} className="inicio-grupo">Existencia</th>
                        <th colSpan={2} className="inicio-grupo">Valor</th>
                        <th colSpan={2} className="inicio-grupo">Lote</th>
                    </tr>
                    <tr>
                        {encabezado("camara", "Cámara", "fija-izq", FIJA_CAMARA)}
                        {encabezado("producto", "Producto", "fija-izq fija-izq-borde", FIJA_PRODUCTO)}
                        {encabezado("proveedor", "Proveedor", "inicio-grupo")}
                        {encabezado("fecha", "Fecha entrada")}
                        {encabezado("recibo", "Recibo ingreso")}
                        {encabezado("factura", "Factura")}
                        {encabezado("pesoPorCaja", "Kg/caja", "num inicio-grupo")}
                        {encabezado("cajas", "Cajas disp.", "num")}
                        {encabezado("entrada", "Entrada kg", "num")}
                        {encabezado("salida", "Salida kg", "num")}
                        {encabezado("saldo", "Saldo kg", "num")}
                        {encabezado("costo", "Costo/kg", "num inicio-grupo")}
                        {encabezado("total", "Total", "num")}
                        {encabezado("caducidad", "Caducidad", "inicio-grupo")}
                        {encabezado("loteProveedor", "Lote proveedor")}
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
                                <td className="fija-izq fija-izq-borde celda-producto" style={FIJA_PRODUCTO} title={`${fila.talla} ${fila.tipo}`}>
                                    <div className="truncar fw-semibold">{fila.talla}</div>
                                    <div className="truncar small text-body-secondary">{fila.tipo}</div>
                                </td>
                                <td className="truncar inicio-grupo" title={fila.proveedorNombre}>{fila.proveedorNombre}</td>
                                <td className="text-nowrap">{formatearFechaNumerica(new Date(fila.fecha + "T00:00:00"))}</td>
                                <td className="text-nowrap">{fila.reciboIngreso}</td>
                                <td className="text-nowrap">{fila.factura}</td>
                                <td className="num inicio-grupo">{fila.pesoPorCaja ? formatearPeso(Number(fila.pesoPorCaja)) : "—"}</td>
                                <td className="num fw-semibold">{fila.cajasDisponibles.toLocaleString("es-MX")}</td>
                                <td className="num">{formatearKg(fila.totalKilos)}</td>
                                <td className="num">
                                    {fila.kilosVendidos ? (
                                        formatearKg(fila.kilosVendidos)
                                    ) : (
                                        <span className="text-body-tertiary" title="Sin salidas">—</span>
                                    )}
                                </td>
                                <td className="num fw-semibold">{formatearKg(fila.kilosDisponibles)}</td>
                                <td className="num inicio-grupo">{fila.costoPorKilo ? formatearPrecioKg(fila.costoPorKilo) : "—"}</td>
                                <td className="num">
                                    {fila.totalPesos !== null ? (
                                        `$${formatearDinero(fila.totalPesos)}`
                                    ) : (
                                        <span className="text-body-secondary" title="Lote sin costo capturado: no suma al total">—</span>
                                    )}
                                </td>
                                <td className="inicio-grupo"><BadgeCaducidad fechaCaducidad={fila.fechaCaducidad} /></td>
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
                            <td colSpan={4} className="inicio-grupo"></td>
                            <td className="inicio-grupo"></td>
                            <td className="num fw-bold">{totales.totalCajas.toLocaleString("es-MX")}</td>
                            <td colSpan={2}></td>
                            <td className="num fw-bold">{formatearKg(totales.totalKilosDisponibles)}</td>
                            <td className="inicio-grupo"></td>
                            <td className="num fw-bold">${formatearDinero(totales.totalPesos)}</td>
                            <td colSpan={2} className="inicio-grupo"></td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </TablaResponsive>
    );
}

export default ExistenciasTable;
