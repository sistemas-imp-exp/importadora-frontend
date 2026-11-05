import { Fragment } from "react";
import TablaResponsive from "../../../shared/components/TablaResponsive";
import BotonExpandir from "../../../shared/components/tabla/BotonExpandir";
import { useFilasExpandibles } from "../../../shared/components/tabla/useFilasExpandibles";
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

/** Pagos seguidos del mismo día y empresa: una fila con el total que se despliega. */
interface GrupoPagos {
    id: number;
    fecha: string;
    empresa: string;
    pagos: RenglonEstadoCuenta[];
}

type Elemento = { renglon: RenglonEstadoCuenta } | { grupo: GrupoPagos };

/** Renglones de lo más reciente a lo más antiguo, con los pagos de un mismo día juntos. */
function agrupar(renglones: RenglonEstadoCuenta[]): Elemento[] {
    const elementos: Elemento[] = [];
    let actual: GrupoPagos | null = null;
    const cerrar = (grupo: GrupoPagos) =>
        elementos.push(grupo.pagos.length > 1 ? { grupo } : { renglon: grupo.pagos[0] });
    for (const r of [...renglones].reverse()) {
        if (r.tipo === "pago" && actual && actual.fecha === r.fecha && actual.empresa === r.empresa) {
            actual.pagos.push(r);
            continue;
        }
        if (actual) cerrar(actual);
        actual = null;
        if (r.tipo === "pago") actual = { id: r.id ?? -elementos.length, fecha: r.fecha, empresa: r.empresa, pagos: [r] };
        else elementos.push({ renglon: r });
    }
    if (actual) cerrar(actual);
    return elementos;
}

/**
 * Estado de cuenta con el formato del área (hoja de Cabeza de Toro): una fila
 * por producto vendido con su parcial y la venta neta en la última de la
 * salida; pagos y abonos en Depósito. Lo más reciente arriba; los pagos de un mismo
 * día van en una fila con su total, que se despliega para ver cada uno.
 */
function EstadoCuentaTabla({ renglones, mostrarEmpresa }: Props) {
    const activos = renglones.filter((r) => !r.cancelado);
    // Los totales son de los movimientos; el saldo inicial solo arranca el saldo corrido.
    const movimientos = activos.filter((r) => r.tipo !== "inicial");
    const totalVenta = movimientos.reduce((acc, r) => acc + Number(r.cargo), 0);
    const totalDeposito = movimientos.reduce((acc, r) => acc + Number(r.abono), 0);
    const saldoFinal = [...activos].reverse().find((r) => r.saldo !== null)?.saldo ?? "0";
    const elementos = agrupar(renglones);
    const { estaExpandida, alternar } = useFilasExpandibles([]);

    function celdaSaldo(saldo: string | null) {
        return saldo === null
            ? <span className="text-body-secondary" title="Cancelado: no mueve el saldo">—</span>
            : <span className={claseSaldo(saldo)}>{dinero(saldo)}</span>;
    }

    /** Pago, ajuste o saldo inicial en una sola fila; dentro de un grupo, como detalle. */
    function filaSimple(r: RenglonEstadoCuenta, clave: string, enGrupo = false) {
        const tachado = r.cancelado ? "text-decoration-line-through text-body-secondary" : "";
        const deposito = Number(r.abono) > 0;
        return (
            <tr key={clave} className={enGrupo ? "fila-detalle" : "border-top border-secondary-subtle"}>
                <td></td>
                <td></td>
                <td className={`${tachado} ${enGrupo ? "ps-4" : ""}`}>
                    <span className={r.tipo === "inicial" ? "fw-semibold" : undefined}>{r.concepto}</span>
                    {r.referencia && <span className="small text-body-secondary"> · {r.referencia}</span>}
                    {r.cancelado && (
                        <span className="badge border bg-secondary-subtle text-secondary-emphasis border-secondary-subtle ms-1" title={r.motivo_cancelacion}>
                            Cancelado
                        </span>
                    )}
                    {mostrarEmpresa && !enGrupo && <div className="small text-body-secondary">{r.empresa}</div>}
                </td>
                <td className={`text-nowrap ${tachado}`}>{fecha(r.fecha)}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td className={`num ${tachado}`}>{!deposito && Number(r.cargo) > 0 && r.tipo !== "inicial" ? dinero(r.cargo) : ""}</td>
                <td className={`num ${tachado}`}>{deposito && r.tipo !== "inicial" ? dinero(r.abono) : ""}</td>
                <td className={`num ${enGrupo ? "" : "fw-semibold"}`}>{celdaSaldo(r.saldo)}</td>
            </tr>
        );
    }

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
                    {elementos.map((el, i) => {
                        if ("grupo" in el) {
                            const g = el.grupo;
                            const abierta = estaExpandida(g.id);
                            const activosGrupo = g.pagos.filter((p) => !p.cancelado);
                            const total = activosGrupo.reduce((acc, p) => acc + Number(p.abono), 0);
                            // El primero es el último pago del día: su saldo es el del cierre.
                            const saldoDia = activosGrupo[0]?.saldo ?? null;
                            const idDetalle = `pagos-dia-${g.id}`;
                            return (
                                <Fragment key={`grupo-${g.id}-${i}`}>
                                    <tr className={`fila-principal border-top border-secondary-subtle ${abierta ? "expandida" : ""}`}>
                                        <td className="text-center">
                                            <BotonExpandir
                                                expandido={abierta}
                                                onClick={() => alternar(g.id)}
                                                etiqueta={`los ${g.pagos.length} pagos del ${fecha(g.fecha)}`}
                                                controla={idDetalle}
                                            />
                                        </td>
                                        <td></td>
                                        <td>
                                            <span className="fw-semibold">PAGOS DEL DÍA</span>
                                            <span className="badge text-bg-light border fw-normal ms-1">{g.pagos.length}</span>
                                            {mostrarEmpresa && <div className="small text-body-secondary">{g.empresa}</div>}
                                        </td>
                                        <td className="text-nowrap">{fecha(g.fecha)}</td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td className="num fw-semibold">{dinero(total)}</td>
                                        <td className="num fw-semibold">{celdaSaldo(saldoDia)}</td>
                                    </tr>
                                    {abierta && g.pagos.map((p, j) => filaSimple(p, `${idDetalle}-${p.id ?? j}`, true))}
                                </Fragment>
                            );
                        }

                        const r = el.renglon;
                        const tachado = r.cancelado ? "text-decoration-line-through text-body-secondary" : "";
                        const empresa = mostrarEmpresa && <div className="small text-body-secondary">{r.empresa}</div>;
                        const saldo = celdaSaldo(r.saldo);

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
                                                <td className={`text-nowrap ${tachado}`}>{primera ? (d.folio_salida || "Sin salida") : ""}</td>
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

                        return filaSimple(r, `${r.tipo}-${r.id ?? i}-${i}`);
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
