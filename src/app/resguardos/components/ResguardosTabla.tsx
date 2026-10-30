import { Fragment } from "react";
import TablaResponsive from "../../../shared/components/TablaResponsive";
import BotonExpandir from "../../../shared/components/tabla/BotonExpandir";
import BotonAccionFila from "../../../shared/components/tabla/BotonAccionFila";
import { useFilasExpandibles } from "../../../shared/components/tabla/useFilasExpandibles";
import { columnasFijas } from "../../../shared/components/tabla/columnasFijas";
import type { DensidadTabla } from "../../../shared/hooks/useDensidadTabla";
import { formatearFechaNumerica } from "../../../shared/utils/fechas";
import { formatearKg } from "../../../shared/utils/numeros";
import type { Resguardo, Retiro } from "../interfaces/Resguardo";

interface Props {
    resguardos: Resguardo[];
    densidad: DensidadTabla;
    /** Sin estas acciones (solo lectura) no hay columna de acciones. */
    onRetirar?: (resguardo: Resguardo) => void;
    onLigar?: (resguardo: Resguardo) => void;
    onCancelarRetiro?: (retiro: Retiro) => void;
}

const [FIJA_EXPANDIR, FIJA_FECHA, FIJA_FOLIO] = columnasFijas(["2.5rem", "6.5rem", "8rem"]);
const COLUMNAS = 10;

function fecha(iso: string): string {
    return formatearFechaNumerica(new Date(iso + "T00:00:00"));
}

