import { Fragment } from "react";
import { Link } from "react-router";
import TablaResponsive from "../../../../shared/components/TablaResponsive";
import BotonExpandir from "../../../../shared/components/tabla/BotonExpandir";
import BotonAccionFila from "../../../../shared/components/tabla/BotonAccionFila";
import { useFilasExpandibles } from "../../../../shared/components/tabla/useFilasExpandibles";
import { columnasFijas } from "../../../../shared/components/tabla/columnasFijas";
import type { DensidadTabla } from "../../../../shared/hooks/useDensidadTabla";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import type { Abono, Deuda, EstadoDeuda } from "../../interfaces/deudas/Deuda";
import { fechaDeISO, formatearDineroDivisa } from "../../utils/deudas";

interface DeudasTableProps {
    deudas: Deuda[];
    densidad: DensidadTabla;
    onEditar?: (deuda: Deuda) => void;
    onCancelar?: (deuda: Deuda) => void;
}

const [FIJA_EXPANDIR, FIJA_FECHA, FIJA_DEUDOR] = columnasFijas(["2.5rem", "6.5rem", "12rem"]);

const dinero = formatearDineroDivisa;

function fecha(iso: string): string {
    return formatearFechaNumerica(fechaDeISO(iso));
}

const BADGE_ESTADO: Record<EstadoDeuda, { clase: string; texto: string }> = {
    abierta: { clase: "bg-warning-subtle text-warning-emphasis border-warning-subtle", texto: "Abierta" },
    pagada: { clase: "bg-success-subtle text-success-emphasis border-success-subtle", texto: "Pagada" },
    cancelada: { clase: "bg-secondary-subtle text-secondary-emphasis border-secondary-subtle", texto: "Cancelada" },
};

function BadgeEstadoDeuda({ estado }: { estado: EstadoDeuda }) {
    const { clase, texto } = BADGE_ESTADO[estado];
    return <span className={`badge border ${clase}`}>{texto}</span>;
}

