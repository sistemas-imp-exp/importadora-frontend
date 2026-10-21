import { Link, useNavigate } from "react-router-dom";
import TablaResponsive from "../../../../shared/components/TablaResponsive";
import MenuAccionesFila from "../../../../shared/components/tabla/MenuAccionesFila";
import { columnasFijas } from "../../../../shared/components/tabla/columnasFijas";
import type { DensidadTabla } from "../../../../shared/hooks/useDensidadTabla";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import type { Deuda } from "../../interfaces/deudas/Deuda";
import { fechaDeISO, formatearDineroDivisa, rutaDetalleDeuda } from "../../utils/deudas";
import BadgeEstadoDeuda from "./BadgeEstadoDeuda";

interface DeudasTableProps {
    deudas: Deuda[];
    densidad: DensidadTabla;
    onEditar?: (deuda: Deuda) => void;
    onCancelar?: (deuda: Deuda) => void;
}

const [FIJA_FECHA, FIJA_DEUDOR] = columnasFijas(["6.5rem", "12rem"]);

const dinero = formatearDineroDivisa;

/** Lista de deudas; el historial de cargos y abonos vive en el detalle de cada una. */
function DeudasTable({ deudas, densidad, onEditar, onCancelar }: DeudasTableProps) {
    const navigate = useNavigate();
    const conEdicion = !!(onEditar && onCancelar);

    return (
        <TablaResponsive alturaMaxima="70vh">
            <table className={`table tabla-datos ${densidad === "compacta" ? "densidad-compacta" : ""}`}>
                <thead>
                    <tr>
                        <th className="fija-izq" style={FIJA_FECHA}>Fecha</th>
                        <th className="fija-izq fija-izq-borde" style={FIJA_DEUDOR}>Deudor</th>
                        <th>Concepto</th>
                        <th>Divisa</th>
                        <th className="num">Total</th>
                        <th className="num">Abonado</th>
                        <th className="num">Saldo</th>
                        <th>Estado</th>
                        <th className="fija-der text-end">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {deudas.length === 0 ? (
                        <tr>
                            <td colSpan={9} className="text-center text-body-secondary py-5">
                                <i className="bi bi-inbox fs-3 d-block mb-2" aria-hidden="true"></i>
                                No hay deudas con estos filtros.
                            </td>
                        </tr>
                    ) : (
                        deudas.map((deuda) => {
                            const abonosActivos = deuda.movimientos.filter((m) => !m.cancelado && m.tipo === "I").length;
                            const conMovimientos = deuda.movimientos.some((m) => !m.cancelado);
                            const simbolo = deuda.divisa.simbolo;
                            return (
                                <tr key={deuda.id} className="fila-principal">
                                    <td className="fija-izq text-nowrap" style={FIJA_FECHA}>
                                        {formatearFechaNumerica(fechaDeISO(deuda.fecha))}
                                    </td>
                                    <td className="fija-izq fija-izq-borde truncar fw-semibold" style={FIJA_DEUDOR} title={deuda.deudor.nombre}>
                                        {deuda.deudor.nombre}
                                    </td>
                                    <td className="truncar" title={deuda.notas ? `${deuda.concepto} — ${deuda.notas}` : deuda.concepto}>
                                        <Link to={rutaDetalleDeuda(deuda.id)}>{deuda.concepto}</Link>
                                    </td>
                                    <td>{deuda.divisa.codigo}</td>
                                    <td className="num">{dinero(simbolo, deuda.total)}</td>
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
                                    <td className="fija-der text-end text-nowrap">
                                        <MenuAccionesFila
                                            etiqueta={`Acciones de la deuda ${deuda.concepto}`}
                                            acciones={[
                                                {
                                                    etiqueta: "Ver detalle",
                                                    icono: "bi-eye",
                                                    onClick: () => navigate(rutaDetalleDeuda(deuda.id)),
                                                },
                                                ...(conEdicion ? [
                                                    {
                                                        etiqueta: "Editar",
                                                        icono: "bi-pencil",
                                                        onClick: () => onEditar?.(deuda),
                                                        motivoBloqueo: deuda.cancelada ? "La deuda está cancelada" : null,
                                                    },
                                                    {
                                                        etiqueta: "Cancelar deuda",
                                                        icono: "bi-x-circle",
                                                        variante: "danger" as const,
                                                        onClick: () => onCancelar?.(deuda),
                                                        motivoBloqueo: deuda.cancelada
                                                            ? "Ya está cancelada"
                                                            : conMovimientos ? "Tiene cargos o abonos activos: cancela primero esos movimientos" : null,
                                                    },
                                                ] : []),
                                            ]}
                                        />
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </TablaResponsive>
    );
}

export default DeudasTable;
