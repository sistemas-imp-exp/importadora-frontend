import type { Camara } from "../../interfaces/camaras/Camara";
import type { Empresa } from "../../interfaces/empresas/Empresa";

interface CamarasTableProps {
    camaras: Camara[];
    empresas: Empresa[];
    onEditar: (camara: Camara) => void;
}

function CamarasTable({ camaras, empresas, onEditar }: CamarasTableProps) {
    function nombreEmpresa(id: number | null): string {
        if (!id) return "—";
        return empresas.find((e) => e.id === id)?.nombre ?? "—";
    }

    return (
        <div className="table-responsive">
            <table className="table table-striped mb-0">
                <thead>
                    <tr>
                        <th className="text-wrap">Nombre</th>
                        <th className="text-wrap">Ubicación</th>
                        <th className="text-wrap">Tipo</th>
                        <th className="text-wrap">Empresa</th>
                        <th className="text-wrap text-center">Estado</th>
                        <th className="text-wrap text-end">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {camaras.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="text-center text-muted py-4">
                                No hay cámaras registradas.
                            </td>
                        </tr>
                    ) : (
                        camaras.map((camara) => (
                            <tr key={camara.id}>
                                <td className="text-wrap">{camara.nombre}</td>
                                <td className="text-wrap">{camara.ubicacion || "—"}</td>
                                <td className="text-wrap">{camara.tipo === "propia" ? "Propia" : "Rentada de tercero"}</td>
                                <td className="text-wrap">{nombreEmpresa(camara.empresa)}</td>
                                <td className="text-wrap text-center">
                                    {camara.activo ? (
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
                                            title="Editar cámara"
                                            onClick={() => onEditar(camara)}
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

export default CamarasTable;
