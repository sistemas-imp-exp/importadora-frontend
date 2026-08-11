import { useMemo, useState } from "react";
import type { Empleado } from "../../interfaces/nomina/Empleado";
import { useAuth } from "../../../../shared/hooks/useAuth";
import BuscadorTabla from "../../../../shared/components/BuscadorTabla";
import Paginacion from "../../../../shared/components/Paginacion";
import { usePaginacion } from "../../../../shared/hooks/usePaginacion";

interface EmpleadosTableProps {
    empleados: Empleado[];
    onEditar: (empleado: Empleado) => void;
    onDelete: (empleado: Empleado) => void;
}

type FiltroEstado = "todos" | "activos" | "inactivos";

const POR_PAGINA = 10;

function EmpleadosTable({ empleados, onEditar, onDelete }: EmpleadosTableProps) {
    const { user } = useAuth();
    const esSuperusuario = !!user?.is_superuser;

    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");

    const filtrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();

        return empleados.filter((e) => {
            if (filtroEstado === "activos" && !e.activo) return false;
            if (filtroEstado === "inactivos" && e.activo) return false;
            if (!termino) return true;

            return (
                e.nombre.toLowerCase().includes(termino) ||
                e.rancho.nombre.toLowerCase().includes(termino) ||
                e.puesto.nombre.toLowerCase().includes(termino) ||
                (e.banco?.nombre.toLowerCase().includes(termino) ?? false)
            );
        });
    }, [empleados, busqueda, filtroEstado]);

    const { pagina, setPagina, totalPaginas, inicio, fin } = usePaginacion(
        filtrados.length,
        POR_PAGINA,
        `${busqueda}|${filtroEstado}`
    );
    const paginados = filtrados.slice(inicio, fin);

    return (
        <>
            <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center p-3 border-bottom">
                <BuscadorTabla valor={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre, rancho, puesto o banco..." />
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
                            <th className="text-wrap">Rancho</th>
                            <th className="text-wrap">Puesto</th>
                            <th className="text-wrap text-end">Salario diario</th>
                            <th className="text-wrap">Banco</th>
                            <th className="text-wrap">Número de cuenta</th>
                            <th className="text-wrap text-center">Estado</th>
                            <th className="text-wrap text-end">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginados.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center text-muted py-4">
                                    {empleados.length === 0
                                        ? "No hay empleados registrados."
                                        : "Ningún empleado coincide con la búsqueda."}
                                </td>
                            </tr>
                        ) : (
                            paginados.map((empleado) => (
                                <tr key={empleado.id}>
                                    <td className="text-wrap">{empleado.nombre}</td>
                                    <td className="text-wrap">{empleado.rancho.nombre}</td>
                                    <td className="text-wrap">{empleado.puesto.nombre}</td>
                                    <td className="text-wrap text-end">
                                        {Number(empleado.salario_diario).toLocaleString("es-MX", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </td>
                                    <td className="text-wrap">{empleado.banco?.nombre || "-"}</td>
                                    <td className="text-wrap">{empleado.numero_cuenta || "-"}</td>
                                    <td className="text-wrap text-center">
                                        {empleado.activo ? (
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
                                                    title="Editar empleado"
                                                    onClick={() => onEditar(empleado)}
                                                >
                                                    <i className="bi bi-pencil" aria-hidden="true"></i>
                                                </button>
                                                {esSuperusuario && (
                                                    <button
                                                        className="btn btn-outline-secondary"
                                                        type="button"
                                                        title="Eliminar empleado"
                                                        onClick={() => onDelete(empleado)}
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
                    {filtrados.length !== empleados.length && ` (${empleados.length} en total)`}
                </small>
                <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
            </div>
        </>
    );
}

export default EmpleadosTable;
