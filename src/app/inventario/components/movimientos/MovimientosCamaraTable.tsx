import type { MovimientoCamaraApi } from "../../interfaces/movimientos/MovimientoCamara";
import type { EntradaApi } from "../../interfaces/entradas/Entrada";
import type { Camara } from "../../interfaces/camaras/Camara";

interface MovimientosCamaraTableProps {
    movimientos: MovimientoCamaraApi[];
    entradas: EntradaApi[];
    camaras: Camara[];
}

function MovimientosCamaraTable({ movimientos, entradas, camaras }: MovimientosCamaraTableProps) {
    function nombreCamara(id: number): string {
        return camaras.find((c) => c.id === id)?.nombre ?? "—";
    }

    function loteOrigen(entradaDetalleId: number): string {
        for (const entrada of entradas) {
            const detalle = entrada.detalles.find((d) => d.id === entradaDetalleId);
            if (detalle) return `${detalle.producto.talla} ${detalle.producto.tipo} — lote ${detalle.lote_proveedor}`;
        }
        return "—";
    }

    return (
        <div className="table-responsive">
            <table className="table table-striped table-sm mb-0">
                <thead>
                    <tr>
                        <th className="text-wrap">Fecha</th>
                        <th className="text-wrap">Lote</th>
                        <th className="text-wrap">Cámara origen</th>
                        <th className="text-wrap">Cámara destino</th>
                        <th className="text-wrap text-end">Cajas</th>
                    </tr>
                </thead>
                <tbody>
                    {movimientos.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="text-center text-muted py-4">
                                No hay movimientos registrados.
                            </td>
                        </tr>
                    ) : (
                        movimientos.map((movimiento) => (
                            <tr key={movimiento.id}>
                                <td className="text-wrap">{movimiento.fecha}</td>
                                <td className="text-wrap">{loteOrigen(movimiento.entrada_detalle_origen)}</td>
                                <td className="text-wrap">{nombreCamara(movimiento.camara_origen)}</td>
                                <td className="text-wrap">{nombreCamara(movimiento.camara_destino)}</td>
                                <td className="text-end">{movimiento.cajas}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default MovimientosCamaraTable;
