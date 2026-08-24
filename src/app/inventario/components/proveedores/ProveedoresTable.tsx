import type { Proveedor } from "../../interfaces/proveedores/Proveedor";

interface ProveedoresTableProps {
    proveedores: Proveedor[];
    onEditar: (proveedor: Proveedor) => void;
}

function ProveedoresTable({ proveedores, onEditar }: ProveedoresTableProps) {
    return (
        <div className="table-responsive">
            <table className="table table-striped mb-0">
                <thead>
                    <tr>
                        <th className="text-wrap">Nombre</th>
                        <th className="text-wrap text-center">Estado</th>
                        <th className="text-wrap text-end">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {proveedores.length === 0 ? (
                        <tr>
                            <td colSpan={3} className="text-center text-muted py-4">
                                No hay proveedores registrados.
                            </td>
                        </tr>
                    ) : (
                        proveedores.map((proveedor) => (
                            <tr key={proveedor.id}>
                                <td className="text-wrap">{proveedor.nombre}</td>
                                <td className="text-wrap text-center">
                                    {proveedor.activo ? (
                                        <span className="badge text-bg-success">Activo</span>
                                    ) : (
                                        <span className="badge text-bg-secondary">Inactivo</span>
                                    )}
                                </td>
                                <td>
                                    <div className="text-end">
                                        <button
                                            className="btn btn-outline-secondary btn-sm"
                                            type="button"
                                            title="Editar proveedor"
                                            onClick={() => onEditar(proveedor)}
                                        >
                                            <i className="bi bi-pencil" aria-hidden="true"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default ProveedoresTable;
