import { Fragment } from "react";
import TablaResponsive from "../../../shared/components/TablaResponsive";
import type { EstadoVenta, RenglonEstadoCuenta } from "../interfaces/Cartera";
import { claseSaldo, dinero, fecha } from "../utils/cartera";
import { formatearKg, formatearPrecioKg } from "../../../shared/utils/numeros";

interface Props {
    renglones: RenglonEstadoCuenta[];
    /** Sin filtro de empresa, cada renglón dice de qué empresa es. */
    mostrarEmpresa: boolean;
}

const VERIFICACION: Record<EstadoVenta, { icono: string; clase: string; texto: string }> = {
    verificada: { icono: "bi-check-circle-fill", clase: "text-success", texto: "Verificada contra la nota" },
    pendiente: { icono: "bi-hourglass-split", clase: "text-warning", texto: "Pendiente de verificar" },
    diferencia: { icono: "bi-exclamation-triangle-fill", clase: "text-danger", texto: "Con diferencia reportada a Inventario" },
    sin_precio: { icono: "bi-question-circle-fill", clase: "text-secondary", texto: "Sin precio: Inventario debe capturarlo" },
};

/**
 * Estado de cuenta con el formato del área (hoja de Cabeza de Toro): una fila
 * por producto vendido con su parcial y la venta neta en la última de la
 * salida; pagos y abonos en Depósito. Lo más reciente arriba.
 */
function EstadoCuentaTabla({ renglones, mostrarEmpresa }: Props) {
    const activos = renglones.filter((r) => !r.cancelado);
    // Los totales son de los movimientos; el saldo inicial solo arranca el saldo corrido.
    const movimientos = activos.filter((r) => r.tipo !== "inicial");
    const totalVenta = movimientos.reduce((acc, r) => acc + Number(r.cargo), 0);
    const totalDeposito = movimientos.reduce((acc, r) => acc + Number(r.abono), 0);
    const saldoFinal = [...activos].reverse().find((r) => r.saldo !== null)?.saldo ?? "0";

    return (
        <TablaResponsive alturaMaxima="70vh">
            <table className="table tabla-datos densidad-compacta mb-0">
                <thead>
                    <tr>
                        <th>Nota</th>
                        <th>Folio salida</th>
                        <th>Concepto</th>
                        <th>Fecha</th>
                        <th>Talla</th>
                        <th className="num">Kilos</th>
                        <th className="num">Precio</th>
                        <th className="num">Parcial</th>
                        <th className="num">Venta neta</th>
                        <th className="num">Depósito</th>
                        <th className="num">Saldo</th>
                    </tr>
                </thead>
                <tbody>
                    {renglones.length === 0 && (
                        <tr><td colSpan={11} className="text-center text-body-secondary py-4">Sin movimientos.</td></tr>
                    )}
                    {[...renglones].reverse().map((r, i) => {
                        const tachado = r.cancelado ? "text-decoration-line-through text-body-secondary" : "";
                        const empresa = mostrarEmpresa && <div className="small text-body-secondary">{r.empresa}</div>;
                        const saldo = r.saldo === null
                            ? <span className="text-body-secondary" title="Cancelado: no mueve el saldo">—</span>
                            : <span className={claseSaldo(r.saldo)}>{dinero(r.saldo)}</span>;

                        if (r.tipo === "venta" && r.detalle.length > 0) {
                            return (
                                <Fragment key={`venta-${r.id}-${i}`}>
                                    {r.detalle.map((d, j) => {
                                        const primera = j === 0;
                                        const ultima = j === r.detalle.length - 1;
                                        const verificacion = VERIFICACION[d.estado];
                                        return (
                                            <tr key={d.linea_id} className={primera ? "border-top border-secondary-subtle" : undefined}>
                                                <td className={`text-nowrap fw-semibold ${tachado}`}>{primera ? d.nota || "—" : ""}</td>
                                                <td className={`text-nowrap ${tachado}`}>{primera ? d.folio_salida : ""}</td>
                                                <td className={`small ${tachado}`}>
                                                    {d.origen || "—"}
                                                    {primera && empresa}
                                                </td>
                                                <td className={`text-nowrap ${tachado}`}>{primera ? fecha(r.fecha) : ""}</td>
                                                <td className={`text-nowrap ${tachado}`}>
                                                    <i className={`bi ${verificacion.icono} ${verificacion.clase} me-1`} title={verificacion.texto} aria-label={verificacion.texto}></i>
                                                    {d.producto}
                                                </td>
                                                <td className={`num ${tachado}`}>{formatearKg(d.kilos)}</td>
                                                <td className={`num ${tachado}`}>{d.precio_kilo !== null ? formatearPrecioKg(d.precio_kilo) : "—"}</td>
                                                <td className={`num ${tachado}`}>
                                                    {d.importe !== null ? dinero(d.importe) : <span className="badge text-bg-light border">Sin precio</span>}
                                                </td>
                                                <td className={`num fw-semibold ${tachado}`}>{ultima ? dinero(r.cargo) : ""}</td>
                                                <td className="num"></td>
                                                <td className="num fw-semibold">{ultima ? saldo : ""}</td>
                                            </tr>
                                        );
                                    })}
                                </Fragment>
                            );
                        }

                        const deposito = Number(r.abono) > 0;
                        return (
                            <tr key={`${r.tipo}-${r.id ?? i}-${i}`} className="border-top border-secondary-subtle">
                                <td></td>
                                <td></td>
                                <td className={tachado}>
                                    <span className={r.tipo === "inicial" ? "fw-semibold" : undefined}>{r.concepto}</span>
                                    {r.referencia && <span className="small text-body-secondary"> · {r.referencia}</span>}
                                    {r.cancelado && (
                                        <span className="badge border bg-secondary-subtle text-secondary-emphasis border-secondary-subtle ms-1" title={r.motivo_cancelacion}>
                                            Cancelado
                                        </span>
                                    )}
                                    {empresa}
                                </td>
                                <td className={`text-nowrap ${tachado}`}>{fecha(r.fecha)}</td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td className={`num ${tachado}`}>{!deposito && Number(r.cargo) > 0 && r.tipo !== "inicial" ? dinero(r.cargo) : ""}</td>
                                <td className={`num ${tachado}`}>{deposito && r.tipo !== "inicial" ? dinero(r.abono) : ""}</td>
                                <td className="num fw-semibold">{saldo}</td>
                            </tr>
                        );
                    })}
                </tbody>
                {renglones.length > 0 && (
                    <tfoot>
                        <tr>
                            <td colSpan={8} className="fw-bold">Totales</td>
                            <td className="num fw-bold">{dinero(totalVenta)}</td>
                            <td className="num fw-bold">{dinero(totalDeposito)}</td>
                            <td className={`num fw-bold ${claseSaldo(saldoFinal)}`}>{dinero(saldoFinal)}</td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </TablaResponsive>
    );
}

export default EstadoCuentaTabla;
