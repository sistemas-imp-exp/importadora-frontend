import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Divisa } from "../../interfaces/divisas/Divisa";
import { useAuth } from "../../../../shared/hooks/useAuth";
import BuscadorTabla from "../../../../shared/components/BuscadorTabla";
import Paginacion from "../../../../shared/components/Paginacion";
import { usePaginacion } from "../../../../shared/hooks/usePaginacion";

interface DivisasTableProps {
    divisas: Divisa[];
    onEditar: (divisa: Divisa) => void;
    onDelete: (divisa: Divisa) => void;
}

type FiltroEstado = "todas" | "activas" | "inactivas";

const POR_PAGINA = 10;

function DivisasTable({ divisas, onEditar, onDelete }: DivisasTableProps) {
    const { user } = useAuth();
    const esSuperusuario = !!user?.is_superuser;

    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todas");

    const filtradas = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();

        return divisas.filter((d) => {
            if (filtroEstado === "activas" && !d.activa) return false;
            if (filtroEstado === "inactivas" && d.activa) return false;
            if (!termino) return true;

            return (
                d.codigo.toLowerCase().includes(termino) ||
                d.nombre.toLowerCase().includes(termino)
            );
        });
    }, [divisas, busqueda, filtroEstado]);

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
                    <option value="todas">Todos los estados</option>
                    <option value="activas">Solo activas</option>
                    <option value="inactivas">Solo inactivas</option>
                </select>
            </div>

            <div className="table-responsive">
                <table className="table table-striped mb-0">
                    <thead>
                        <tr>
                            <th className="text-wrap">Código</th>
                            <th className="text-wrap">Nombre</th>
                            <th className="text-wrap">Simbolo</th>
                            <th className="text-wrap text-center">Estado</th>
                            <th className="text-wrap text-end">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginadas.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center text-muted py-4">
                                    {divisas.length === 0
                                        ? "No hay divisas registradas."
                                        : "Ninguna divisa coincide con la búsqueda."}
                                </td>
                            </tr>
                        ) : (
                            paginadas.map((divisa) => (
                                <tr key={divisa.id}>
                                    <td className="text-wrap">{divisa.codigo}</td>
                                    <td className="text-wrap">{divisa.nombre}</td>
                                    <td className="text-wrap">{divisa.simbolo}</td>
                                    <td className="text-wrap text-center">
                                        {divisa.activa ?
                                            <span className="badge text-bg-success">
                                                Activo
                                            </span>
                                            :
                                            <span className="badge text-bg-secondary">
                                                Inactivo
                                            </span>
                                        }
                                    </td>
                                    <td>
                                        <div className="text-end">
                                            <div className="btn-group btn-group-sm">
                                                <Link className="btn btn-outline-secondary" to={`/tesoreria/divisas/${divisa.id}`} title="Ver denominaciones">
                                                    <i className="bi bi-cash-stack" aria-hidden="true"></i>
                                                </Link>
                                                <button className="btn btn-outline-secondary" type="button" title="Editar divisa"
                                                onClick={() => onEditar(divisa)}>
                                                    <i className="bi bi-pencil" aria-hidden="true"></i>
                                                </button>
                                                {esSuperusuario && (
                                                    <button className="btn btn-outline-secondary" type="button" title="Eliminar divisa"
                                                    onClick={() => onDelete(divisa)}>
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
                    {filtradas.length !== divisas.length && ` (${divisas.length} en total)`}
                </small>
                <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
            </div>
        </>
    )
}

export default DivisasTable;
