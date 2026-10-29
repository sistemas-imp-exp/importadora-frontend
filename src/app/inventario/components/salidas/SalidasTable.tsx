import { Fragment } from "react";
import type { SalidaApi, SalidaDetalleApi } from "../../interfaces/salidas/Salida";
import type { Camara } from "../../interfaces/camaras/Camara";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import { formatearDinero } from "../../utils/existencias";
import TablaResponsive from "../../../../shared/components/TablaResponsive";
import type { DensidadTabla } from "../../../../shared/hooks/useDensidadTabla";
import BotonExpandir from "../../../../shared/components/tabla/BotonExpandir";
import BotonAccionFila from "../../../../shared/components/tabla/BotonAccionFila";
import { useFilasExpandibles } from "../../../../shared/components/tabla/useFilasExpandibles";
import { columnasFijas } from "../../../../shared/components/tabla/columnasFijas";
import { formatearKg, formatearPrecioKg } from "../../../../shared/utils/numeros";

interface SalidasTableProps {
    salidas: SalidaApi[];
    camaras: Camara[];
    densidad: DensidadTabla;
    onEditar?: (salida: SalidaApi) => void;
    onEliminar?: (salida: SalidaApi) => void;
}

const [FIJA_EXPANDIR, FIJA_FECHA, FIJA_FOLIO] = columnasFijas(["2.5rem", "6.5rem", "8rem"]);
const COLUMNAS = 10;

function numero(valor: number | string): string {
    return formatearDinero(Number(valor));
}

