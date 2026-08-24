import type { Empresa } from "../../interfaces/empresas/Empresa";

interface EmpresasTableProps {
    empresas: Empresa[];
    onEditar: (empresa: Empresa) => void;
}

function EmpresasTable({ empresas, onEditar }: EmpresasTableProps) {
    return (
        <div className="table-responsive">
            <table className="table table-striped mb-0">
                <thead>
                    <tr>
                        <th className="text-wrap">Nombre</th>
                        <th className="text-wrap text-end">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {empresas.length === 0 ? (
                        <tr>
                            <td colSpan={2} className="text-center text-muted py-4">
                                No hay empresas registradas.
                            </td>
                        </tr>
                    ) : (
                        empresas.map((empresa) => (
                            <tr key={empresa.id}>
                                <td className="text-wrap">{empresa.nombre}</td>
                                <td>
                                    <div className="text-end">
                                        <button
                                            className="btn btn-outline-secondary btn-sm"
                                            type="button"
                                            title="Editar empresa"
                                            onClick={() => onEditar(empresa)}
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

export default EmpresasTable;
