import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../../layouts/components/PageHeader";
import BuscadorTabla from "../../../shared/components/BuscadorTabla";
import SkeletonTable from "../../../shared/components/SkeletonTable";
import TablaResponsive from "../../../shared/components/TablaResponsive";
import Paginacion from "../../../shared/components/Paginacion";
import PorPaginaSelect from "../../../shared/components/PorPaginaSelect";
import { usePaginacion } from "../../../shared/hooks/usePaginacion";
import { useToastContext } from "../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import { descargarReporteSaldos, obtenerReporteSaldos, type ReporteSaldos } from "../services/cartera.service";
import { claseSaldo, dinero, fecha, rutaClienteCartera } from "../utils/cartera";

/** Igual que la hoja SALDO CLIENTES: saldo por empresa, conjunto, último pago y celular. */
function ReporteSaldosView() {
    const { mostrarToast } = useToastContext();
    const [reporte, setReporte] = useState<ReporteSaldos | null>(null);
    const [busqueda, setBusqueda] = useState("");
    const [conSaldo, setConSaldo] = useState(true);
    const [porPagina, setPorPagina] = useState(50);
    const [error, setError] = useState<string | null>(null);
    const [descargando, setDescargando] = useState<"pdf" | "excel" | null>(null);
    const [menuPdf, setMenuPdf] = useState(false);
    const menuPdfRef = useRef<HTMLDivElement | null>(null);

    // El menú se cierra al hacer clic fuera o con Escape.
    useEffect(() => {
        if (!menuPdf) return;
        function cerrar(e: MouseEvent | KeyboardEvent) {
            if (e instanceof KeyboardEvent ? e.key === "Escape" : !menuPdfRef.current?.contains(e.target as Node)) {
                setMenuPdf(false);
            }
        }
        document.addEventListener("mousedown", cerrar);
        document.addEventListener("keydown", cerrar);
        return () => {
            document.removeEventListener("mousedown", cerrar);
            document.removeEventListener("keydown", cerrar);
        };
    }, [menuPdf]);

    useEffect(() => {
        let vigente = true;
        const temporizador = setTimeout(() => {
            obtenerReporteSaldos({ q: busqueda.trim() || undefined, con_saldo: conSaldo })
                .then((datos) => vigente && (setReporte(datos), setError(null)))
                .catch((err) => vigente && setError(obtenerMensajeError(err)));
        }, 250);
        return () => {
            vigente = false;
            clearTimeout(temporizador);
        };
    }, [busqueda, conSaldo]);

    async function descargar(formato: "pdf" | "excel", resumido = false) {
        setMenuPdf(false);
        setDescargando(formato);
        try {
            await descargarReporteSaldos(formato, { q: busqueda.trim() || undefined, con_saldo: conSaldo }, resumido);
        } catch (err) {
            mostrarToast("Error al descargar", obtenerMensajeError(err), "danger");
        } finally {
            setDescargando(null);
        }
    }

    const filas = reporte?.filas ?? [];
    const empresas = reporte?.empresas ?? [];
    const { pagina, setPagina, totalPaginas, inicio, fin } = usePaginacion(filas.length, porPagina, `${busqueda}|${conSaldo}|${porPagina}`);
    // Los pagos sin cliente van en un renglón aparte (negativo) y entran al total, como en el Excel del área.
    const sinIdentificar = reporte?.por_identificar ?? {};
    const conjuntoSinIdentificar = Object.values(sinIdentificar).reduce((acc, v) => acc + Number(v), 0);
    const total = (clave: string | null) =>
        filas.reduce((acc, f) => acc + Number(clave === null ? f.saldo_conjunto : f.saldos[clave] ?? 0), 0)
        + (clave === null ? conjuntoSinIdentificar : Number(sinIdentificar[clave] ?? 0));

    return (
        <>
            <PageHeader
                title="Saldos de clientes"
                subtitle="Saldo por empresa, conjunto y último pago"
                breadcrumbs={[{ label: "Inicio", to: "/" }, { label: "Cartera", to: "/cartera" }, { label: "Reportes" }, { label: "Saldos de clientes" }]}
            />
            <div className="container-fluid">
                <div className="card card-outline card-primary">
                    <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                        <h3 className="card-title mb-0 me-auto">Vista previa</h3>
                        <PorPaginaSelect valor={porPagina} onChange={setPorPagina} />
                        <button className="btn btn-outline-success btn-sm" onClick={() => descargar("excel")} disabled={descargando !== null}>
                            <i className="bi bi-file-earmark-excel me-1" aria-hidden="true"></i>Excel
                        </button>
                        <div className="dropdown" ref={menuPdfRef}>
                            <button
                                type="button"
                                className="btn btn-outline-danger btn-sm dropdown-toggle"
                                aria-expanded={menuPdf}
                                onClick={() => setMenuPdf((abierto) => !abierto)}
                                disabled={descargando !== null}
                            >
                                <i className="bi bi-file-earmark-pdf me-1" aria-hidden="true"></i>PDF
                            </button>
                            <ul className={`dropdown-menu dropdown-menu-end ${menuPdf ? "show" : ""}`} data-bs-popper="static">
                                <li>
                                    <button type="button" className="dropdown-item" onClick={() => descargar("pdf")}>
                                        <i className="bi bi-file-earmark-pdf me-2" aria-hidden="true"></i>Completo
                                        <div className="small text-body-secondary">Horizontal, con último pago y celular</div>
                                    </button>
                                </li>
                                <li>
                                    <button type="button" className="dropdown-item" onClick={() => descargar("pdf", true)}>
                                        <i className="bi bi-file-earmark-text me-2" aria-hidden="true"></i>Solo saldos
                                        <div className="small text-body-secondary">Vertical: cliente, saldo por empresa y conjunto</div>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="d-flex flex-wrap gap-3 align-items-center p-3 border-bottom">
                        <BuscadorTabla valor={busqueda} onChange={setBusqueda} placeholder="Buscar cliente..." />
                        <div className="form-check form-switch mb-0">
                            <input id="reporte-con-saldo" type="checkbox" className="form-check-input" role="switch"
                                checked={conSaldo} onChange={(e) => setConSaldo(e.target.checked)} />
                            <label className="form-check-label" htmlFor="reporte-con-saldo">Solo clientes con saldo</label>
                        </div>
                        <span className="ms-auto small text-body-secondary">{filas.length} cliente(s)</span>
                    </div>
                    <div className="card-body p-0">
                        {error ? (
                            <div className="alert alert-danger m-3">{error}</div>
                        ) : !reporte ? (
                            <SkeletonTable columnas={6} filas={8} />
                        ) : (
                            <TablaResponsive alturaMaxima="70vh">
                                <table className="table tabla-datos">
                                    <thead>
                                        <tr>
                                            <th>Cliente</th>
                                            {empresas.map((e) => <th key={e.id} className="num">{e.nombre}</th>)}
                                            <th className="num">Saldo conjunto</th>
                                            <th>Último pago</th>
                                            <th className="num">Monto</th>
                                            <th>Celular</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filas.length === 0 ? (
                                            <tr><td colSpan={empresas.length + 5} className="text-center text-body-secondary py-5">Sin clientes.</td></tr>
                                        ) : filas.slice(inicio, fin).map((f) => (
                                            <tr key={f.cliente.id}>
                                                <td>
                                                    <Link to={rutaClienteCartera(f.cliente.id)} className="fw-semibold">{f.cliente.nombre}</Link>
                                                    {f.pagare && <span className="badge border bg-info-subtle text-info-emphasis border-info-subtle ms-1">Pagaré</span>}
                                                </td>
                                                {empresas.map((e) => {
                                                    const saldo = f.saldos[String(e.id)] ?? "0";
                                                    return <td key={e.id} className={`num ${claseSaldo(saldo)}`}>{Number(saldo) ? dinero(saldo) : "—"}</td>;
                                                })}
                                                <td className={`num fw-semibold ${claseSaldo(f.saldo_conjunto)}`}>{dinero(f.saldo_conjunto)}</td>
                                                <td className="text-nowrap">{f.ultimo_pago ? fecha(f.ultimo_pago.fecha) : "—"}</td>
                                                <td className="num">{f.ultimo_pago?.monto ? dinero(f.ultimo_pago.monto) : "—"}</td>
                                                <td className="small">{f.celular || "—"}</td>
                                            </tr>
                                        ))}
                                        {conjuntoSinIdentificar !== 0 && pagina === totalPaginas && (
                                                <tr>
                                                    <td className="fw-semibold">
                                                        <Link to="/cartera/pagos?pestana=por_identificar">POR IDENTIFICAR</Link>
                                                        <div className="small text-body-secondary">Pagos sin cliente asignado</div>
                                                    </td>
                                                    {empresas.map((e) => (
                                                        <td key={e.id} className="num">{Number(sinIdentificar[String(e.id)] ?? 0) ? dinero(sinIdentificar[String(e.id)]) : "—"}</td>
                                                    ))}
                                                    <td className="num fw-semibold">{dinero(conjuntoSinIdentificar)}</td>
                                                    <td colSpan={3}></td>
                                                </tr>
                                            )}
                                    </tbody>
                                    {filas.length > 0 && (
                                        <tfoot>
                                            <tr>
                                                <td className="fw-bold">Total</td>
                                                {empresas.map((e) => <td key={e.id} className="num fw-bold">{dinero(total(String(e.id)))}</td>)}
                                                <td className="num fw-bold">{dinero(total(null))}</td>
                                                <td colSpan={3}></td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </TablaResponsive>
                        )}
                    </div>
                    {reporte && (
                        <div className="card-footer d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <small className="text-body-secondary">
                                {filas.length === 0 ? "Sin resultados" : `Mostrando ${inicio + 1}-${Math.min(fin, filas.length)} de ${filas.length}`}
                            </small>
                            <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default ReporteSaldosView;