function HistorialAbonos({ deuda }: { deuda: Deuda }) {
    if (deuda.abonos.length === 0) {
        return <p className="text-body-secondary small mb-0">Sin abonos. Se registran como ingresos en Movimientos.</p>;
    }
    return (
        <table className="table table-sm tabla-detalle mb-0 border rounded">
            <thead>
                <tr>
                    <th>Folio</th>
                    <th>Fecha</th>
                    <th>Concepto</th>
                    <th className="num">Abono</th>
                    <th>Capturó</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                {deuda.abonos.map((abono: Abono) => (
                    <tr key={abono.id} className={abono.cancelado ? "text-decoration-line-through text-body-secondary" : ""}>
                        <td className="text-nowrap fw-semibold">
                            <Link to={`/tesoreria/caja/movimientos/${abono.id}`}>{abono.folio}</Link>
                        </td>
                        <td className="text-nowrap">{fecha(abono.fecha)}</td>
                        <td className="truncar" title={abono.concepto}>{abono.concepto}</td>
                        <td className="num">{dinero(deuda.divisa.simbolo, abono.cantidad)}</td>
                        <td className="text-nowrap">{abono.usuario.username}</td>
                        <td>
                            {abono.cancelado ? (
                                <span className="badge border bg-secondary-subtle text-secondary-emphasis border-secondary-subtle" title={abono.motivo_cancelacion || undefined}>
                                    Cancelado
                                </span>
                            ) : (
                                <span className="badge border bg-success-subtle text-success-emphasis border-success-subtle">Activo</span>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function DeudasTable({ deudas, densidad, onEditar, onCancelar }: DeudasTableProps) {
    const { estaExpandida, alternar, alternarTodas, todasExpandidas } = useFilasExpandibles(deudas.map((d) => d.id));
    const conAcciones = !!(onEditar && onCancelar);
    const columnas = conAcciones ? 10 : 9;

    return (
        <TablaResponsive alturaMaxima="70vh">
            <table className={`table tabla-datos ${densidad === "compacta" ? "densidad-compacta" : ""}`}>
                <thead>
                    <tr>
                        <th className="fija-izq text-center" style={FIJA_EXPANDIR}>
                            <BotonExpandir
                                expandido={todasExpandidas}
                                onClick={alternarTodas}
                                etiqueta="los abonos de todas las deudas"
                                disabled={deudas.length === 0}
                            />
                        </th>
                        <th className="fija-izq" style={FIJA_FECHA}>Fecha</th>
                        <th className="fija-izq fija-izq-borde" style={FIJA_DEUDOR}>Deudor</th>
                        <th>Concepto</th>
                        <th>Divisa</th>
                        <th className="num">Monto</th>
                        <th className="num">Abonado</th>
                        <th className="num">Saldo</th>
                        <th>Estado</th>
                        {conAcciones && <th className="fija-der text-end">Acciones</th>}
                    </tr>
                </thead>
                <tbody>
                    {deudas.length === 0 ? (
                        <tr>
                            <td colSpan={columnas} className="text-center text-body-secondary py-5">
                                <i className="bi bi-inbox fs-3 d-block mb-2" aria-hidden="true"></i>
                                No hay deudas con estos filtros.
                            </td>
                        </tr>
                    ) : (
                        deudas.map((deuda) => {
                            const abierta = estaExpandida(deuda.id);
                            const idDetalle = `abonos-deuda-${deuda.id}`;
                            const abonosActivos = deuda.abonos.filter((a) => !a.cancelado).length;
                            const simbolo = deuda.divisa.simbolo;
                            return (
                                <Fragment key={deuda.id}>
                                    <tr className={`fila-principal ${abierta ? "expandida" : ""}`}>
                                        <td className="fija-izq text-center" style={FIJA_EXPANDIR}>
                                            <BotonExpandir
                                                expandido={abierta}
                                                onClick={() => alternar(deuda.id)}
                                                etiqueta={`abonos de ${deuda.concepto}`}
                                                controla={idDetalle}
                                            />
                                        </td>
                                        <td className="fija-izq text-nowrap" style={FIJA_FECHA}>{fecha(deuda.fecha)}</td>
                                        <td className="fija-izq fija-izq-borde truncar fw-semibold" style={FIJA_DEUDOR} title={deuda.deudor.nombre}>
                                            {deuda.deudor.nombre}
                                        </td>
                                        <td className="truncar" title={deuda.notas ? `${deuda.concepto} — ${deuda.notas}` : deuda.concepto}>
                                            {deuda.concepto}
                                        </td>
                                        <td>{deuda.divisa.codigo}</td>
                                        <td className="num">{dinero(simbolo, deuda.monto)}</td>
                                        <td className="num">
                                            {dinero(simbolo, deuda.abonado)}
                                            {abonosActivos > 0 && (
                                                <span className="text-body-secondary small ms-1">({abonosActivos})</span>
                                            )}
                                        </td>
                                        <td className="num fw-semibold">{dinero(simbolo, deuda.saldo)}</td>
                                        <td>
                                            <span title={deuda.cancelada ? deuda.motivo_cancelacion : undefined}>
                                                <BadgeEstadoDeuda estado={deuda.estado} />
                                            </span>
                                        </td>
                                        {conAcciones && (
                                            <td className="fija-der text-end text-nowrap">
                                                <BotonAccionFila
                                                    icono="bi-pencil"
                                                    etiqueta={`Editar deuda ${deuda.concepto}`}
                                                    onClick={() => onEditar?.(deuda)}
                                                    motivoBloqueo={
                                                        deuda.cancelada ? "La deuda está cancelada"
                                                            : abonosActivos > 0 ? "Tiene abonos: ya no se puede editar" : null
                                                    }
                                                />{" "}
                                                <BotonAccionFila
                                                    icono="bi-x-circle"
                                                    etiqueta={`Cancelar deuda ${deuda.concepto}`}
                                                    variante="danger"
                                                    onClick={() => onCancelar?.(deuda)}
                                                    motivoBloqueo={
                                                        deuda.cancelada ? "Ya está cancelada"
                                                            : abonosActivos > 0 ? "Tiene abonos activos: cancela primero esos ingresos" : null
                                                    }
                                                />
                                            </td>
                                        )}
                                    </tr>
                                    {abierta && (
                                        <tr className="fila-detalle" id={idDetalle}>
                                            <td colSpan={columnas}>
                                                <HistorialAbonos deuda={deuda} />
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            );
                        })
                    )}
                </tbody>
            </table>
        </TablaResponsive>
    );
}

export default DeudasTable;
