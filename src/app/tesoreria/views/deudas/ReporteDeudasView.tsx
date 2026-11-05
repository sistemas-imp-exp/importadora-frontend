import { useEffect, useState } from "react";
import PageHeader from "../../../../layouts/components/PageHeader";
import FiltroChip from "../../../../shared/components/FiltroChip";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import TablaResponsive from "../../../../shared/components/TablaResponsive";
import { useToastContext } from "../../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import { TIPOS_DEUDOR, type TipoDeudor } from "../../interfaces/deudas/Deuda";
import type { Divisa } from "../../interfaces/divisas/Divisa";
import type { FiltrosReporteDeudas, ReporteDeudas, TotalReporteDeudas } from "../../interfaces/deudas/ReporteDeudas";
import { descargarReporteDeudas, obtenerReporteDeudas } from "../../services/deudas.service";
import { obtenerDivisas } from "../../services/divisa.service";
import { fechaDeISO, formatearDineroDivisa } from "../../utils/deudas";

const OPCIONES_TIPO = Object.entries(TIPOS_DEUDOR).map(([value, label]) => ({ value, label: `${label}s` }));
const MS_DIA = 24 * 60 * 60 * 1000;

function diasDesde(iso: string): number {
    const hoy = new Date();
    hoy.setHours(12, 0, 0, 0);
    return Math.max(0, Math.round((hoy.getTime() - fechaDeISO(iso).getTime()) / MS_DIA));
}

/** Antigüedad legible: "hoy", "hace 1 día", "hace 19 días". */
function antiguedad(dias: number): string {
    if (dias === 0) return "hoy";
    return `hace ${dias} ${dias === 1 ? "día" : "días"}`;
}

