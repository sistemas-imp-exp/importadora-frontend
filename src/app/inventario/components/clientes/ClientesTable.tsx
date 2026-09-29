import type { Cliente } from "../../interfaces/clientes/Cliente";
import TablaResponsive from "../../../../shared/components/TablaResponsive";

interface ClientesTableProps {
    clientes: Cliente[];
    onEditar?: (cliente: Cliente) => void;
}

function ClientesTable({ clientes, onEditar }: ClientesTableProps) {
    return (
        <TablaResponsive alturaMaxima="70vh">
            <table className="table tabla-datos">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th className="text-center">Estado</th>
                        {onEditar && <th className="text-end">Acciones</th>}
                    </tr>
                </thead>
                <tbody>
                    {clientes.length === 0 ? (
                        <tr>
                            <td colSpan={onEditar ? 3 : 2} className="text-center text-body-secondary py-5">
                                No hay clientes registrados.
                            </td>
                        </tr>
                    ) : (
                        clientes.map((cliente) => (
                            <tr key={cliente.id} className="fila-principal">
                                <td className="text-wrap">{cliente.nombre}</td>
                                <td className="text-wrap text-center">
                                    {cliente.activo ? (
                                        <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle">Activo</span>
                                    ) : (
                                        <span className="badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle">Inactivo</span>
                                    )}
                                </td>
                                {onEditar && (
                                    <td>
                                        <div className="text-end">
                                            <button
                                                className="btn btn-outline-secondary btn-sm"
                                                type="button"
                                                title="Editar cliente"
                                                onClick={() => onEditar(cliente)}
                                            >
                                                <i className="bi bi-pencil" aria-hidden="true"></i>
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </TablaResponsive>
    );
}

export default ClientesTable;
