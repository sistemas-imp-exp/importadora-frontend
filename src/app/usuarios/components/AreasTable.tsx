import { useMemo, useState } from "react";
import type { Area } from "../interfaces/Area";
import { useAuth } from "../../../shared/hooks/useAuth";
import BuscadorTabla from "../../../shared/components/BuscadorTabla";
import Paginacion from "../../../shared/components/Paginacion";
import { usePaginacion } from "../../../shared/hooks/usePaginacion";

interface AreasTableProps {
    areas: Area[];
    onEditar: (area: Area) => void;
    onDelete: (area: Area) => void;
}

type FiltroEstado = "todos" | "activos" | "inactivos";

const POR_PAGINA = 10;

function AreasTable({ areas, onEditar, onDelete }: AreasTableProps) {
    const { user } = useAuth();
    const esSuperusuario = !!user?.is_superuser;

    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");

    const filtradas = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();

        return areas.filter((a) => {
            if (filtroEstado === "activos" && !a.activo) return false;
            if (filtroEstado === "inactivos" && a.activo) return false;
            if (!termino) return true;

            return (
                a.codigo.toLowerCase().includes(termino) ||
                a.nombre.toLowerCase().includes(termino)
            );
        });
    }, [areas, busqueda, filtroEstado]);

    const { pagina, setPagina, totalPaginas, inicio, fin } = usePaginacion(
        filtradas.length,
        POR_PAGINA,
        `${busqueda}|${filtroEstado}`
    );
    const paginadas = filtradas.slice(inicio, fin);

    return (
        <>
            <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center p-3 border-bottom">
                <BuscadorTabla valor={busqueda} onChange={setBusqueda} placeholder="Buscar por código o nombre..." />
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
                            <th className="text-wrap">Código</th>
                            <th className="text-wrap">Nombre</th>
                            <th className="text-wrap text-center">Estado</th>
                            <th className="text-wrap text-end">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginadas.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center text-muted py-4">
                                    {areas.length === 0
                                        ? "No hay roles registrados."
                                        : "Ningún rol coincide con la búsqueda."}
                                </td>
                            </tr>
                        ) : (
                            paginadas.map((area) => (
                                <tr key={area.id}>
                                    <td className="text-wrap">{area.codigo}</td>
                                    <td className="text-wrap">{area.nombre}</td>
                                    <td className="text-wrap text-center">
                                        {area.activo ? (
                                            <span className="badge text-bg-success">Activo</span>
                                        ) : (
                                            <span className="badge text-bg-secondary">Inactivo</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="text-end">
                                            <div className="btn-group btn-group-sm">
                                                <button className="btn btn-outline-secondary" type="button" title="Editar rol"
                                                    onClick={() => onEditar(area)}>
                                                    <i className="bi bi-pencil" aria-hidden="true"></i>
                                                </button>
                                                {esSuperusuario && (
                                                    <button className="btn btn-outline-secondary" type="button" title="Eliminar rol"
                                                        onClick={() => onDelete(area)}>
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
                    {filtradas.length === 0
                        ? "Sin resultados"
                        : `Mostrando ${inicio + 1}-${Math.min(fin, filtradas.length)} de ${filtradas.length}`}
                    {filtradas.length !== areas.length && ` (${areas.length} en total)`}
                </small>
                <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
            </div>
        </>
    );
}

export default AreasTable;
