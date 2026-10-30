import TablaResponsive from "../../../shared/components/TablaResponsive";
import BotonAccionFila from "../../../shared/components/tabla/BotonAccionFila";
import type { DensidadTabla } from "../../../shared/hooks/useDensidadTabla";
import { formatearFechaNumerica } from "../../../shared/utils/fechas";
import { formatearKg } from "../../../shared/utils/numeros";
import type { LineaResguardo, LineaRetiro, Resguardo, Retiro } from "../interfaces/Resguardo";

interface Props {
    resguardos: Resguardo[];
    densidad: DensidadTabla;
    /** Sin estas acciones (solo lectura) no hay columna de acciones. */
    onRetirar?: (resguardo: Resguardo) => void;
    onLigar?: (resguardo: Resguardo) => void;
    onCancelarRetiro?: (retiro: Retiro) => void;
}

const COLUMNAS = 13;

interface Entrega {
    retiro: Retiro;
    linea: LineaRetiro;
}

function fecha(iso: string): string {
    return formatearFechaNumerica(new Date(iso + "T00:00:00"));
}

/** Lo que se ha llevado de un producto de la venta, en orden de entrega. */
function entregasDe(resguardo: Resguardo, linea: LineaResguardo): Entrega[] {
    return resguardo.retiros
        .flatMap((retiro) => retiro.lineas.filter((l) => l.retiro_de === linea.id).map((l) => ({ retiro, linea: l })))
        .sort((a, b) => a.retiro.fecha.localeCompare(b.retiro.fecha) || a.retiro.id - b.retiro.id);
}

/**
 * Igual que la hoja de cada cliente del control de resguardos del área: por
 * nota y producto, el renglón amarillo con lo que quedó guardado y su saldo, y
 * debajo cada salida que se ha llevado (fecha, salida de cámara, nota del papel
 * y kilos). Columnas en el mismo orden que el Excel.
 */
function ResguardosTabla({ resguardos, densidad, onRetirar, onLigar, onCancelarRetiro }: Props) {
    const conAcciones = Boolean(onRetirar);
    const columnas = conAcciones ? COLUMNAS : COLUMNAS - 1;

    return (
        <TablaResponsive alturaMaxima="70vh">
            <table className={`table tabla-datos tabla-hoja ${densidad === "compacta" ? "densidad-compacta" : ""}`}>
                <thead>
                    <tr>
                        <th>Nota</th>
                        <th>Fecha de resguardo / salida</th>
                        <th>Talla / salida de cámara</th>
                        <th>Lote de venta</th>
                        <th>Cliente</th>
                        <th>Proveedor · lote · cámara</th>
                        <th className="num">Master</th>
                        <th className="num">Kilos por master</th>
                        <th className="num">Resguardo</th>
                        <th className="num">Salida</th>
                        <th className="num">Saldo en kilos</th>
                        <th>Retiro</th>
                        {conAcciones && <th className="fija-der text-end">Acciones</th>}
                    </tr>
                </thead>
                {resguardos.length === 0 ? (
                    <tbody>
                        <tr>
                            <td colSpan={columnas} className="text-center text-body-secondary py-5">
                                <i className="bi bi-safe fs-3 d-block mb-2" aria-hidden="true"></i>
                                No hay resguardos con estos filtros.
                            </td>
                        </tr>
                    </tbody>
                ) : (
                    resguardos.map((r) => <GrupoVenta key={r.id} resguardo={r} conAcciones={conAcciones}
                        onRetirar={onRetirar} onLigar={onLigar} onCancelarRetiro={onCancelarRetiro} />)
                )}
            </table>
        </TablaResponsive>
    );
}

interface GrupoProps extends Omit<Props, "resguardos" | "densidad"> {
    resguardo: Resguardo;
    conAcciones: boolean;
}

