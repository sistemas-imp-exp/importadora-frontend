import { useMemo, useState } from "react";
import type { Rancho } from "../../interfaces/nomina/Rancho";
import { useAuth } from "../../../../shared/hooks/useAuth";
import BuscadorTabla from "../../../../shared/components/BuscadorTabla";
import Paginacion from "../../../../shared/components/Paginacion";
import { usePaginacion } from "../../../../shared/hooks/usePaginacion";

interface RanchosTableProps {
    ranchos: Rancho[];
    onEditar: (rancho: Rancho) => void;
    onDelete: (rancho: Rancho) => void;
}

type FiltroEstado = "todos" | "activos" | "inactivos";

const POR_PAGINA = 10;

function RanchosTable({ ranchos, onEditar, onDelete }: RanchosTableProps) {
    const { user } = useAuth();
    const esSuperusuario = !!user?.is_superuser;

    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");

    const filtrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();

        return ranchos.filter((r) => {
            if (filtroEstado === "activos" && !r.activo) return false;
            if (filtroEstado === "inactivos" && r.activo) return false;
            if (!termino) return true;

            return r.nombre.toLowerCase().includes(termino);
        });
    }, [ranchos, busqueda, filtroEstado]);

    const { pagina, setPagina, totalPaginas, inicio, fin } = usePaginacion(
        filtrados.length,
        POR_PAGINA,
        `${busqueda}|${filtroEstado}`
    );
    const paginados = filtrados.slice(inicio, fin);

    return (
        <>
            <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center p-3 border-bottom">
                <BuscadorTabla valor={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre..." />
                <select
                    className="form-select form-select-sm"
                    style={{ width: "auto" }}
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
                >
                    <option value="todos">Todos los estados</option>
                    <option value="activos">Solo activos</option>
                    <option value="inactivos">Solo inactivos</option>
                </select>
            </div>

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
                        {paginados.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="text-center text-muted py-4">
                                    {ranchos.length === 0
                                        ? "No hay ranchos registrados."
                                        : "Ningún rancho coincide con la búsqueda."}
                                </td>
                            </tr>
                        ) : (
                            paginados.map((rancho) => (
                                <tr key={rancho.id}>
                                    <td className="text-wrap">{rancho.nombre}</td>
                                    <td className="text-wrap text-center">
                                        {rancho.activo ? (
                                            <span className="badge text-bg-success">Activo</span>
                                        ) : (
                                            <span className="badge text-bg-secondary">Inactivo</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="text-end">
                                            <div className="btn-group btn-group-sm">
                                                <button
                                                    className="btn btn-outline-secondary"
                                                    type="button"
                                                    title="Editar rancho"
                                                    onClick={() => onEditar(rancho)}
                                                >
                                                    <i className="bi bi-pencil" aria-hidden="true"></i>
                                                </button>
                                                {esSuperusuario && (
                                                    <button
                                                        className="btn btn-outline-secondary"
                                                        type="button"
                                                        title="Eliminar rancho"
                                                        onClick={() => onDelete(rancho)}
                                                    >
                                                        <i className="bi bi-trash" aria-hidden="true"></i>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 p-3 border-top">
                <small className="text-muted">
                    {filtrados.length === 0
                        ? "Sin resultados"
                        : `Mostrando ${inicio + 1}-${Math.min(fin, filtrados.length)} de ${filtrados.length}`}
                    {filtrados.length !== ranchos.length && ` (${ranchos.length} en total)`}
                </small>
                <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
            </div>
        </>
    );
}

export default RanchosTable;