function Detalle({ resguardo, onCancelarRetiro }: { resguardo: Resguardo; onCancelarRetiro?: (retiro: Retiro) => void }) {
    return (
        <div className="d-flex flex-column gap-3">
            <table className="table table-sm tabla-detalle mb-0 border rounded">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th className="num">Cajas en resguardo</th>
                        <th className="num">Kg en resguardo</th>
                        <th className="num">Entregado</th>
                        <th className="num">Pendiente</th>
                    </tr>
                </thead>
                <tbody>
                    {resguardo.lineas.map((l) => (
                        <tr key={l.id}>
                            <td className="fw-semibold">{l.producto}</td>
                            <td className="num">{l.cajas_resguardo.toLocaleString("es-MX")}</td>
                            <td className="num">{formatearKg(l.kilos_resguardo)}</td>
                            <td className="num">{formatearKg(l.kilos_retirados)}</td>
                            <td className={`num fw-semibold ${Number(l.kilos_pendientes) > 0 ? "" : "text-body-secondary"}`}>
                                {formatearKg(l.kilos_pendientes)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div>
                <div className="small fw-semibold text-uppercase text-body-secondary mb-1">
                    Retiros <span className="badge text-bg-secondary">{resguardo.retiros.length}</span>
                </div>
                {resguardo.retiros.length === 0 ? (
                    <div className="small text-body-secondary">Aún no se ha entregado nada de este resguardo.</div>
                ) : (
                    <table className="table table-sm tabla-detalle mb-0 border rounded">
                        <thead>
                            <tr>
                                <th>Folio</th>
                                <th>Fecha</th>
                                <th>Salida de cámara</th>
                                <th>Nota</th>
                                <th>Entregado de</th>
                                <th className="num">Cajas</th>
                                <th className="num">Kg</th>
                                <th>Registró</th>
                                {onCancelarRetiro && <th className="text-end">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {resguardo.retiros.map((r) => (
                                <tr key={r.id}>
                                    <td className="text-nowrap fw-semibold">
                                        {r.folio_retiro}
                                        {r.entrega_ligada && (
                                            <span className="badge border bg-info-subtle text-info-emphasis border-info-subtle fw-normal ms-1"
                                                title="Se capturó en Salidas como salida normal y se ligó a este resguardo">
                                                Ligada
                                            </span>
                                        )}
                                    </td>
                                    <td className="text-nowrap">{fecha(r.fecha)}</td>
                                    <td className="text-nowrap">{r.folio_de_salida}</td>
                                    <td className="text-nowrap">{r.notas}</td>
                                    <td className="small">
                                        {r.lineas.map((l, i) => (
                                            <div key={i}>
                                                {l.producto} · {l.proveedor} · lote {l.lote_proveedor} · {l.camara}:{" "}
                                                <span className="fw-semibold">{formatearKg(l.kilos)} kg</span>
                                            </div>
                                        ))}
                                    </td>
                                    <td className="num">{r.cajas.toLocaleString("es-MX")}</td>
                                    <td className="num fw-semibold">{formatearKg(r.kilos)}</td>
                                    <td className="small">{r.registrado_por ?? "—"}</td>
                                    {onCancelarRetiro && (
                                        <td className="text-end">
                                            <BotonAccionFila
                                                icono="bi-x-circle"
                                                etiqueta={`Cancelar retiro ${r.folio_retiro}`}
                                                variante="danger"
                                                onClick={() => onCancelarRetiro(r)}
                                            />
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

/** Una fila por venta (nota) con resguardo; al desplegar, lo pendiente por producto y sus retiros. */
function ResguardosTabla({ resguardos, densidad, onRetirar, onLigar, onCancelarRetiro }: Props) {
    const { estaExpandida, alternar, alternarTodas, todasExpandidas } = useFilasExpandibles(resguardos.map((r) => r.id));
    const conAcciones = Boolean(onRetirar);
    const columnas = conAcciones ? COLUMNAS : COLUMNAS - 1;

    return (
        <TablaResponsive alturaMaxima="70vh">
            <table className={`table tabla-datos ${densidad === "compacta" ? "densidad-compacta" : ""}`}>
                <thead>
                    <tr>
                        <th className="fija-izq text-center" style={FIJA_EXPANDIR}>
                            <BotonExpandir expandido={todasExpandidas} onClick={alternarTodas}
                                etiqueta="el detalle de todos los resguardos" disabled={resguardos.length === 0} />
                        </th>
                        <th className="fija-izq" style={FIJA_FECHA}>Fecha</th>
                        <th className="fija-izq fija-izq-borde" style={FIJA_FOLIO}>Folio venta</th>
                        <th>Nota</th>
                        <th>Cliente</th>
                        <th className="num">En resguardo</th>
                        <th className="num">Entregado</th>
                        <th className="num">Pendiente</th>
                        <th>Estado</th>
                        {conAcciones && <th className="fija-der text-end">Acciones</th>}
                    </tr>
                </thead>
                <tbody>
                    {resguardos.length === 0 ? (
                        <tr>
                            <td colSpan={columnas} className="text-center text-body-secondary py-5">
                                <i className="bi bi-safe fs-3 d-block mb-2" aria-hidden="true"></i>
                                No hay resguardos con estos filtros.
                            </td>
                        </tr>
                    ) : (
                        resguardos.map((r) => {
                            const abierta = estaExpandida(r.id);
                            const idDetalle = `detalle-resguardo-${r.id}`;
                            const pendiente = r.estado === "pendiente";
                            return (
                                <Fragment key={r.id}>
                                    <tr className={`fila-principal ${abierta ? "expandida" : ""}`}>
                                        <td className="fija-izq text-center" style={FIJA_EXPANDIR}>
                                            <BotonExpandir expandido={abierta} onClick={() => alternar(r.id)}
                                                etiqueta={`detalle del resguardo de la venta ${r.referencia}`} controla={idDetalle} />
                                        </td>
                                        <td className="fija-izq text-nowrap" style={FIJA_FECHA}>{fecha(r.fecha)}</td>
                                        <td className="fija-izq fija-izq-borde text-nowrap fw-semibold" style={FIJA_FOLIO}>
                                            {r.folio_de_salida ?? <span className="badge border bg-secondary-subtle text-secondary-emphasis border-secondary-subtle fw-normal" title="No salió nada de cámara: todo quedó en resguardo">Sin salida</span>}
                                        </td>
                                        <td className="text-nowrap">{r.notas}</td>
                                        <td className="truncar" title={r.cliente.nombre}>{r.cliente.nombre}</td>
                                        <td className="num">{formatearKg(r.kilos_resguardo)}</td>
                                        <td className="num">{formatearKg(r.kilos_retirados)}</td>
                                        <td className="num fw-semibold">{formatearKg(r.kilos_pendientes)}</td>
                                        <td>
                                            {pendiente ? (
                                                <span className="badge border bg-warning-subtle text-warning-emphasis border-warning-subtle">
                                                    Por entregar
                                                </span>
                                            ) : (
                                                <span className="badge border bg-success-subtle text-success-emphasis border-success-subtle">
                                                    Entregado
                                                </span>
                                            )}
                                        </td>
                                        {conAcciones && (
                                            <td className="fija-der text-end text-nowrap">
                                                <BotonAccionFila
                                                    icono="bi-box-arrow-right"
                                                    etiqueta={`Registrar retiro de la venta ${r.referencia}`}
                                                    motivoBloqueo={pendiente ? undefined : "Ya se entregó todo el resguardo."}
                                                    onClick={() => onRetirar?.(r)}
                                                />
                                                <BotonAccionFila
                                                    icono="bi-link-45deg"
                                                    etiqueta={`Ligar entrega ya capturada en Salidas a la venta ${r.referencia}`}
                                                    motivoBloqueo={pendiente ? undefined : "Ya se entregó todo el resguardo."}
                                                    onClick={() => onLigar?.(r)}
                                                />
                                            </td>
                                        )}
                                    </tr>
                                    {abierta && (
                                        <tr className="fila-detalle" id={idDetalle}>
                                            <td colSpan={columnas}>
                                                <Detalle resguardo={r} onCancelarRetiro={onCancelarRetiro} />
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

export default ResguardosTabla;