function GrupoVenta({ resguardo: r, conAcciones, onRetirar, onLigar, onCancelarRetiro }: GrupoProps) {
    const pendiente = r.estado === "pendiente";
    // Un retiro con varios productos aparece en varios bloques: se cancela desde el primero.
    const retirosConBoton = new Set<number>();

    return (
        <tbody className="grupo-documento">
            {r.lineas.map((linea, i) => {
                const entregas = entregasDe(r, linea);
                const porMaster = linea.cajas_resguardo > 0 ? Number(linea.kilos_resguardo) / linea.cajas_resguardo : null;
                return [
                    <tr key={`l${linea.id}`} className="fila-bloque">
                        <td className="text-nowrap fw-semibold">{r.notas}</td>
                        <td className="text-nowrap">{fecha(r.fecha)}</td>
                        <td className="text-nowrap fw-semibold">{linea.producto}</td>
                        <td className="text-nowrap" title="Folio de la venta">
                            {r.folio_de_salida ?? <span className="text-body-secondary">Sin salida</span>}
                        </td>
                        <td className="truncar" title={r.cliente.nombre}>{r.cliente.nombre}</td>
                        <td></td>
                        <td className="num">{linea.cajas_resguardo.toLocaleString("es-MX")}</td>
                        <td className="num">{porMaster ? formatearKg(porMaster) : "—"}</td>
                        <td className="num">{formatearKg(linea.kilos_resguardo)}</td>
                        <td></td>
                        <td className="num fw-semibold">{formatearKg(linea.kilos_pendientes)}</td>
                        <td>
                            {Number(linea.kilos_pendientes) > 0 ? (
                                <span className="badge border bg-warning-subtle text-warning-emphasis border-warning-subtle fw-normal">Por entregar</span>
                            ) : (
                                <span className="badge border bg-success-subtle text-success-emphasis border-success-subtle fw-normal">Terminado</span>
                            )}
                        </td>
                        {conAcciones && (
                            <td className="fija-der text-end text-nowrap">
                                {i === 0 && (
                                    <>
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
                                    </>
                                )}
                            </td>
                        )}
                    </tr>,
                    ...entregas.map(({ retiro, linea: l }, j) => {
                        const conBoton = Boolean(onCancelarRetiro) && !retirosConBoton.has(retiro.id);
                        retirosConBoton.add(retiro.id);
                        return (
                            <tr key={`e${linea.id}-${j}`}>
                                <td></td>
                                <td className="text-nowrap">{fecha(retiro.fecha)}</td>
                                <td className="text-nowrap">{retiro.folio_de_salida}</td>
                                <td className="text-nowrap">{retiro.notas}</td>
                                <td></td>
                                <td className="small truncar" title={retiro.registrado_por ? `Registró ${retiro.registrado_por}` : undefined}>
                                    {l.proveedor} · {l.lote_proveedor} · {l.camara}
                                </td>
                                <td className="num">{l.cajas.toLocaleString("es-MX")}</td>
                                <td></td>
                                <td></td>
                                <td className="num">{formatearKg(l.kilos)}</td>
                                <td></td>
                                <td className="text-nowrap small">
                                    {retiro.folio_retiro}
                                    {retiro.entrega_ligada && (
                                        <span className="badge border bg-info-subtle text-info-emphasis border-info-subtle fw-normal ms-1"
                                            title="Se capturó en Salidas como salida normal y se ligó a este resguardo">
                                            Ligada
                                        </span>
                                    )}
                                </td>
                                {conAcciones && (
                                    <td className="fija-der text-end">
                                        {conBoton && (
                                            <BotonAccionFila
                                                icono="bi-x-circle"
                                                etiqueta={`Cancelar retiro ${retiro.folio_retiro}`}
                                                variante="danger"
                                                onClick={() => onCancelarRetiro?.(retiro)}
                                            />
                                        )}
                                    </td>
                                )}
                            </tr>
                        );
                    }),
                ];
            })}
        </tbody>
    );
}

export default ResguardosTabla;
