import type { EntradaApi } from "../../interfaces/entradas/Entrada";
import type { Camara } from "../../interfaces/camaras/Camara";

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

    return (
        <div className="table-responsive">
            <table className="table table-striped table-sm mb-0">
                <thead>
                    <tr>
                        <th className="text-wrap">Fecha</th>
                        <th className="text-wrap">Proveedor</th>
                        <th className="text-wrap">Factura</th>
                        <th className="text-wrap">Talla</th>
                        <th className="text-wrap">Tipo</th>
                        <th className="text-wrap">Lote proveedor</th>
                        <th className="text-wrap">Recibo ingreso</th>
                        <th className="text-wrap">Cámara</th>
                        <th className="text-wrap text-end">Cajas</th>
                        <th className="text-wrap text-end">Kg/caja</th>
                        <th className="text-wrap text-end">Total kilos</th>
                        <th className="text-wrap text-end">Costo/kg</th>
                        <th className="text-wrap">Observaciones</th>
                        <th className="text-wrap text-end">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {reales.length === 0 ? (
                        <tr>
                            <td colSpan={14} className="text-center text-muted py-4">
                                No hay entradas registradas.
                            </td>
                        </tr>
                    ) : (
                        reales.map((entrada) =>
                            entrada.detalles.map((detalle, index) => (
                                <tr key={detalle.id}>
                                    {index === 0 && (
                                        <>
                                            <td className="text-wrap" rowSpan={entrada.detalles.length}>{entrada.fecha}</td>
                                            <td className="text-wrap" rowSpan={entrada.detalles.length}>{entrada.proveedor!.nombre}</td>
                                            <td className="text-wrap" rowSpan={entrada.detalles.length}>{entrada.factura || "—"}</td>
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
                                    <td className="text-wrap">{detalle.observaciones || "—"}</td>
                                    {index === 0 && (
                                        <td rowSpan={entrada.detalles.length}>
                                            <div className="text-end text-nowrap">
                                                <div className="btn-group btn-group-sm">
                                                    <button
                                                        className="btn btn-outline-secondary"
                                                        type="button"
                                                        title="Editar entrada"
                                                        onClick={() => onEditar(entrada)}
                                                    >
                                                        <i className="bi bi-pencil" aria-hidden="true"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-secondary"
                                                        type="button"
                                                        title="Eliminar entrada"
                                                        onClick={() => onEliminar(entrada)}
                                                    >
                                                        <i className="bi bi-trash" aria-hidden="true"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
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

export default EntradasTable;
