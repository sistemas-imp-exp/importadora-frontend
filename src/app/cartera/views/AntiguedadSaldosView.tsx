import { Fragment, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import PageHeader from "../../../layouts/components/PageHeader";
import BotonDescargaExcel from "../../../shared/components/BotonDescargaExcel";
import BuscadorTabla from "../../../shared/components/BuscadorTabla";
import Paginacion from "../../../shared/components/Paginacion";
import SkeletonTable from "../../../shared/components/SkeletonTable";
import TablaResponsive from "../../../shared/components/TablaResponsive";
import { usePaginacion } from "../../../shared/hooks/usePaginacion";
import { useToastContext } from "../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import { hoyISO } from "../../../shared/utils/fechas";
import { useCatalogosCartera } from "../hooks/useCatalogosCartera";
import { descargarAntiguedad, obtenerAntiguedad, type AntiguedadSaldos } from "../services/cartera.service";
import { claseSaldo, dinero, fecha, rutaClienteCartera } from "../utils/cartera";

const CLIENTES_POR_PAGINA = 25;

/** Fondo del rango: más días, más intenso (el texto del encabezado dice el rango). */
const CLASE_RANGO = ["", "", "bg-warning-subtle", "bg-warning-subtle", "bg-danger-subtle"];

function texto(valor: string): string {
    return valor.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Antigüedad de saldos por nota, como "Cobro a clientes 2026" del área: por
 * cliente y empresa, cada nota con lo que se debe, sus días y su rango; los
 * pagos sin nota indicada se descuentan de lo más antiguo.
 */
function AntiguedadSaldosView() {
    const { mostrarToast } = useToastContext();
    const { empresas } = useCatalogosCartera((m) => mostrarToast("Error al cargar", m, "danger"));
    const [fechaCorte, setFechaCorte] = useState(hoyISO());
    const [empresaId, setEmpresaId] = useState<number | "">("");
    const [busqueda, setBusqueda] = useState("");
    const [datos, setDatos] = useState<AntiguedadSaldos | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const filtro = useMemo(() => ({ fecha: fechaCorte || undefined, empresa: empresaId || undefined }), [fechaCorte, empresaId]);

    useEffect(() => {
        const control = new AbortController();
        const temporizador = setTimeout(() => {
            setCargando(true);
            obtenerAntiguedad(filtro, control.signal)
                .then((respuesta) => {
                    setDatos(respuesta);
                    setError(null);
                })
                .catch((err) => !axios.isCancel(err) && setError(obtenerMensajeError(err)))
                .finally(() => !control.signal.aborted && setCargando(false));
        }, 300);
        return () => {
            clearTimeout(temporizador);
            control.abort();
        };
    }, [filtro]);

    const clientes = useMemo(() => {
        const q = texto(busqueda.trim());
        const lista = datos?.clientes ?? [];
        return q ? lista.filter((c) => texto(c.cliente.nombre).includes(q)) : lista;
    }, [datos, busqueda]);
    const { pagina, setPagina, totalPaginas, inicio, fin } = usePaginacion(
        clientes.length, CLIENTES_POR_PAGINA, `${busqueda}|${fechaCorte}|${empresaId}`,
    );

    const rangos = datos?.rangos ?? [];
    const columnas = 4 + rangos.length;
    const totalConjunto = (datos?.empresas ?? []).reduce((acc, e) => acc + Number(e.saldo), 0);

    return (
        <>
            <PageHeader
                title="Antigüedad de saldos"
                subtitle="Lo que debe cada cliente por nota y días vencidos, como Cobro a clientes"
                breadcrumbs={[{ label: "Inicio", to: "/" }, { label: "Cartera", to: "/cartera" }, { label: "Reportes" }, { label: "Antigüedad de saldos" }]}
            />
            <div className="container-fluid">
                <div className="card card-outline card-primary mb-3">
                    <div className="card-body d-flex flex-wrap gap-3 align-items-end">
                        <div>
                            <label className="form-label small fw-semibold text-uppercase text-body-secondary mb-1" htmlFor="antiguedad-fecha">
                                Saldo a la fecha
                            </label>
                            <input id="antiguedad-fecha" type="date" className="form-control form-control-sm" max={hoyISO()}
                                value={fechaCorte} onChange={(e) => setFechaCorte(e.target.value)} />
                        </div>
                        <div>
                            <label className="form-label small fw-semibold text-uppercase text-body-secondary mb-1" htmlFor="antiguedad-empresa">
                                Empresa
                            </label>
                            <select id="antiguedad-empresa" className="form-select form-select-sm" value={empresaId}
                                onChange={(e) => setEmpresaId(e.target.value ? Number(e.target.value) : "")}>
                                <option value="">Todas (separadas)</option>
                                {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                            </select>
                        </div>
                        <BuscadorTabla valor={busqueda} onChange={setBusqueda} placeholder="Buscar cliente..." />
                        <div className="ms-auto">
                            <BotonDescargaExcel
                                onDescargar={() => descargarAntiguedad(filtro)}
                                titulo="Descargar como Cobro a clientes (un bloque por cliente y empresa, y resumen)"
                                disabled={!datos}
                            />
                        </div>
                    </div>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                {datos && datos.empresas.length > 0 && (
                    <div className="card mb-3">
                        <div className="card-header py-2">
                            <h3 className="card-title fs-6 fw-bold m-0">Por empresa · días vencidos al {fecha(datos.fecha)}</h3>
                        </div>
                        <div className="card-body p-0">
                            <TablaResponsive>
                                <table className="table tabla-datos mb-0">
                                    <thead>
                                        <tr>
                                            <th>Empresa</th>
                                            {rangos.map((r) => <th key={r} className="num">{r}</th>)}
                                            <th className="num">Saldo a favor</th>
                                            <th className="num">Saldo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {datos.empresas.map((e) => (
                                            <tr key={e.empresa.id}>
                                                <td className="fw-semibold">{e.empresa.nombre}</td>
                                                {e.por_rango.map((v, i) => <td key={i} className="num">{Number(v) ? dinero(v) : "—"}</td>)}
                                                <td className="num">{Number(e.a_favor) ? dinero(-Number(e.a_favor)) : "—"}</td>
                                                <td className={`num fw-bold ${claseSaldo(e.saldo)}`}>{dinero(e.saldo)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    {datos.empresas.length > 1 && (
                                        <tfoot>
                                            <tr>
                                                <td className="fw-bold">En conjunto</td>
                                                {rangos.map((r, i) => (
                                                    <td key={r} className="num fw-bold">
                                                        {dinero(datos.empresas.reduce((acc, e) => acc + Number(e.por_rango[i]), 0))}
                                                    </td>
                                                ))}
                                                <td className="num fw-bold">
                                                    {dinero(-datos.empresas.reduce((acc, e) => acc + Number(e.a_favor), 0))}
                                                </td>
                                                <td className="num fw-bold">{dinero(totalConjunto)}</td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </TablaResponsive>
                        </div>
                    </div>
                )}

                <div className="card card-outline card-primary">
                    <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                        <h3 className="card-title mb-0 me-auto">Notas por cliente</h3>
                        {cargando && datos && <span className="spinner-border spinner-border-sm text-body-secondary" role="status" aria-label="Actualizando"></span>}
                        <span className="small text-body-secondary">{clientes.length} cliente(s)</span>
                    </div>
                    <div className={`card-body p-0 ${cargando && datos ? "opacity-50" : ""}`}>
                        {!datos ? (
                            <SkeletonTable columnas={9} filas={10} />
                        ) : (
                            <TablaResponsive alturaMaxima="70vh">
                                <table className="table tabla-datos tabla-hoja mb-0">
                                    <thead>
                                        <tr>
                                            <th className="num">Días</th>
                                            <th>Nota/Fact</th>
                                            <th>Fecha</th>
                                            <th className="num">Monto</th>
                                            {rangos.map((r) => <th key={r} className="num">{r}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clientes.length === 0 ? (
                                            <tr><td colSpan={columnas} className="text-center text-body-secondary py-5">Sin saldos.</td></tr>
                                        ) : clientes.slice(inicio, fin).map((c) => (
                                            <Fragment key={c.cliente.id}>
                                                {c.empresas.map((b) => (
                                                    <Fragment key={b.empresa.id}>
                                                        <tr className="fila-bloque">
                                                            <td colSpan={columnas}>
                                                                <Link to={rutaClienteCartera(c.cliente.id)} className="fw-bold">{c.cliente.nombre}</Link>
                                                                <span className="ms-2 small fw-semibold text-body-secondary">{b.empresa.nombre}</span>
                                                            </td>
                                                        </tr>
                                                        {b.notas.map((n) => (
                                                            <tr key={`${n.tipo}-${n.salida_id ?? n.nota}-${n.fecha}`}>
                                                                <td className="num">{n.dias}</td>
                                                                <td className="text-nowrap">
                                                                    {n.nota}
                                                                    {n.tipo === "inicial" && <span className="badge border bg-light text-body-secondary fw-normal ms-1">Saldo al corte</span>}
                                                                    {n.tipo === "cargo" && <span className="badge border bg-light text-body-secondary fw-normal ms-1">Cargo</span>}
                                                                </td>
                                                                <td className="text-nowrap">{fecha(n.fecha)}</td>
                                                                <td className="num" title={Number(n.descontado) ? `Importe ${dinero(n.importe)} − pagado ${dinero(n.descontado)}` : undefined}>
                                                                    {dinero(n.pendiente)}
                                                                    {Number(n.descontado) > 0 && <div className="small text-body-secondary">de {dinero(n.importe)}</div>}
                                                                </td>
                                                                {rangos.map((r, i) => (
                                                                    <td key={r} className={`num ${i === n.rango ? CLASE_RANGO[i] : ""}`}>
                                                                        {i === n.rango ? dinero(n.pendiente) : ""}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                        {Number(b.a_favor) > 0 && (
                                                            <tr>
                                                                <td></td>
                                                                <td colSpan={2}>Saldo a favor</td>
                                                                <td className="num text-success-emphasis">{dinero(-Number(b.a_favor))}</td>
                                                                <td colSpan={rangos.length}></td>
                                                            </tr>
                                                        )}
                                                        <tr className="fw-semibold">
                                                            <td></td>
                                                            <td colSpan={2}>Totales</td>
                                                            <td className={`num ${claseSaldo(b.saldo)}`}>{dinero(b.saldo)}</td>
                                                            {b.por_rango.map((v, i) => <td key={i} className="num">{Number(v) ? dinero(v) : "—"}</td>)}
                                                        </tr>
                                                    </Fragment>
                                                ))}
                                                {c.empresas.length > 1 && (
                                                    <tr className="fw-bold table-primary">
                                                        <td></td>
                                                        <td colSpan={2}>Saldo en conjunto</td>
                                                        <td className="num">{dinero(c.conjunto)}</td>
                                                        {c.por_rango.map((v, i) => <td key={i} className="num">{Number(v) ? dinero(v) : "—"}</td>)}
                                                    </tr>
                                                )}
                                            </Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </TablaResponsive>
                        )}
                    </div>
                    {datos && (
                        <div className="card-footer d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <small className="text-body-secondary">
                                <i className="bi bi-info-circle me-1" aria-hidden="true"></i>
                                Días = fecha del reporte − fecha de la nota. Lo que un pago no aplica a una nota se descuenta de lo más antiguo;
                                el saldo al corte cuenta desde la fecha de corte.
                            </small>
                            <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default AntiguedadSaldosView;
