import { Fragment } from "react";
import TablaResponsive from "../../../shared/components/TablaResponsive";
import { formatearFechaNumerica } from "../../../shared/utils/fechas";
import { formatearKg, formatearPrecioKg } from "../../../shared/utils/numeros";
import type { ResumenResguardos } from "../interfaces/ResumenResguardos";

function dinero(valor: string): string {
    return `$${Number(valor).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Igual que la hoja RESUMEN RESG. del control del área: un bloque por
 * cliente (RESGUARDO <cliente>) con fecha, nota, talla, proveedor, kilos por
 * entregar, precio, total y observación, y el total del cliente al pie.
 */
function ResumenResguardosTabla({ resumen }: { resumen: ResumenResguardos }) {
    if (resumen.clientes.length === 0) {
        return (
            <p className="text-center text-body-secondary py-5 mb-0">
                <i className="bi bi-safe fs-3 d-block mb-2" aria-hidden="true"></i>
                No hay resguardos por entregar.
            </p>
        );
    }
    return (
        <TablaResponsive alturaMaxima="70vh">
            <table className="table tabla-datos tabla-hoja mb-0">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Nota</th>
                        <th>Talla</th>
                        <th>Proveedor</th>
                        <th className="num">Kilos</th>
                        <th className="num">Precio</th>
                        <th className="num">Total</th>
                        <th>Observación</th>
                    </tr>
                </thead>
                {resumen.clientes.map((c) => (
                    <Fragment key={c.cliente.id}>
                        <tbody className="grupo-documento">
                            <tr className="fila-bloque">
                                <td colSpan={8} className="fw-bold">RESGUARDO {c.cliente.nombre}</td>
                            </tr>
                            {c.filas.map((f) => (
                                <tr key={f.linea_id}>
                                    <td className="text-nowrap">{formatearFechaNumerica(new Date(f.fecha + "T12:00:00"))}</td>
                                    <td className="text-nowrap fw-semibold">{f.nota || (f.folio_de_salida ? `Salida ${f.folio_de_salida}` : "—")}</td>
                                    <td className="text-nowrap">{f.talla}</td>
                                    <td>{f.proveedor || <span className="text-body-secondary">—</span>}</td>
                                    <td className="num">{formatearKg(f.kilos)}</td>
                                    <td className="num">
                                        {f.precio !== null ? formatearPrecioKg(f.precio) : (
                                            <span className="badge border bg-warning-subtle text-warning-emphasis border-warning-subtle fw-normal">Sin precio</span>
                                        )}
                                    </td>
                                    <td className="num">{f.total !== null ? dinero(f.total) : ""}</td>
                                    <td className="small">{f.observacion}</td>
                                </tr>
                            ))}
                            <tr className="fw-bold">
                                <td colSpan={4} className="text-end">TOTAL</td>
                                <td className="num">{formatearKg(c.kilos)}</td>
                                <td></td>
                                <td className="num">{dinero(c.total)}</td>
                                <td className="small fw-normal text-body-secondary">
                                    {c.sin_precio > 0 && `${c.sin_precio} línea(s) sin precio no suman`}
                                </td>
                            </tr>
                        </tbody>
                    </Fragment>
                ))}
                <tfoot>
                    <tr>
                        <td colSpan={4} className="text-end">Total general</td>
                        <td className="num">{formatearKg(resumen.kilos)}</td>
                        <td></td>
                        <td className="num">{dinero(resumen.total)}</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        </TablaResponsive>
    );
}

export default ResumenResguardosTabla;