function DetalleSalida({ detalles, nombreCamara }: { detalles: SalidaDetalleApi[]; nombreCamara: (id: number | null) => string }) {
    return (
        <table className="table table-sm tabla-detalle mb-0 border rounded">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Lote origen</th>
                    <th>Proveedor</th>
                    <th>Cámara</th>
                    <th>Factura proveedor</th>
                    <th className="num">Cajas</th>
                    <th className="num">Total kg</th>
                    <th className="num" title="Lo que el cliente dejó guardado y lo que ya se llevó">Resguardo</th>
                    <th className="num">Precio/kg</th>
                    <th className="num">Total venta</th>
                    <th>Nota</th>
                </tr>
            </thead>
            <tbody>
                {detalles.map((d) => (
                    <tr key={d.id}>
                        <td className="text-nowrap fw-semibold">
                            {d.producto.talla} {d.producto.tipo}
                            {d.aviso_cartera && (
                                <div className="small fw-normal text-danger-emphasis text-wrap" style={{ maxWidth: "18rem" }}>
                                    <i className="bi bi-exclamation-triangle me-1" aria-hidden="true"></i>
                                    Cartera: {d.aviso_cartera.comentario}
                                    <span className="text-body-secondary"> ({d.aviso_cartera.usuario})</span>
                                </div>
                            )}
                        </td>
                        <td className="text-nowrap">{d.lote_proveedor || "—"}</td>
                        <td className="truncar" title={d.proveedor_nombre || undefined}>{d.proveedor_nombre || "—"}</td>
                        <td className="text-nowrap">{nombreCamara(d.camara)}</td>
                        <td className="text-nowrap">{d.factura_proveedor || "—"}</td>
                        <td className="num">
                            {d.cajas === 0 ? (
                                <span className="badge text-bg-light border" title="Kilos sueltos de una caja abierta">Suelto</span>
                            ) : (
                                d.cajas.toLocaleString("es-MX")
                            )}
                        </td>
                        <td className="num">{formatearKg(d.total_kilos)}</td>
                        <td className="num">
                            {Number(d.kilos_resguardo) > 0 ? (
                                <>
                                    {formatearKg(d.kilos_resguardo)}
                                    <div className="small text-body-secondary">entregado {formatearKg(d.kilos_retirados)}</div>
                                </>
                            ) : (
                                <span className="text-body-secondary">—</span>
                            )}
                        </td>
                        <td className="num">{d.precio_x_kilo ? formatearPrecioKg(d.precio_x_kilo) : "—"}</td>
                        <td className="num">{d.total_venta ? `$${numero(d.total_venta)}` : "—"}</td>
                        <td className="truncar" title={d.notas || undefined}>
                            {d.notas || <span className="text-body-secondary">—</span>}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function SalidasTable({ salidas, camaras, densidad, onEditar, onEliminar }: SalidasTableProps) {
    function nombreCamara(id: number | null): string {
        if (!id) return "—";
        return camaras.find((c) => c.id === id)?.nombre ?? "—";
    }

    // Los movimientos entre cámaras también crean una Salida (la mitad "salida"),
    // pero sin cliente real — no pertenecen a esta lista de ventas.
    const reales = salidas.filter((s) => s.cliente !== null);
    const { estaExpandida, alternar, alternarTodas, todasExpandidas } = useFilasExpandibles(reales.map((s) => s.id));

    return (
        <TablaResponsive alturaMaxima="70vh">
            <table className={`table tabla-datos ${densidad === "compacta" ? "densidad-compacta" : ""}`}>
                <thead>
                    <tr>
                        <th className="fija-izq text-center" style={FIJA_EXPANDIR}>
                            <BotonExpandir
                                expandido={todasExpandidas}
                                onClick={alternarTodas}
                                etiqueta="las líneas de todas las salidas"
                                disabled={reales.length === 0}
                            />
                        </th>
                        <th className="fija-izq" style={FIJA_FECHA}>Fecha</th>
                        <th className="fija-izq fija-izq-borde" style={FIJA_FOLIO}>Folio</th>
                        <th>Cliente</th>
                        <th>Nota de salida</th>
                        <th className="num">Líneas</th>
                        <th className="num">Cajas</th>
                        <th className="num">Total kg</th>
                        <th className="num">Total venta</th>
                        {onEditar && <th className="fija-der text-end">Acciones</th>}
                    </tr>
                </thead>
                <tbody>
                    {reales.length === 0 ? (
                        <tr>
                            <td colSpan={onEditar ? COLUMNAS : COLUMNAS - 1} className="text-center text-body-secondary py-5">
                                <i className="bi bi-inbox fs-3 d-block mb-2" aria-hidden="true"></i>
                                No hay salidas registradas.
                            </td>
                        </tr>
                    ) : (
                        reales.map((salida) => {
                            const abierta = estaExpandida(salida.id);
                            const idDetalle = `detalle-salida-${salida.id}`;
                            const totalCajas = salida.detalles.reduce((acc, d) => acc + d.cajas, 0);
                            const totalKilos = salida.detalles.reduce((acc, d) => acc + Number(d.total_kilos), 0);
                            // Sin precio en alguna línea el total estaría incompleto: se avisa en vez de sumar de menos.
                            const sinPrecio = salida.detalles.some((d) => !d.total_venta);
                            const totalVenta = salida.detalles.reduce((acc, d) => acc + Number(d.total_venta ?? 0), 0);
                            const conResguardo = salida.detalles.some((d) => Number(d.kilos_resguardo) > 0);
                            // Un retiro de resguardo se registra y cancela desde Resguardos; una venta
                            // cuyo resguardo ya se empezó a entregar no se puede eliminar.
                            const conRetiros = salida.detalles.some((d) => Number(d.kilos_retirados) > 0);
                            const bloqueoEditar = salida.folio_retiro ? "Es un retiro de resguardo: se maneja desde Resguardos." : undefined;
                            const bloqueoEliminar = bloqueoEditar
                                ?? (conRetiros ? "Ya se entregó parte de su resguardo: cancela esos retiros en Resguardos." : undefined);
                            return (
                                <Fragment key={salida.id}>
                                    <tr className={`fila-principal ${abierta ? "expandida" : ""}`}>
                                        <td className="fija-izq text-center" style={FIJA_EXPANDIR}>
                                            <BotonExpandir
                                                expandido={abierta}
                                                onClick={() => alternar(salida.id)}
                                                etiqueta={`líneas de la salida ${salida.folio_de_salida}`}
                                                controla={idDetalle}
                                            />
                                        </td>
                                        <td className="fija-izq text-nowrap" style={FIJA_FECHA}>
                                            {formatearFechaNumerica(new Date(salida.fecha + "T00:00:00"))}
                                        </td>
                                        <td className="fija-izq fija-izq-borde text-nowrap fw-semibold" style={FIJA_FOLIO}>
                                            {salida.folio_de_salida}
                                            {salida.detalles.some((d) => d.aviso_cartera) && (
                                                <span
                                                    className="badge border bg-danger-subtle text-danger-emphasis border-danger-subtle ms-1"
                                                    title="Cartera reportó una diferencia contra la nota: abre la salida para verla y corrígela"
                                                >
                                                    <i className="bi bi-exclamation-triangle" aria-hidden="true"></i> Cartera
                                                </span>
                                            )}
                                            {salida.folio_retiro && (
                                                <div className="small fw-normal">
                                                    <span
                                                        className="badge border bg-info-subtle text-info-emphasis border-info-subtle"
                                                        title={salida.venta_resguardo ? `Entrega del resguardo de la venta ${salida.venta_resguardo.folio_de_salida}` : undefined}
                                                    >
                                                        <i className="bi bi-box-arrow-right me-1" aria-hidden="true"></i>{salida.folio_retiro}
                                                    </span>
                                                </div>
                                            )}
                                            {conResguardo && (
                                                <div className="small fw-normal">
                                                    <span
                                                        className="badge border bg-warning-subtle text-warning-emphasis border-warning-subtle"
                                                        title="El cliente dejó parte de esta venta guardada en la cámara"
                                                    >
                                                        <i className="bi bi-safe me-1" aria-hidden="true"></i>Resguardo
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="truncar" title={salida.cliente!.nombre}>{salida.cliente!.nombre}</td>
                                        <td className="truncar" title={salida.notas || undefined}>
                                            {salida.notas || <span className="text-body-secondary">—</span>}
                                            {salida.venta_resguardo && (
                                                <div className="small text-body-secondary">
                                                    De la venta {salida.venta_resguardo.folio_de_salida}
                                                </div>
                                            )}
                                        </td>
                                        <td className="num">{salida.detalles.length}</td>
                                        <td className="num">{totalCajas.toLocaleString("es-MX")}</td>
                                        <td className="num fw-semibold">{formatearKg(totalKilos)}</td>
                                        <td className="num">
                                            {salida.folio_retiro ? (
                                                <span className="text-body-secondary" title="Producto ya cobrado en la venta original">Ya cobrado</span>
                                            ) : totalVenta > 0 ? `$${numero(totalVenta)}` : "—"}
                                            {sinPrecio && totalVenta > 0 && (
                                                <i
                                                    className="bi bi-info-circle text-warning ms-1"
                                                    title="Hay líneas sin precio: el total no las incluye"
                                                    aria-label="Hay líneas sin precio"
                                                ></i>
                                            )}
                                        </td>
                                        {onEditar && onEliminar && (
                                            <td className="fija-der text-end text-nowrap">
                                                <BotonAccionFila
                                                    icono="bi-pencil"
                                                    etiqueta={`Editar salida ${salida.folio_de_salida}`}
                                                    motivoBloqueo={bloqueoEditar}
                                                    onClick={() => onEditar?.(salida)}
                                                />{" "}
                                                <BotonAccionFila
                                                    icono="bi-trash"
                                                    etiqueta={`Eliminar salida ${salida.folio_de_salida}`}
                                                    variante="danger"
                                                    motivoBloqueo={bloqueoEliminar}
                                                    onClick={() => onEliminar?.(salida)}
                                                />
                                            </td>
                                        )}
                                    </tr>
                                    {abierta && (
                                        <tr className="fila-detalle" id={idDetalle}>
                                            <td colSpan={onEditar ? COLUMNAS : COLUMNAS - 1}>
                                                <DetalleSalida detalles={salida.detalles} nombreCamara={nombreCamara} />
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

export default SalidasTable;
