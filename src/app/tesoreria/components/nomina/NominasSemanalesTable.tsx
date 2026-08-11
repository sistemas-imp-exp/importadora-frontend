import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { NominaSemanal } from "../../interfaces/nomina/NominaSemanal";
import BuscadorTabla from "../../../../shared/components/BuscadorTabla";
import Paginacion from "../../../../shared/components/Paginacion";
import { usePaginacion } from "../../../../shared/hooks/usePaginacion";

interface NominasSemanalesTableProps {
    nominas: NominaSemanal[];
}

type FiltroEstado = "todas" | "abiertas" | "cerradas";

const POR_PAGINA = 10;

function formatearFecha(fechaISO: string): string {
    const [anio, mes, dia] = fechaISO.split("-");
    return `${dia}/${mes}/${anio}`;
}

function formatearMonto(valor: string): string {
    return `$${Number(valor).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function NominasSemanalesTable({ nominas }: NominasSemanalesTableProps) {
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todas");

    const filtradas = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();

        return nominas.filter((n) => {
            if (filtroEstado === "abiertas" && n.cerrada) return false;
            if (filtroEstado === "cerradas" && !n.cerrada) return false;
            if (!termino) return true;

            return (
                formatearFecha(n.fecha_inicio).includes(termino) ||
                formatearFecha(n.fecha_fin).includes(termino) ||
                n.observaciones.toLowerCase().includes(termino)
            );
        });
    }, [nominas, busqueda, filtroEstado]);

    const { pagina, setPagina, totalPaginas, inicio, fin } = usePaginacion(
        filtradas.length,
        POR_PAGINA,
        `${busqueda}|${filtroEstado}`
    );
    const paginadas = filtradas.slice(inicio, fin);

    return (
        <>
            <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center p-3 border-bottom">
                <BuscadorTabla valor={busqueda} onChange={setBusqueda} placeholder="Buscar por fecha u observaciones..." />
                <select
                    className="form-select form-select-sm"
                    style={{ width: "auto" }}
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
                >
                    <option value="todas">Todos los estados</option>
                    <option value="abiertas">Solo abiertas</option>
                    <option value="cerradas">Solo cerradas</option>
                </select>
            </div>

            <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                    <thead>
                        <tr>
                            <th>Semana</th>
                            <th>Estado</th>
                            <th className="text-end">Total neto</th>
                            <th className="text-center">Detalle</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginadas.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center text-muted py-4">
                                    {nominas.length === 0
                                        ? "No hay nóminas registradas."
                                        : "Ninguna nómina coincide con la búsqueda."}
                                </td>
                            </tr>
                        ) : (
                            paginadas.map((nomina) => (
                                <tr key={nomina.id}>
                                    <td>
                                        {formatearFecha(nomina.fecha_inicio)} - {formatearFecha(nomina.fecha_fin)}
                                    </td>
                                    <td>
                                        <span className={`badge ${nomina.cerrada ? "bg-secondary" : "bg-success"}`}>
                                            {nomina.cerrada ? "Cerrada" : "Abierta"}
                                        </span>
                                    </td>
                                    <td className="text-end">{formatearMonto(nomina.total_neto)}</td>
                                    <td className="text-center">
                                        <Link to={`/tesoreria/nomina/semanal/${nomina.id}`} className="btn btn-sm btn-outline-primary">
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
                    {filtradas.length === 0
                        ? "Sin resultados"
                        : `Mostrando ${inicio + 1}-${Math.min(fin, filtradas.length)} de ${filtradas.length}`}
                    {filtradas.length !== nominas.length && ` (${nominas.length} en total)`}
                </small>
                <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
            </div>
        </>
    );
}

export default NominasSemanalesTable;
