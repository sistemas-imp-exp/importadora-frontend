import type { Empresa } from "../../interfaces/empresas/Empresa";
import TablaResponsive from "../../../../shared/components/TablaResponsive";

interface EmpresasTableProps {
    empresas: Empresa[];
    onEditar: (empresa: Empresa) => void;
}

function EmpresasTable({ empresas, onEditar }: EmpresasTableProps) {
    return (
        <TablaResponsive alturaMaxima="70vh">
            <table className="table tabla-datos">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th className="text-end">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {empresas.length === 0 ? (
                        <tr>
                            <td colSpan={2} className="text-center text-body-secondary py-5">
                                No hay empresas registradas.
                            </td>
                        </tr>
                    ) : (
                        empresas.map((empresa) => (
                            <tr key={empresa.id} className="fila-principal">
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
        </TablaResponsive>
    );
}

export default EmpresasTable;
