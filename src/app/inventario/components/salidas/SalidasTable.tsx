import type { SalidaApi } from "../../interfaces/salidas/Salida";
import type { Camara } from "../../interfaces/camaras/Camara";
import type { EntradaApi } from "../../interfaces/entradas/Entrada";

interface SalidasTableProps {
    salidas: SalidaApi[];
    camaras: Camara[];
    entradas: EntradaApi[];
    onEditar: (salida: SalidaApi) => void;
    onEliminar: (salida: SalidaApi) => void;
}

function SalidasTable({ salidas, camaras, entradas, onEditar, onEliminar }: SalidasTableProps) {
    function nombreCamara(id: number | null): string {
        if (!id) return "—";
        return camaras.find((c) => c.id === id)?.nombre ?? "—";
    }

    function loteProveedor(entradaDetalleId: number): string {
        for (const entrada of entradas) {
            const detalle = entrada.detalles.find((d) => d.id === entradaDetalleId);
            if (detalle) return detalle.lote_proveedor;
        }
        return "—";
    }

    function proveedorDelLote(entradaDetalleId: number): string {
        for (const entrada of entradas) {
            if (entrada.detalles.some((d) => d.id === entradaDetalleId)) {
                return entrada.proveedor?.nombre ?? "—";
            }
        }
        return "—";
    }

    // Los movimientos entre cámaras también crean una Salida (la mitad "salida"),
    // pero sin cliente real — no pertenecen a esta lista de ventas.
    const reales = salidas.filter((s) => s.cliente !== null);

    return (
        <div className="table-responsive">
            <table className="table table-striped table-sm mb-0">
                <thead>
                    <tr>
                        <th className="text-wrap">Fecha</th>
                        <th className="text-wrap">Folio</th>
                        <th className="text-wrap">Cliente</th>
                        <th className="text-wrap">Talla</th>
                        <th className="text-wrap">Tipo</th>
                        <th className="text-wrap">Lote origen</th>
                        <th className="text-wrap">Proveedor</th>
                        <th className="text-wrap">Cámara</th>
                        <th className="text-wrap text-end">Cajas</th>
                        <th className="text-wrap text-end">Total kilos</th>
                        <th className="text-wrap text-end">Precio/kg</th>
                        <th className="text-wrap text-end">Total venta</th>
                        <th className="text-wrap">Factura proveedor</th>
                        <th className="text-wrap">Notas</th>
                        <th className="text-wrap text-end">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {reales.length === 0 ? (
                        <tr>
                            <td colSpan={15} className="text-center text-muted py-4">
                                No hay salidas registradas.
                            </td>
                        </tr>
                    ) : (
                        reales.map((salida) =>
                            salida.detalles.map((detalle, index) => (
                                <tr key={detalle.id}>
                                    {index === 0 && (
                                        <>
                                            <td className="text-wrap" rowSpan={salida.detalles.length}>{salida.fecha}</td>
                                            <td className="text-wrap" rowSpan={salida.detalles.length}>{salida.folio_de_salida}</td>
                                            <td className="text-wrap" rowSpan={salida.detalles.length}>{salida.cliente!.nombre}</td>
                                        </>
                                    )}
                                    <td className="text-wrap">{detalle.producto.talla}</td>
                                    <td className="text-wrap">{detalle.producto.tipo}</td>
                                    <td className="text-wrap">{loteProveedor(detalle.entrada_detalle)}</td>
                                    <td className="text-wrap">{proveedorDelLote(detalle.entrada_detalle)}</td>
                                    <td className="text-wrap">{nombreCamara(detalle.camara)}</td>
                                    <td className="text-end">{detalle.cajas}</td>
                                    <td className="text-end">{detalle.total_kilos}</td>
                                    <td className="text-end">{detalle.precio_x_kilo ?? "—"}</td>
                                    <td className="text-end">{detalle.total_venta ?? "—"}</td>
                                    <td className="text-wrap">{detalle.factura_proveedor || "—"}</td>
                                    {index === 0 && (
                                        <>
                                            <td className="text-wrap" rowSpan={salida.detalles.length}>{salida.notas || "—"}</td>
                                            <td rowSpan={salida.detalles.length}>
                                                <div className="text-end text-nowrap">
                                                    <div className="btn-group btn-group-sm">
                                                        <button
                                                            className="btn btn-outline-secondary"
                                                            type="button"
                                                            title="Editar salida"
                                                            onClick={() => onEditar(salida)}
                                                        >
                                                            <i className="bi bi-pencil" aria-hidden="true"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-outline-secondary"
                                                            type="button"
                                                            title="Eliminar salida"
                                                            onClick={() => onEliminar(salida)}
                                                        >
                                                            <i className="bi bi-trash" aria-hidden="true"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))
                        )
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default SalidasTable;
