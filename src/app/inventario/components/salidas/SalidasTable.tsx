import { referenciaSalida, type SalidaApi, type SalidaDetalleApi } from "../../interfaces/salidas/Salida";
import type { Camara } from "../../interfaces/camaras/Camara";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import { formatearDinero } from "../../utils/existencias";
import TablaResponsive from "../../../../shared/components/TablaResponsive";
import type { DensidadTabla } from "../../../../shared/hooks/useDensidadTabla";
import BotonAccionFila from "../../../../shared/components/tabla/BotonAccionFila";
import { formatearKg, formatearPrecioKg } from "../../../../shared/utils/numeros";

interface SalidasTableProps {
    salidas: SalidaApi[];
    camaras: Camara[];
    densidad: DensidadTabla;
    onEditar?: (salida: SalidaApi) => void;
    onEliminar?: (salida: SalidaApi) => void;
}

const COLUMNAS = 16;

function numero(valor: number | string): string {
    return formatearDinero(Number(valor));
}

/** Marcas de la salida que el Excel no tiene: resguardo, retiro y diferencia de Cartera. */
function Marcas({ salida, d }: { salida: SalidaApi; d: SalidaDetalleApi }) {
    return (
        <>
            {salida.es_resguardo && (
                <span className="badge border bg-warning-subtle text-warning-emphasis border-warning-subtle fw-normal ms-1"
                    title="Venta en resguardo: el producto se queda guardado y se entrega con retiros">
                    En resguardo
                </span>
            )}
            {salida.folio_retiro && (
                <span className="badge border bg-info-subtle text-info-emphasis border-info-subtle fw-normal ms-1"
                    title={salida.venta_resguardo ? `Entrega del resguardo de la venta ${salida.venta_resguardo.referencia}` : undefined}>
                    {salida.folio_retiro}
                </span>
            )}
            {d.aviso_cartera && (
                <span className="badge border bg-danger-subtle text-danger-emphasis border-danger-subtle fw-normal ms-1"
                    title={`Cartera (${d.aviso_cartera.usuario}): ${d.aviso_cartera.comentario}`}>
                    <i className="bi bi-exclamation-triangle" aria-hidden="true"></i> Cartera
                </span>
            )}
        </>
    );
}

/**
 * Igual que la hoja SALIDA del inventario de cámaras del área: una fila por
 * línea con todos sus datos (fecha, talla, tipo, peso por caja, proveedor,
 * cámara, lote, folio, cliente, notas, cajas, kilos, precio, venta y factura),
 * en el mismo orden y con renglones rayados. Sin desplegar.
 */
