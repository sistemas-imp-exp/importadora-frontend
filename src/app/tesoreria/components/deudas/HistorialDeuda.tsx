import { Link } from "react-router-dom";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import type { Deuda, MovimientoDeuda } from "../../interfaces/deudas/Deuda";
import { fechaDeISO, formatearDineroDivisa } from "../../utils/deudas";

const dinero = formatearDineroDivisa;

function fecha(iso: string): string {
    return formatearFechaNumerica(fechaDeISO(iso));
}

interface Renglon {
    mov: MovimientoDeuda;
    /** Saldo de la deuda después de este movimiento; null si está cancelado (no lo mueve). */
    saldo: number | null;
}

/**
 * Saldo acumulado como en un estado de cuenta: parte del monto inicial y suma
 * cargos / resta abonos en orden de fecha (y de captura dentro del mismo día).
 * Los cancelados no lo mueven.
 */
function renglones(deuda: Deuda): Renglon[] {
    let saldo = Number(deuda.monto_inicial);
    const orden = [...deuda.movimientos].sort(
        (a, b) => a.fecha.localeCompare(b.fecha) || a.creado.localeCompare(b.creado),
    );
    return orden.map((mov) => {
        if (mov.cancelado) return { mov, saldo: null };
        saldo += mov.tipo === "E" ? Number(mov.cantidad) : -Number(mov.cantidad);
        return { mov, saldo };
    });
}

/** Cargos y abonos de la deuda con el saldo después de cada uno, lo más reciente arriba. */
function HistorialDeuda({ deuda }: { deuda: Deuda }) {
    const simbolo = deuda.divisa.simbolo;
    const inicial = Number(deuda.monto_inicial);
    const filas = renglones(deuda).reverse();

    if (filas.length === 0 && inicial === 0) {
        return <p className="text-body-secondary mb-0 p-3">Sin cargos ni abonos.</p>;
    }

    return (
        <div className="table-responsive">
            <table className="table tabla-datos mb-0">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Folio</th>
                        <th>Tipo</th>
                        <th>Concepto</th>
                        <th className="num">Cargo</th>
                        <th className="num">Abono</th>
                        <th className="num">Saldo</th>
                        <th>Capturó</th>
                    </tr>
                </thead>
                <tbody>
                    {filas.map(({ mov, saldo }) => {
                        const cargo = mov.tipo === "E";
                        // Abono repartido entre varias deudas: aquí solo cuenta su parte.
                        const compartido = Number(mov.monto_movimiento) !== Number(mov.cantidad);
                        const tachado = mov.cancelado ? "text-decoration-line-through text-body-secondary" : "";
                        return (
                            <tr key={mov.id}>
                                <td className={`text-nowrap ${tachado}`}>{fecha(mov.fecha)}</td>
                                <td className="text-nowrap fw-semibold">
                                    <Link to={`/tesoreria/caja/movimientos/${mov.id}`} title="Ver el movimiento de caja">{mov.folio}</Link>
                                </td>
                                <td>
                                    {cargo ? (
                                        <span className="badge border bg-danger-subtle text-danger-emphasis border-danger-subtle">Cargo</span>
                                    ) : (
                                        <span className="badge border bg-success-subtle text-success-emphasis border-success-subtle">Abono</span>
                                    )}
                                </td>
                                <td>
                                    <span className={tachado}>{mov.concepto}</span>
                                    {compartido && (
                                        <span
                                            className="badge border bg-info-subtle text-info-emphasis border-info-subtle ms-1"
                                            title="El folio se repartió entre varias deudas: aquí cuenta solo esta parte"
                                        >
                                            Compartido · folio por {dinero(simbolo, mov.monto_movimiento)}
                                        </span>
                                    )}
                                    {mov.editado && !mov.cancelado && (
                                        <span className="badge border bg-warning-subtle text-warning-emphasis border-warning-subtle ms-1">Editado</span>
                                    )}
                                    {mov.cancelado && (
                                        <span
                                            className="badge border bg-secondary-subtle text-secondary-emphasis border-secondary-subtle ms-1"
                                            title={mov.motivo_cancelacion || undefined}
                                        >
                                            Cancelado
                                        </span>
                                    )}
                                </td>
                                <td className={`num ${tachado}`}>{cargo ? dinero(simbolo, mov.cantidad) : ""}</td>
                                <td className={`num ${tachado}`}>{cargo ? "" : dinero(simbolo, mov.cantidad)}</td>
                                <td className="num fw-semibold">
                                    {saldo === null ? <span className="text-body-secondary" title="Cancelado: no mueve el saldo">—</span> : dinero(simbolo, saldo)}
                                </td>
                                <td className="text-nowrap small">{mov.usuario.username}</td>
                            </tr>
                        );
                    })}
                    {inicial > 0 && (
                        <tr>
                            <td className="text-nowrap">{fecha(deuda.fecha)}</td>
                            <td className="text-body-secondary">—</td>
                            <td><span className="badge border bg-light text-body-secondary">Inicial</span></td>
                            <td className="text-body-secondary">Monto inicial (sin salida de caja)</td>
                            <td className="num">{dinero(simbolo, inicial)}</td>
                            <td className="num"></td>
                            <td className="num fw-semibold">{dinero(simbolo, inicial)}</td>
                            <td className="text-nowrap small">{deuda.usuario.username}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default HistorialDeuda;
