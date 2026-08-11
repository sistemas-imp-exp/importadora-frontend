import { useMemo, useState } from "react";
import type { Usuario } from "../interfaces/Usuario";
import { useAuth } from "../../../shared/hooks/useAuth";
import BuscadorTabla from "../../../shared/components/BuscadorTabla";
import Paginacion from "../../../shared/components/Paginacion";
import { usePaginacion } from "../../../shared/hooks/usePaginacion";

interface UsuariosTableProps {
    usuarios: Usuario[];
    onEditar: (usuario: Usuario) => void;
    onToggleActivo: (usuario: Usuario) => void;
}

type FiltroEstado = "todos" | "activos" | "inactivos";

const POR_PAGINA = 10;

function UsuariosTable({ usuarios, onEditar, onToggleActivo }: UsuariosTableProps) {
    const { user } = useAuth();

    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");

    const filtrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();

        return usuarios.filter((u) => {
            if (filtroEstado === "activos" && !u.is_active) return false;
            if (filtroEstado === "inactivos" && u.is_active) return false;
            if (!termino) return true;

            return (
                u.username.toLowerCase().includes(termino) ||
                u.first_name.toLowerCase().includes(termino) ||
                u.last_name.toLowerCase().includes(termino) ||
                u.email.toLowerCase().includes(termino)
            );
        });
    }, [usuarios, busqueda, filtroEstado]);

    const { pagina, setPagina, totalPaginas, inicio, fin } = usePaginacion(
        filtrados.length,
        POR_PAGINA,
        `${busqueda}|${filtroEstado}`
    );
    const paginados = filtrados.slice(inicio, fin);

    return (
        <>
            <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center p-3 border-bottom">
                <BuscadorTabla valor={busqueda} onChange={setBusqueda} placeholder="Buscar por usuario, nombre o correo..." />
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
                            <th className="text-wrap">Usuario</th>
                            <th className="text-wrap">Nombre</th>
                            <th className="text-wrap">Áreas</th>
                            <th className="text-wrap text-center">Rol</th>
                            <th className="text-wrap text-center">Estado</th>
                            <th className="text-wrap text-end">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginados.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center text-muted py-4">
                                    {usuarios.length === 0
                                        ? "No hay usuarios registrados."
                                        : "Ningún usuario coincide con la búsqueda."}
                                </td>
                            </tr>
                        ) : (
                            paginados.map((usuario) => {
                                const esUnoMismo = usuario.id === user?.id;

                                return (
                                    <tr key={usuario.id}>
                                        <td className="text-wrap">
                                            <div className="d-flex align-items-center gap-2">
                                                <span
                                                    className="rounded-circle bg-secondary text-white d-inline-flex align-items-center justify-content-center overflow-hidden flex-shrink-0"
                                                    style={{ width: 32, height: 32, fontSize: ".8rem" }}
                                                >
                                                    {usuario.foto ? (
                                                        <img src={usuario.foto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                    ) : (
                                                        (usuario.first_name.charAt(0) || usuario.username.charAt(0)).toUpperCase()
                                                    )}
                                                </span>
                                                {usuario.username}
                                            </div>
                                        </td>
                                        <td className="text-wrap">
                                            {usuario.first_name || usuario.last_name
                                                ? `${usuario.first_name} ${usuario.last_name}`.trim()
                                                : <span className="text-muted">—</span>}
                                        </td>
                                        <td className="text-wrap">
                                            {usuario.areas.length === 0 ? (
                                                <span className="text-muted">—</span>
                                            ) : (
                                                usuario.areas.map((codigo) => (
                                                    <span className="badge text-bg-info me-1" key={codigo}>{codigo}</span>
                                                ))
                                            )}
                                        </td>
                                        <td className="text-wrap text-center">
                                            {usuario.is_superuser ? (
                                                <span className="badge text-bg-primary">Superusuario</span>
                                            ) : (
                                                <span className="badge text-bg-secondary">Usuario</span>
                                            )}
                                        </td>
                                        <td className="text-wrap text-center">
                                            {usuario.is_active ? (
                                                <span className="badge text-bg-success">Activo</span>
                                            ) : (
                                                <span className="badge text-bg-secondary">Inactivo</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="text-end">
                                                <div className="btn-group btn-group-sm">
                                                    <button className="btn btn-outline-secondary" type="button" title="Editar usuario"
                                                        onClick={() => onEditar(usuario)}>
                                                        <i className="bi bi-pencil" aria-hidden="true"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-secondary"
                                                        type="button"
                                                        title={usuario.is_active ? "Desactivar usuario" : "Activar usuario"}
                                                        disabled={esUnoMismo && usuario.is_active}
                                                        onClick={() => onToggleActivo(usuario)}
                                                    >
                                                        <i className={`bi ${usuario.is_active ? "bi-person-dash" : "bi-person-check"}`} aria-hidden="true"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 p-3 border-top">
                <small className="text-muted">
                    {filtrados.length === 0
                        ? "Sin resultados"
                        : `Mostrando ${inicio + 1}-${Math.min(fin, filtrados.length)} de ${filtrados.length}`}
                    {filtrados.length !== usuarios.length && ` (${usuarios.length} en total)`}
                </small>
                <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
            </div>
        </>
    );
}

export default UsuariosTable;