function SalidasTable({ salidas, camaras, densidad, onEditar, onEliminar }: SalidasTableProps) {
    function nombreCamara(id: number | null): string {
        if (!id) return "—";
        return camaras.find((c) => c.id === id)?.nombre ?? "—";
    }

    // Los movimientos entre cámaras también crean una Salida (la mitad "salida"),
    // pero sin cliente real — no pertenecen a esta lista de ventas.
    const reales = salidas.filter((s) => s.cliente !== null);
    const columnas = onEditar ? COLUMNAS : COLUMNAS - 1;

    return (
        <TablaResponsive alturaMaxima="70vh">
            <table className={`table tabla-datos tabla-excel ${densidad === "compacta" ? "densidad-compacta" : ""}`}>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Talla</th>
                        <th>Tipo</th>
                        <th>Peso por caja</th>
                        <th>Proveedor</th>
                        <th>Cámara</th>
                        <th>Lote</th>
                        <th>Folio de salida</th>
                        <th>Cliente</th>
                        <th>Notas</th>
                        <th className="num">Cantidad de cajas</th>
                        <th className="num">Total de kilos</th>
                        <th className="num">Precio x kilo</th>
                        <th className="num">Total de ventas</th>
                        <th>Factura</th>
                        {onEditar && <th className="fija-der text-end">Acciones</th>}
                    </tr>
                </thead>
                <tbody>
                    {reales.length === 0 ? (
                        <tr>
                            <td colSpan={columnas} className="text-center text-body-secondary py-5">
                                <i className="bi bi-inbox fs-3 d-block mb-2" aria-hidden="true"></i>
                                No hay salidas registradas.
                            </td>
                        </tr>
                    ) : (
                        reales.flatMap((salida) => {
                            // Un retiro de resguardo se registra y cancela desde Resguardos; una venta
                            // cuyo resguardo ya se empezó a entregar no se puede eliminar.
                            const conRetiros = salida.detalles.some((d) => Number(d.kilos_retirados) > 0);
                            const bloqueoEditar = salida.folio_retiro ? "Es un retiro de resguardo: se maneja desde Resguardos." : undefined;
                            const bloqueoEliminar = bloqueoEditar
                                ?? (conRetiros ? "Ya se entregó parte de su resguardo: cancela esos retiros en Resguardos." : undefined);
                            const fecha = formatearFechaNumerica(new Date(salida.fecha + "T00:00:00"));
                            const folio = salida.folio_de_salida ?? "Sin salida";
                            return salida.detalles.map((d) => (
                                <tr key={d.id}>
                                    <td className="text-nowrap">{fecha}</td>
                                    <td className="text-nowrap">{d.producto.talla}</td>
                                    <td className="text-nowrap">{d.producto.tipo}</td>
                                    <td className="text-nowrap">{d.peso_por_caja ? `${formatearKg(d.peso_por_caja)} KG` : "—"}</td>
                                    <td className="truncar" title={d.proveedor_nombre || undefined}>{d.proveedor_nombre || "—"}</td>
                                    <td className="text-nowrap">{nombreCamara(d.camara)}</td>
                                    <td className="text-nowrap">{d.lote_proveedor || "—"}</td>
                                    <td className="text-nowrap fw-semibold">
                                        {folio}
                                        <Marcas salida={salida} d={d} />
                                    </td>
                                    <td className="truncar" title={salida.cliente!.nombre}>{salida.cliente!.nombre}</td>
                                    <td className="truncar" title={[salida.notas, d.notas].filter(Boolean).join(" · ") || undefined}>
                                        {salida.notas}
                                        {d.notas && <span className="text-body-secondary">{salida.notas ? " · " : ""}{d.notas}</span>}
                                    </td>
                                    <td className="num">{d.cajas.toLocaleString("es-MX")}</td>
                                    <td className="num">{formatearKg(d.total_kilos)}</td>
                                    <td className="num">{d.precio_x_kilo && Number(d.precio_x_kilo) > 0 ? formatearPrecioKg(d.precio_x_kilo) : ""}</td>
                                    <td className="num">
                                        {salida.folio_retiro ? (
                                            <span className="text-body-secondary" title="Producto ya cobrado en la venta original">Ya cobrado</span>
                                        ) : d.total_venta && Number(d.total_venta) > 0 ? `$${numero(d.total_venta)}` : ""}
                                    </td>
                                    <td className="text-nowrap">{d.factura_proveedor}</td>
                                    {onEditar && onEliminar && (
                                        <td className="fija-der text-end text-nowrap">
                                            <BotonAccionFila
                                                icono="bi-pencil"
                                                etiqueta={`Editar salida ${referenciaSalida(salida)}`}
                                                motivoBloqueo={bloqueoEditar}
                                                onClick={() => onEditar?.(salida)}
                                            />{" "}
                                            <BotonAccionFila
                                                icono="bi-trash"
                                                etiqueta={`Eliminar salida ${referenciaSalida(salida)}`}
                                                variante="danger"
                                                motivoBloqueo={bloqueoEliminar}
                                                onClick={() => onEliminar?.(salida)}
                                            />
                                        </td>
                                    )}
                                </tr>
                            ));
                        })
                    )}
                </tbody>
            </table>
        </TablaResponsive>
    );
}

export default SalidasTable;
