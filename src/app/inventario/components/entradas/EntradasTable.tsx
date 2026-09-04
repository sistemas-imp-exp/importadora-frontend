import type { EntradaApi } from "../../interfaces/entradas/Entrada";
import type { Camara } from "../../interfaces/camaras/Camara";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import { clasificarNivelCaducidad, diasRestantesHasta, CLASE_FILA_NIVEL, ETIQUETA_NIVEL } from "../../utils/caducidad";
import TablaResponsive from "../../../../shared/components/TablaResponsive";

interface EntradasTableProps {
    entradas: EntradaApi[];
    camaras: Camara[];
    onEditar: (entrada: EntradaApi) => void;
    onEliminar: (entrada: EntradaApi) => void;
}

function EntradasTable({ entradas, camaras, onEditar, onEliminar }: EntradasTableProps) {
    function nombreCamara(id: number | null): string {
        if (!id) return "Venta directa";
        return camaras.find((c) => c.id === id)?.nombre ?? "—";
    }

    // Los movimientos entre cámaras también crean una Entrada (la mitad "llegada"),
    // pero sin proveedor real — no pertenecen a esta lista de compras.
    const reales = entradas.filter((e) => e.proveedor !== null);

    // Una línea con menos cajas disponibles que capturadas ya fue vendida o
    // movida a otra cámara. El backend rechaza editar/eliminar esas entradas
    // (ver inventario/auditoria.py); esto solo evita el viaje al servidor.
    // Se calcula aquí y no en el API para no meter una consulta por entrada.
    function tieneSalidas(entrada: EntradaApi): boolean {
        return entrada.detalles.some((d) => d.cajas_disponibles < d.cajas);
    }

    return (
        <TablaResponsive>
            <table className="table table-striped table-sm mb-0">
                <thead>
                    <tr>
                        <th className="text-wrap">Fecha</th>
                        <th className="text-wrap">Tipo</th>
                        <th className="text-wrap">Proveedor</th>
                        <th className="text-wrap">Factura</th>
                        <th className="text-wrap">Pedimento</th>
                        <th className="text-wrap">Talla</th>
                        <th className="text-wrap">Tipo</th>
                        <th className="text-wrap">Lote proveedor</th>
                        <th className="text-wrap">Recibo ingreso</th>
                        <th className="text-wrap">Cámara</th>
                        <th className="text-wrap text-end">Cajas</th>
                        <th className="text-wrap text-end">Kg/caja</th>
                        <th className="text-wrap text-end">Total kilos</th>
                        <th className="text-wrap text-end">Costo/kg</th>
                        <th className="text-wrap">Caducidad</th>
                        <th className="text-wrap">Observaciones</th>
                        <th className="text-wrap text-end">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {reales.length === 0 ? (
                        <tr>
                            <td colSpan={17} className="text-center text-muted py-4">
                                No hay entradas registradas.
                            </td>
                        </tr>
                    ) : (
                        reales.map((entrada) =>
                            entrada.detalles.map((detalle, index) => {
                                const nivel = detalle.fecha_caducidad
                                    ? clasificarNivelCaducidad(diasRestantesHasta(detalle.fecha_caducidad))
                                    : null;
                                return (
                                <tr key={detalle.id} className={nivel ? CLASE_FILA_NIVEL[nivel] : undefined}>
                                    {index === 0 && (
                                        <>
                                            <td className="text-wrap" rowSpan={entrada.detalles.length}>
                                                {formatearFechaNumerica(new Date(entrada.fecha + "T00:00:00"))}
                                            </td>
                                            <td className="text-wrap" rowSpan={entrada.detalles.length}>
                                                <span className={`badge ${entrada.es_internacional ? "text-bg-info" : "text-bg-secondary"}`}>
                                                    {entrada.es_internacional ? "Internacional" : "Nacional"}
                                                </span>
                                            </td>
                                            <td className="text-wrap" rowSpan={entrada.detalles.length}>{entrada.proveedor!.nombre}</td>
                                            <td className="text-wrap" rowSpan={entrada.detalles.length}>
                                                {entrada.factura || "—"}
                                                {entrada.editado && (
                                                    <span
                                                        className="badge bg-warning text-dark ms-2 text-decoration-none"
                                                        title="Esta entrada fue modificada después de registrarse. El detalle está en Auditoría de entradas."
                                                    >
                                                        Editado
                                                    </span>
                                                )}
                                            </td>
                                            <td className="text-wrap" rowSpan={entrada.detalles.length}>{entrada.pedimento || "—"}</td>
                                        </>
                                    )}
                                    <td className="text-wrap">{detalle.producto.talla}</td>
                                    <td className="text-wrap">{detalle.producto.tipo}</td>
                                    <td className="text-wrap">{detalle.lote_proveedor}</td>
                                    <td className="text-wrap">{detalle.lote_general_codigo ?? "—"}</td>
                                    <td className="text-wrap">{nombreCamara(detalle.camara)}</td>
                                    <td className="text-end">{detalle.cajas}</td>
                                    <td className="text-end">{detalle.peso_por_caja ?? "—"}</td>
                                    <td className="text-end">{detalle.total_kilos}</td>
                                    <td className="text-end">{detalle.costo_por_kilo ?? "—"}</td>
                                    <td className="text-wrap">
                                        {detalle.fecha_caducidad ? (
                                            <>
                                                {formatearFechaNumerica(new Date(detalle.fecha_caducidad + "T00:00:00"))}
                                                {nivel && <span className="badge text-bg-light border ms-1">{ETIQUETA_NIVEL[nivel]}</span>}
                                            </>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                    <td className="text-wrap">{detalle.observaciones || "—"}</td>
                                    {index === 0 && (
                                        <td rowSpan={entrada.detalles.length}>
                                            <div className="text-end text-nowrap">
                                                {tieneSalidas(entrada) && (
                                                    <div className="small text-body-secondary mb-1">
                                                        <i className="bi bi-lock-fill me-1" aria-hidden="true"></i>
                                                        Con salidas
                                                    </div>
                                                )}
                                                <div className="btn-group btn-group-sm">
                                                    <button
                                                        className="btn btn-outline-secondary"
                                                        type="button"
                                                        title={
                                                            tieneSalidas(entrada)
                                                                ? "Ya tiene salidas: solo un superusuario puede corregirla desde Auditoría de entradas"
                                                                : "Editar entrada"
                                                        }
                                                        disabled={tieneSalidas(entrada)}
                                                        onClick={() => onEditar(entrada)}
                                                    >
                                                        <i className="bi bi-pencil" aria-hidden="true"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-secondary"
                                                        type="button"
                                                        title={
                                                            tieneSalidas(entrada)
                                                                ? "No se puede eliminar: ya tiene salidas registradas"
                                                                : "Eliminar entrada"
                                                        }
                                                        disabled={tieneSalidas(entrada)}
                                                        onClick={() => onEliminar(entrada)}
                                                    >
                                                        <i className="bi bi-trash" aria-hidden="true"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                                );
                            })
                        )
                    )}
                </tbody>
            </table>
        </TablaResponsive>
    );
}

export default EntradasTable;
