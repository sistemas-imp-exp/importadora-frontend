import type { EntradaApi } from "../../interfaces/entradas/Entrada";

interface EntradasTableProps {
    entradas: EntradaApi[];
}

function EntradasTable({ entradas }: EntradasTableProps) {
    return (
        <div className="table-responsive">
            <table className="table table-striped mb-0">
                <thead>
                    <tr>
                        <th className="text-wrap">Fecha</th>
                        <th className="text-wrap">Proveedor</th>
                        <th className="text-wrap">Factura</th>
                        <th className="text-wrap text-center">Líneas</th>
                    </tr>
                </thead>
                <tbody>
                    {entradas.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="text-center text-muted py-4">
                                No hay entradas registradas.
                            </td>
                        </tr>
                    ) : (
                        entradas.map((entrada) => (
                            <tr key={entrada.id}>
                                <td className="text-wrap">{entrada.fecha}</td>
                                <td className="text-wrap">{entrada.proveedor.nombre}</td>
                                <td className="text-wrap">{entrada.factura || "—"}</td>
                                <td className="text-wrap text-center">{entrada.detalles.length}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default EntradasTable;