/** Resumen de una divisa: lo que se debe, lo cobrado y cuántos deben. */
function ResumenDivisa({ total }: { total: TotalReporteDeudas }) {
    const { simbolo, codigo } = total.divisa;
    const cobrado = Number(total.total) > 0 ? (Number(total.abonado) / Number(total.total)) * 100 : 0;
    return (
        <div className="card mb-3">
            <div className="card-body">
                <div className="row g-3 align-items-center">
                    <div className="col-md-4">
                        <div className="small text-uppercase fw-semibold text-body-secondary">Se debe a la caja · {codigo}</div>
                        <div className="display-6 fw-bold text-danger-emphasis lh-sm">{formatearDineroDivisa(simbolo, total.saldo)}</div>
                    </div>
                    <div className="col-sm-6 col-md-4">
                        <div className="d-flex justify-content-between small mb-1">
                            <span className="text-body-secondary">Cobrado</span>
                            <span className="fw-semibold">{cobrado.toFixed(1)}%</span>
                        </div>
                        <div className="progress" style={{ height: 8 }} role="progressbar" aria-label={`Cobrado ${cobrado.toFixed(1)}%`}
                            aria-valuenow={cobrado} aria-valuemin={0} aria-valuemax={100}>
                            <div className="progress-bar bg-success" style={{ width: `${cobrado}%` }}></div>
                        </div>
                        <div className="d-flex justify-content-between small text-body-secondary mt-1">
                            <span>Abonado {formatearDineroDivisa(simbolo, total.abonado)}</span>
                            <span>de {formatearDineroDivisa(simbolo, total.total)}</span>
                        </div>
                    </div>
                    <div className="col-sm-6 col-md-4 d-flex gap-4 justify-content-md-end">
                        <div className="text-md-end">
                            <div className="fs-4 fw-bold lh-1">{total.deudores}</div>
                            <div className="small text-body-secondary">{total.deudores === 1 ? "deudor" : "deudores"}</div>
                        </div>
                        <div className="text-md-end">
                            <div className="fs-4 fw-bold lh-1">{total.abiertas}</div>
                            <div className="small text-body-secondary">{total.abiertas === 1 ? "deuda abierta" : "deudas abiertas"}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Cuánto se debe a hoy: una fila por deudor y divisa (las divisas no se
 * suman), de mayor a menor saldo, y el total por divisa al pie. Lo mismo sale
 * en PDF y Excel.
 */
function ReporteDeudasView() {
    const { mostrarToast } = useToastContext();
    const [divisas, setDivisas] = useState<Divisa[]>([]);
    const [filtros, setFiltros] = useState<FiltrosReporteDeudas>({ tipo: "", divisaId: "", soloConSaldo: true });
    const [reporte, setReporte] = useState<ReporteDeudas | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [descargando, setDescargando] = useState<"pdf" | "excel" | null>(null);

    useEffect(() => {
        obtenerDivisas()
            .then(setDivisas)
            .catch((err) => mostrarToast("Error al cargar divisas", obtenerMensajeError(err), "danger"));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let vigente = true;
        obtenerReporteDeudas(filtros)
            .then((datos) => {
                if (!vigente) return;
                setReporte(datos);
                setError(null);
            })
            .catch((err) => vigente && setError(obtenerMensajeError(err)));
        return () => {
            vigente = false;
        };
    }, [filtros]);

    function cambiar(cambios: Partial<FiltrosReporteDeudas>) {
        setReporte(null);
        setFiltros((actual) => ({ ...actual, ...cambios }));
    }

    async function descargar(formato: "pdf" | "excel") {
        setDescargando(formato);
        try {
            await descargarReporteDeudas(filtros, formato);
        } catch (err) {
            mostrarToast("Error al exportar", obtenerMensajeError(err), "danger");
        } finally {
            setDescargando(null);
        }
    }

    // Ya vienen por divisa y de mayor a menor saldo, igual que en el PDF y el Excel.
    const filas = reporte?.filas ?? [];
    const saldoPorDivisa = new Map(reporte?.totales.map((t) => [t.divisa.codigo, Number(t.saldo)]) ?? []);
    const variasDivisas = (reporte?.totales.length ?? 0) > 1;
    const opcionesDivisa = divisas.map((d) => ({ value: String(d.id), label: d.codigo }));

    return (
        <>
            <PageHeader
                title="Reporte de deudas"
                subtitle="Cuánto se le debe a la caja hoy, por deudor"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Tesorería", to: "/tesoreria" },
                    { label: "Deudas" },
                    { label: "Reporte" },
                ]}
            />

            <div className="container-fluid">
                <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
                    <FiltroChip etiqueta="Tipo" icono="bi-person" valor={filtros.tipo} opciones={OPCIONES_TIPO}
                        etiquetaTodos="Todos los deudores" onChange={(v) => cambiar({ tipo: v as TipoDeudor | "" })} />
                    <FiltroChip etiqueta="Divisa" icono="bi-currency-exchange" valor={filtros.divisaId} opciones={opcionesDivisa}
                        etiquetaTodos="Todas las divisas" onChange={(v) => cambiar({ divisaId: v })} />
                    <div className="form-check form-switch mb-0 ms-1">
                        <input
                            id="reporte-pagadas"
                            type="checkbox"
                            role="switch"
                            className="form-check-input"
                            checked={!filtros.soloConSaldo}
                            onChange={(e) => cambiar({ soloConSaldo: !e.target.checked })}
                        />
                        <label className="form-check-label small" htmlFor="reporte-pagadas">Incluir los que ya pagaron</label>
                    </div>
                    <div className="btn-group btn-group-sm ms-auto" role="group" aria-label="Descargar reporte">
                        <button type="button" className="btn btn-outline-success" onClick={() => descargar("excel")}
                            disabled={descargando !== null}>
                            {descargando === "excel" ? (
                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                            ) : (
                                <i className="bi bi-file-earmark-excel me-1" aria-hidden="true"></i>
                            )}
                            Excel
                        </button>
                        <button type="button" className="btn btn-outline-danger" onClick={() => descargar("pdf")}
                            disabled={descargando !== null}>
                            {descargando === "pdf" ? (
                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                            ) : (
                                <i className="bi bi-file-earmark-pdf me-1" aria-hidden="true"></i>
                            )}
                            PDF
                        </button>
                    </div>
                </div>

                {reporte?.totales.map((t) => <ResumenDivisa key={t.divisa.codigo} total={t} />)}

                {error ? (
                    <div className="alert alert-danger text-center">{error}</div>
                ) : !reporte ? (
                    <SkeletonTable columnas={7} filas={6} />
                ) : (
                    <div className="card card-outline card-primary">
                        <div className="card-header d-flex align-items-center">
                            <h3 className="card-title fs-6 fw-bold m-0 me-auto">Detalle por deudor</h3>
                            <span className="small text-body-secondary">
                                {filas.length} {filas.length === 1 ? "registro" : "registros"} · de mayor a menor saldo
                            </span>
                        </div>
                        <div className="card-body p-0">
                            <TablaResponsive alturaMaxima="70vh">
                                <table className="table tabla-datos mb-0">
                                    <thead>
                                        <tr>
                                            <th>Deudor</th>
                                            {variasDivisas && <th>Divisa</th>}
                                            <th className="num">Deudas abiertas</th>
                                            <th className="num">Total</th>
                                            <th className="num">Abonado</th>
                                            <th className="num">Saldo</th>
                                            <th style={{ width: "16%" }}>Del total adeudado</th>
                                            <th>Deuda más antigua</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filas.length === 0 ? (
                                            <tr>
                                                <td colSpan={variasDivisas ? 8 : 7} className="text-center text-body-secondary py-5">
                                                    <i className="bi bi-emoji-smile fs-3 d-block mb-2" aria-hidden="true"></i>
                                                    Nadie debe con estos filtros.
                                                </td>
                                            </tr>
                                        ) : (
                                            filas.map((f) => {
                                                const totalDivisa = saldoPorDivisa.get(f.divisa.codigo) ?? 0;
                                                const parte = totalDivisa > 0 ? (Number(f.saldo) / totalDivisa) * 100 : 0;
                                                const dias = f.desde ? diasDesde(f.desde) : null;
                                                return (
                                                    <tr key={`${f.deudor.id}-${f.divisa.id}`}>
                                                        <td>
                                                            <div className="fw-semibold">{f.deudor.nombre}</div>
                                                            <span className="small text-body-secondary">
                                                                <i className={`bi ${f.deudor.tipo === "T" ? "bi-person-badge" : "bi-person"} me-1`} aria-hidden="true"></i>
                                                                {f.deudor.tipo_display}
                                                            </span>
                                                        </td>
                                                        {variasDivisas && <td>{f.divisa.codigo}</td>}
                                                        <td className="num">{f.abiertas}</td>
                                                        <td className="num">{formatearDineroDivisa(f.divisa.simbolo, f.total)}</td>
                                                        <td className="num text-success-emphasis">{formatearDineroDivisa(f.divisa.simbolo, f.abonado)}</td>
                                                        <td className="num fw-bold">{formatearDineroDivisa(f.divisa.simbolo, f.saldo)}</td>
                                                        <td>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <div className="progress flex-grow-1" style={{ height: 6 }} role="progressbar"
                                                                    aria-label={`${parte.toFixed(1)}% del total adeudado`} aria-valuenow={parte}
                                                                    aria-valuemin={0} aria-valuemax={100}>
                                                                    <div className="progress-bar bg-danger" style={{ width: `${parte}%` }}></div>
                                                                </div>
                                                                <span className="small text-body-secondary text-end" style={{ minWidth: 42 }}>
                                                                    {parte.toFixed(1)}%
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="text-nowrap">
                                                            {f.desde && dias !== null ? (
                                                                <>
                                                                    <div>{formatearFechaNumerica(fechaDeISO(f.desde))}</div>
                                                                    <span className={`small ${dias > 30 ? "text-danger-emphasis fw-semibold" : "text-body-secondary"}`}>
                                                                        {antiguedad(dias)}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <span className="badge border bg-success-subtle text-success-emphasis border-success-subtle fw-normal">Pagado</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                    {reporte.totales.length > 0 && (
                                        <tfoot>
                                            {reporte.totales.map((t) => (
                                                <tr key={t.divisa.codigo} className="fw-bold">
                                                    <td>Total {t.divisa.codigo}</td>
                                                    {variasDivisas && <td>{t.divisa.codigo}</td>}
                                                    <td className="num">{t.abiertas}</td>
                                                    <td className="num">{formatearDineroDivisa(t.divisa.simbolo, t.total)}</td>
                                                    <td className="num">{formatearDineroDivisa(t.divisa.simbolo, t.abonado)}</td>
                                                    <td className="num">{formatearDineroDivisa(t.divisa.simbolo, t.saldo)}</td>
                                                    <td colSpan={2}></td>
                                                </tr>
                                            ))}
                                        </tfoot>
                                    )}
                                </table>
                            </TablaResponsive>
                        </div>
                        <div className="card-footer small text-body-secondary">
                            <i className="bi bi-info-circle me-1" aria-hidden="true"></i>
                            Saldos a hoy. Total = monto inicial + cargos; saldo = total − abonos. No incluye deudas canceladas.
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default ReporteDeudasView;
