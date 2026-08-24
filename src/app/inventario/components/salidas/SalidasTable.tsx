import type { SalidaApi } from "../../interfaces/salidas/Salida";

interface SalidasTableProps {
    salidas: SalidaApi[];
}

function SalidasTable({ salidas }: SalidasTableProps) {
    return (
        <div className="table-responsive">
            <table className="table table-striped mb-0">
                <thead>
                    <tr>
                        <th className="text-wrap">Folio</th>
                        <th className="text-wrap">Cliente</th>
                        <th className="text-wrap">Fecha</th>
                        <th className="text-wrap text-center">Líneas</th>
                    </tr>
                </thead>
                <tbody>
                    {salidas.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="text-center text-muted py-4">
                                No hay salidas registradas.
                            </td>
                        </tr>
                    ) : (
                        salidas.map((salida) => (
                            <tr key={salida.id}>
                                <td className="text-wrap">{salida.folio_de_salida}</td>
                                <td className="text-wrap">{salida.cliente.nombre}</td>
                                <td className="text-wrap">{salida.fecha}</td>
                                <td className="text-wrap text-center">{salida.detalles.length}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default SalidasTable;
