import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { CorteCaja } from "../../interfaces/movimientos/CorteCaja";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import { getFullName } from "../../../../shared/utils/userUtils";
import BuscadorTabla from "../../../../shared/components/BuscadorTabla";
import Paginacion from "../../../../shared/components/Paginacion";
import { usePaginacion } from "../../../../shared/hooks/usePaginacion";

interface Props {
    historial: CorteCaja[];
}

type FiltroEstado = "todos" | "abiertos" | "cerrados";

const POR_PAGINA = 10;

function HistorialCortesTable({ historial }: Props) {
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");

    const filtrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();

        return historial.filter((c) => {
            if (filtroEstado === "abiertos" && c.cerrado) return false;
            if (filtroEstado === "cerrados" && !c.cerrado) return false;
            if (!termino) return true;

            const responsableApertura = getFullName(c.responsable_apertura).toLowerCase();
            const responsableCierre = c.responsable_cierre ? getFullName(c.responsable_cierre).toLowerCase() : "";
            const observaciones = (c.observaciones ?? "").toLowerCase();
            const fecha = formatearFechaNumerica(c.fecha).toLowerCase();

            return (
                responsableApertura.includes(termino) ||
                responsableCierre.includes(termino) ||
                observaciones.includes(termino) ||
                fecha.includes(termino)
            );
        });
    }, [historial, busqueda, filtroEstado]);

    const { pagina, setPagina, totalPaginas, inicio, fin } = usePaginacion(
        filtrados.length,
        POR_PAGINA,
        `${busqueda}|${filtroEstado}`
    );
    const paginados = filtrados.slice(inicio, fin);

    return (
        <>
            <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center p-3 border-bottom">
                <BuscadorTabla
                    valor={busqueda}
                    onChange={setBusqueda}
                    placeholder="Buscar por responsable u observaciones..."
                />
                <select
                    className="form-select form-select-sm"
                    style={{ width: "auto" }}
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
                >
                    <option value="todos">Todos los estados</option>
                    <option value="abiertos">Solo abiertos</option>
                    <option value="cerrados">Solo cerrados</option>
                </select>
            </div>

            <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Estado</th>
                            <th>Responsable apertura</th>
                            <th>Responsable cierre</th>
                            <th>Fecha cierre</th>
                            <th className="text-center">Detalle</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginados.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center text-muted py-4">
                                    {historial.length === 0
                                        ? "Aún no se ha abierto ningún corte de caja."
                                        : "Ningún corte coincide con la búsqueda."}
                                </td>
                            </tr>
                        ) : (
                            paginados.map((c) => (
                                <tr key={c.id}>
                                    <td>{formatearFechaNumerica(c.fecha)}</td>
                                    <td>
                                        <span className={`badge ${c.cerrado ? "bg-secondary" : "bg-success"}`}>
                                            {c.cerrado ? "Cerrado" : "Abierto"}
                                        </span>
                                    </td>
                                    <td>{getFullName(c.responsable_apertura)}</td>
                                    <td>{getFullName(c.responsable_cierre)}</td>
                                    <td>{c.fecha_cierre ? formatearFechaNumerica(c.fecha_cierre, "numerico-hora") : "-"}</td>
                                    <td className="text-center">
                                        <Link to={`/tesoreria/caja/corte/${c.id}`} className="btn btn-sm btn-outline-primary">
                                            <i className="bi bi-eye"></i>
                                        </Link>
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
                    {filtrados.length !== historial.length && ` (${historial.length} en total)`}
                </small>
                <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
            </div>
        </>
    );
}

export default HistorialCortesTable;
