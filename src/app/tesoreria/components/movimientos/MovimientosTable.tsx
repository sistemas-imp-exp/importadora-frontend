import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Movimiento, TipoMovimiento } from "../../interfaces/movimientos/Movimiento";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import BuscadorTabla from "../../../../shared/components/BuscadorTabla";
import Paginacion from "../../../../shared/components/Paginacion";
import { usePaginacion } from "../../../../shared/hooks/usePaginacion";

interface Props {
    movimientos: Movimiento[];
    onEditar?: (movimiento: Movimiento) => void;
    onCancelar?: (movimiento: Movimiento) => void;
    onVerArchivos?: (movimiento: Movimiento) => void;
}

type FiltroTipo = "todos" | TipoMovimiento;
type FiltroEstado = "todos" | "activos" | "cancelados";

const POR_PAGINA = 10;

function MovimientosTable({
    movimientos,
    onEditar,
    onCancelar,
    onVerArchivos,
}: Props) {
    const [busqueda, setBusqueda] = useState("");
    const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
    const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");

    const filtrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();

        return movimientos.filter((m) => {
            if (filtroTipo !== "todos" && m.tipo !== filtroTipo) return false;
            if (filtroEstado === "activos" && m.cancelado) return false;
            if (filtroEstado === "cancelados" && !m.cancelado) return false;
            if (!termino) return true;

            return (
                m.folio.toLowerCase().includes(termino) ||
                m.autorizo.toLowerCase().includes(termino) ||
                m.beneficiario.toLowerCase().includes(termino) ||
                m.concepto.toLowerCase().includes(termino)
            );
        });
    }, [movimientos, busqueda, filtroTipo, filtroEstado]);

    const { pagina, setPagina, totalPaginas, inicio, fin } = usePaginacion(
        filtrados.length,
        POR_PAGINA,
        `${busqueda}|${filtroTipo}|${filtroEstado}`
    );
    const paginados = filtrados.slice(inicio, fin);

    function badgeTipo(tipo: string) {
        switch (tipo) {
            case "I":
                return (
                    <span className="badge bg-success">
                        <i className="bi bi-arrow-up-circle me-1"></i>
                        Ingreso
                    </span>
                );

            case "E":
                return (
                    <span className="badge bg-danger">
                        <i className="bi bi-arrow-down-circle me-1"></i>
                        Egreso
                    </span>
                );

            default:
                return (
                    <span className="badge bg-secondary">
                        <i className="bi bi-question-circle me-1"></i>
                        Desconocido
                    </span>
                );
        }
    }

    return (
        <>
            <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center p-3 border-bottom">
                <BuscadorTabla
                    valor={busqueda}
                    onChange={setBusqueda}
                    placeholder="Buscar por folio, autorizó, beneficiario o concepto..."
                />
                <div className="d-flex flex-wrap gap-2">
                    <select
                        className="form-select form-select-sm"
                        style={{ width: "auto" }}
                        value={filtroTipo}
                        onChange={(e) => setFiltroTipo(e.target.value as FiltroTipo)}
                    >
                        <option value="todos">Todos los tipos</option>
                        <option value="I">Solo ingresos</option>
                        <option value="E">Solo egresos</option>
                    </select>
                    <select
                        className="form-select form-select-sm"
                        style={{ width: "auto" }}
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="activos">Solo activos</option>
                        <option value="cancelados">Solo cancelados</option>
                    </select>
                </div>
            </div>

            <div className="table-responsive">
                <table className="table table-striped align-middle mb-0">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Folio</th>
                            <th>Autorizó</th>
                            <th>Beneficiario</th>
                            <th>Concepto de gastos efectuados</th>
                            <th>Tipo</th>
                            <th className="text-end">Cantidad</th>
                            <th className="text-center">Acciones</th>
                        </tr>
                    </thead>

                    <tbody>
                        {paginados.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center text-muted py-4">
                                    {movimientos.length === 0
                                        ? "Aún no hay movimientos en este corte. Registra el primero arriba."
                                        : "Ningún movimiento coincide con la búsqueda."}
                                </td>
                            </tr>
                        ) : (
                            paginados.map((movimiento) => (
                                <tr
                                    key={movimiento.id}
                                    className={movimiento.cancelado ? "table-secondary text-decoration-line-through opacity-75" : ""}
                                >
                                    <td>{formatearFechaNumerica(movimiento.fecha)}</td>
                                    <td className="font-tabular-nums">
                                        {movimiento.folio}
                                        {movimiento.editado && !movimiento.cancelado && (
                                            <span
                                                className="badge bg-warning text-dark ms-2 text-decoration-none"
                                                title="Este movimiento fue modificado después de registrarse"
                                            >
                                                Editado
                                            </span>
                                        )}
                                    </td>
                                    <td>{movimiento.autorizo}</td>
                                    <td>{movimiento.beneficiario}</td>
                                    <td>{movimiento.concepto}</td>
                                    <td>
                                        {badgeTipo(movimiento.tipo)}
                                    </td>
                                    <td className="text-end font-tabular-nums">
                                        {movimiento.divisas.map((d) => (
                                            <div key={d.id}>
                                                ({d.divisa.codigo}) {d.divisa.simbolo} {d.cantidad.toLocaleString("es-MX")}
                                            </div>
                                        ))}
                                    </td>

                                    <td className="text-center text-decoration-none">
                                        <div className="d-flex flex-wrap gap-2 justify-content-center align-items-center">
                                            <Link
                                                to={`/tesoreria/caja/movimientos/${movimiento.id}`}
                                                className="btn btn-outline-secondary btn-sm"
                                                title="Ver detalle"
                                            >
                                                <i className="bi bi-eye"></i>
                                            </Link>
                                            <button
                                                className="btn btn-outline-secondary btn-sm position-relative"
                                                onClick={() => onVerArchivos?.(movimiento)}
                                                disabled={!onVerArchivos}
                                                title="Archivos adjuntos"
                                            >
                                                <i className="bi bi-paperclip"></i>
                                                {movimiento.archivosCount > 0 && (
                                                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary">
                                                        {movimiento.archivosCount}
                                                    </span>
                                                )}
                                            </button>
                                            {movimiento.cancelado ? (
                                                <span
                                                    className="badge bg-secondary"
                                                    title={movimiento.motivo_cancelacion || undefined}
                                                >
                                                    Cancelado
                                                </span>
                                            ) : (
                                                <>
                                                    <button
                                                        className="btn btn-warning btn-sm me-2"
                                                        onClick={() => onEditar?.(movimiento)}
                                                        disabled={!onEditar}
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>

                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => onCancelar?.(movimiento)}
                                                        disabled={!onCancelar}
                                                    >
                                                        <i className="bi bi-x-circle"></i>
                                                    </button>
                                                </>
                                            )}
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
                    {filtrados.length !== movimientos.length && ` (${movimientos.length} en total)`}
                </small>
                <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
            </div>
        </>
    );
}

export default MovimientosTable;
