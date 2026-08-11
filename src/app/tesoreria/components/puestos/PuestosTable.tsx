import { useMemo, useState } from "react";
import type { Puesto } from "../../interfaces/nomina/Puesto";
import { useAuth } from "../../../../shared/hooks/useAuth";
import BuscadorTabla from "../../../../shared/components/BuscadorTabla";
import Paginacion from "../../../../shared/components/Paginacion";
import { usePaginacion } from "../../../../shared/hooks/usePaginacion";

interface PuestosTableProps {
    puestos: Puesto[];
    onEditar: (puesto: Puesto) => void;
    onDelete: (puesto: Puesto) => void;
}

type FiltroEstado = "todos" | "activos" | "inactivos";

const POR_PAGINA = 10;

function PuestosTable({ puestos, onEditar, onDelete }: PuestosTableProps) {
    const { user } = useAuth();
    const esSuperusuario = !!user?.is_superuser;

    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");

    const filtrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();

        return puestos.filter((p) => {
            if (filtroEstado === "activos" && !p.activo) return false;
            if (filtroEstado === "inactivos" && p.activo) return false;
            if (!termino) return true;

            return p.nombre.toLowerCase().includes(termino);
        });
    }, [puestos, busqueda, filtroEstado]);

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
                                    {puestos.length === 0
                                        ? "No hay puestos registrados."
                                        : "Ningún puesto coincide con la búsqueda."}
                                </td>
                            </tr>
                        ) : (
                            paginados.map((puesto) => (
                                <tr key={puesto.id}>
                                    <td className="text-wrap">{puesto.nombre}</td>
                                    <td className="text-wrap text-center">
                                        {puesto.activo ? (
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
                                                    title="Editar puesto"
                                                    onClick={() => onEditar(puesto)}
                                                >
                                                    <i className="bi bi-pencil" aria-hidden="true"></i>
                                                </button>
                                                {esSuperusuario && (
                                                    <button
                                                        className="btn btn-outline-secondary"
                                                        type="button"
                                                        title="Eliminar puesto"
                                                        onClick={() => onDelete(puesto)}
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
                    {filtrados.length !== puestos.length && ` (${puestos.length} en total)`}
                </small>
                <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
            </div>
        </>
    );
}

export default PuestosTable;
