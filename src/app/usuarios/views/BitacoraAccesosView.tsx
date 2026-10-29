import { useEffect, useState } from "react";
import PageHeader from "../../../layouts/components/PageHeader";
import BuscadorTabla from "../../../shared/components/BuscadorTabla";
import Paginacion from "../../../shared/components/Paginacion";
import PorPaginaSelect from "../../../shared/components/PorPaginaSelect";
import SkeletonTable from "../../../shared/components/SkeletonTable";
import TablaResponsive from "../../../shared/components/TablaResponsive";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import { formatearFechaNumerica } from "../../../shared/utils/fechas";
import type { EventoAcceso, EventoAccesoTipo } from "../interfaces/Usuario";
import { obtenerBitacora } from "../services/usuario.service";

const EVENTOS: { valor: EventoAccesoTipo; texto: string; clase: string; icono: string }[] = [
    { valor: "ingreso", texto: "Inicio de sesión", clase: "success", icono: "bi-box-arrow-in-right" },
    { valor: "fallido", texto: "Intento fallido", clase: "warning", icono: "bi-x-circle" },
    { valor: "bloqueado", texto: "Bloqueo por intentos", clase: "danger", icono: "bi-lock-fill" },
    { valor: "salida", texto: "Cierre de sesión", clase: "secondary", icono: "bi-box-arrow-right" },
    { valor: "inactividad", texto: "Cierre por inactividad", clase: "secondary", icono: "bi-clock-history" },
    { valor: "password", texto: "Cambio de contraseña", clase: "info", icono: "bi-key" },
    { valor: "sesiones_cerradas", texto: "Sesiones cerradas", clase: "info", icono: "bi-door-closed" },
    { valor: "desbloqueo", texto: "Desbloqueo", clase: "info", icono: "bi-unlock" },
    { valor: "reuso_token", texto: "Token reutilizado", clase: "danger", icono: "bi-shield-exclamation" },
];

const POR_EVENTO = Object.fromEntries(EVENTOS.map((e) => [e.valor, e]));

/** Navegador legible a partir del user agent (sin librerías: basta para ubicar el equipo). */
function navegadorCorto(agente: string): string {
    if (!agente) return "—";
    const nav = /Edg\//.test(agente) ? "Edge" : /Chrome\//.test(agente) ? "Chrome" : /Firefox\//.test(agente) ? "Firefox" : /Safari\//.test(agente) ? "Safari" : "Otro";
    const so = /Windows/.test(agente) ? "Windows" : /Android/.test(agente) ? "Android" : /iPhone|iPad/.test(agente) ? "iOS" : /Mac OS/.test(agente) ? "macOS" : /Linux/.test(agente) ? "Linux" : "";
    return so ? `${nav} · ${so}` : nav;
}

export default function BitacoraAccesosView() {
    const [eventos, setEventos] = useState<EventoAcceso[]>([]);
    const [total, setTotal] = useState(0);
    const [busqueda, setBusqueda] = useState("");
    const [evento, setEvento] = useState("");
    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = useState(25);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let vigente = true;
        const id = setTimeout(async () => {
            setCargando(true);
            try {
                const datos = await obtenerBitacora({ pagina, porPagina, busqueda, evento, desde, hasta });
                if (!vigente) return;
                setEventos(datos.results);
                setTotal(datos.count);
                setError(null);
            } catch (err) {
                if (vigente) setError(obtenerMensajeError(err));
            } finally {
                if (vigente) setCargando(false);
            }
        }, busqueda ? 300 : 0);
        return () => {
            vigente = false;
            clearTimeout(id);
        };
    }, [pagina, porPagina, busqueda, evento, desde, hasta]);

    function filtrar<T>(setter: (v: T) => void) {
        return (valor: T) => {
            setter(valor);
            setPagina(1);
        };
    }

    const totalPaginas = Math.max(1, Math.ceil(total / porPagina));

    return (
        <>
            <PageHeader
                title="Bitácora de accesos"
                subtitle="Inicios y cierres de sesión, intentos fallidos y bloqueos"
                breadcrumbs={[{ label: "Inicio", to: "/" }, { label: "Usuarios", to: "/usuarios" }, { label: "Bitácora de accesos" }]}
            />

            <div className="container-fluid">
                <div className="card card-outline card-primary">
                    <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                        <BuscadorTabla valor={busqueda} onChange={filtrar(setBusqueda)} placeholder="Usuario tecleado..." />
                        <select className="form-select form-select-sm" style={{ width: "auto" }} value={evento}
                            onChange={(e) => filtrar(setEvento)(e.target.value)} aria-label="Evento">
                            <option value="">Todos los eventos</option>
                            {EVENTOS.map((e) => <option key={e.valor} value={e.valor}>{e.texto}</option>)}
                        </select>
                        <div className="d-flex align-items-center gap-1">
                            <label className="small text-body-secondary" htmlFor="bitacora-desde">Del</label>
                            <input id="bitacora-desde" type="date" className="form-control form-control-sm" value={desde}
                                onChange={(e) => filtrar(setDesde)(e.target.value)} />
                            <label className="small text-body-secondary" htmlFor="bitacora-hasta">al</label>
                            <input id="bitacora-hasta" type="date" className="form-control form-control-sm" value={hasta}
                                onChange={(e) => filtrar(setHasta)(e.target.value)} />
                        </div>
                        <div className="ms-auto">
                            <PorPaginaSelect valor={porPagina} onChange={filtrar(setPorPagina)} />
                        </div>
                    </div>

                    <div className="card-body p-0">
                        {error ? (
                            <div className="alert alert-danger m-3">{error}</div>
                        ) : cargando && eventos.length === 0 ? (
                            <SkeletonTable columnas={6} filas={8} />
                        ) : (
                            <TablaResponsive alturaMaxima="70vh">
                                <table className="table table-sm table-hover mb-0 tabla-datos">
                                    <thead>
                                        <tr>
                                            <th>Fecha y hora</th>
                                            <th>Evento</th>
                                            <th>Usuario</th>
                                            <th>IP</th>
                                            <th>Navegador</th>
                                            <th>Detalle</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {eventos.length === 0 ? (
                                            <tr><td colSpan={6} className="text-center text-muted py-4">Sin eventos con estos filtros.</td></tr>
                                        ) : eventos.map((e) => {
                                            const info = POR_EVENTO[e.evento];
                                            return (
                                                <tr key={e.id}>
                                                    <td className="text-nowrap">{formatearFechaNumerica(new Date(e.fecha), "numerico-hora")}</td>
                                                    <td>
                                                        <span className={`badge bg-${info?.clase ?? "secondary"}-subtle text-${info?.clase ?? "secondary"}-emphasis border border-${info?.clase ?? "secondary"}-subtle`}>
                                                            <i className={`bi ${info?.icono ?? "bi-dot"} me-1`} aria-hidden="true"></i>
                                                            {e.evento_display}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {e.username || "—"}
                                                        {e.nombre && <div className="small text-body-secondary">{e.nombre}</div>}
                                                        {!e.usuario && e.username && (
                                                            <div className="small text-body-secondary">(no existe)</div>
                                                        )}
                                                    </td>
                                                    <td className="font-monospace small">{e.ip ?? "—"}</td>
                                                    <td className="small" title={e.navegador}>{navegadorCorto(e.navegador)}</td>
                                                    <td className="small">{e.detalle || <span className="text-muted">—</span>}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </TablaResponsive>
                        )}
                    </div>

                    <div className="card-footer d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <small className="text-muted">{total} evento(s)</small>
                        <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
                    </div>
                </div>
            </div>
        </>
    );
}
