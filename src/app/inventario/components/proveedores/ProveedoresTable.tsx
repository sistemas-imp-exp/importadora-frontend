import type { Proveedor } from "../../interfaces/proveedores/Proveedor";
import TablaResponsive from "../../../../shared/components/TablaResponsive";

interface ProveedoresTableProps {
    proveedores: Proveedor[];
    onEditar: (proveedor: Proveedor) => void;
}

function ProveedoresTable({ proveedores, onEditar }: ProveedoresTableProps) {
    return (
        <TablaResponsive alturaMaxima="70vh">
            <table className="table tabla-datos">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th className="text-center">Estado</th>
                        <th className="text-end">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {proveedores.length === 0 ? (
                        <tr>
                            <td colSpan={3} className="text-center text-body-secondary py-5">
                                No hay proveedores registrados.
                            </td>
                        </tr>
                    ) : (
                        proveedores.map((proveedor) => (
                            <tr key={proveedor.id} className="fila-principal">
                                <td className="text-wrap">{proveedor.nombre}</td>
                                <td className="text-wrap text-center">
                                    {proveedor.activo ? (
                                        <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle">Activo</span>
                                    ) : (
                                        <span className="badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle">Inactivo</span>
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
        </TablaResponsive>
    );
}

export default ProveedoresTable;
