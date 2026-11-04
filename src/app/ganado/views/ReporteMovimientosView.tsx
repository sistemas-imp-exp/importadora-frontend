import { useEffect, useState } from "react";
import PageHeader from "../../../layouts/components/PageHeader";
import FiltroChip from "../../../shared/components/FiltroChip";
import SkeletonTable from "../../../shared/components/SkeletonTable";
import TablaResponsive from "../../../shared/components/TablaResponsive";
import { useToastContext } from "../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import { primerYUltimoDiaDelMesActualISO } from "../../../shared/utils/fechas";
import BotonesDescarga from "../components/BotonesDescarga";
import { useCatalogosGanado } from "../hooks/useCatalogosGanado";
import type { FilaBalance, ReporteMovimientos } from "../interfaces/Ganado";
import {
    descargarReporteMovimientos, obtenerReporteMovimientos, type FiltroReporteMovimientos,
} from "../services/ganado.service";
import { TIPOS, TODOS_MOTIVOS, claseTipo, dinero, fecha } from "../utils/ganado";

const CONCEPTOS: { campo: keyof Omit<FilaBalance, "rancho">; titulo: string; signo?: "+" | "−" }[] = [
    { campo: "inicial", titulo: "Inicial" },
    { campo: "compras", titulo: "Compras", signo: "+" },
    { campo: "nacimientos", titulo: "Nacimientos", signo: "+" },
    { campo: "regalos", titulo: "Regalos", signo: "+" },
    { campo: "recibidos", titulo: "Traspasos recibidos", signo: "+" },
    { campo: "enviados", titulo: "Traspasos enviados", signo: "−" },
    { campo: "ventas", titulo: "Ventas", signo: "−" },
    { campo: "muertes", titulo: "Muertes", signo: "−" },
    { campo: "final", titulo: "Final" },
];

/** Balance de cabezas por rancho en un periodo y los movimientos que lo explican. */
function ReporteMovimientosView() {
    const { mostrarToast } = useToastContext();
    const { ranchos } = useCatalogosGanado((m) => mostrarToast("Error al cargar", m, "danger"));
    const mes = primerYUltimoDiaDelMesActualISO();
    const [filtro, setFiltro] = useState<FiltroReporteMovimientos>({ desde: mes.primerDia, hasta: mes.ultimoDia });
    const [datos, setDatos] = useState<ReporteMovimientos | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const completo = !!filtro.desde && !!filtro.hasta;

    useEffect(() => {
        if (!completo) return;
        const control = new AbortController();
        const temporizador = setTimeout(async () => {
            setCargando(true);
            try {
                setDatos(await obtenerReporteMovimientos(filtro, control.signal));
                setError(null);
            } catch (err) {
                if (control.signal.aborted) return;
                setError(obtenerMensajeError(err));
            } finally {
                if (!control.signal.aborted) setCargando(false);
            }
        }, 250);
        return () => {
            clearTimeout(temporizador);
            control.abort();
        };
    }, [filtro, completo]);

    const totales = Object.fromEntries(CONCEPTOS.map(({ campo }) => [
        campo, (datos?.balance ?? []).reduce((acc, f) => acc + f[campo], 0),
    ]));

    return (
        <>
            <PageHeader
                title="Movimientos de ganado"
                subtitle="Balance por rancho: inicial + altas + traspasos recibidos − enviados − bajas = final"
                breadcrumbs={[{ label: "Inicio", to: "/" }, { label: "Ganado", to: "/ganado" }, { label: "Reporte de movimientos" }]}
            />
            <div className="container-fluid">
                <div className="card card-outline card-primary mb-3">
                    <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                        <h3 className="card-title mb-0 me-auto">Balance de cabezas</h3>
                        <BotonesDescarga disabled={!completo} onDescargar={(formato) => descargarReporteMovimientos(filtro, formato)} />
                    </div>
                    <div className="d-flex flex-wrap gap-2 align-items-center p-3 border-bottom">
                        <div className="d-flex align-items-center gap-1">
                            <input type="date" className="form-control form-control-sm" aria-label="Desde" value={filtro.desde}
                                onChange={(e) => setFiltro({ ...filtro, desde: e.target.value })} />
                            <span className="small">al</span>
                            <input type="date" className="form-control form-control-sm" aria-label="Hasta" value={filtro.hasta}
                                onChange={(e) => setFiltro({ ...filtro, hasta: e.target.value })} />
                        </div>
                        <FiltroChip etiqueta="Rancho" icono="bi-house" valor={filtro.rancho ?? ""} onChange={(v) => setFiltro({ ...filtro, rancho: v })}
                            etiquetaTodos="Todos los ranchos" opciones={ranchos.map((r) => ({ value: String(r.id), label: r.nombre }))} />
                        <FiltroChip etiqueta="Tipo" icono="bi-sliders" valor={filtro.tipo ?? ""} onChange={(v) => setFiltro({ ...filtro, tipo: v, motivo: "" })}
                            etiquetaTodos="Todos" opciones={TIPOS} />
                        <FiltroChip etiqueta="Motivo" icono="bi-question-circle" valor={filtro.motivo ?? ""} onChange={(v) => setFiltro({ ...filtro, motivo: v })}
                            etiquetaTodos="Todos" opciones={TODOS_MOTIVOS} />
                        <span className="small text-body-secondary ms-auto">Tipo y motivo filtran la lista de movimientos, no el balance.</span>
                    </div>
                    <div className="card-body p-0">
                        {!completo ? (
                            <p className="text-center text-body-secondary py-4 mb-0">Indica el periodo.</p>
                        ) : error ? (
                            <div className="alert alert-danger m-3">{error}</div>
                        ) : !datos ? (
                            <SkeletonTable columnas={10} filas={5} />
                        ) : (
                            <div className={`table-responsive ${cargando ? "opacity-50" : ""}`}>
                                <table className="table tabla-datos tabla-excel mb-0">
                                    <thead>
                                        <tr>
                                            <th>Rancho</th>
                                            {CONCEPTOS.map((c) => (
                                                <th key={c.campo} className="num">{c.signo && <span className="me-1">{c.signo}</span>}{c.titulo}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {datos.balance.length === 0 ? (
                                            <tr><td colSpan={10} className="text-center text-body-secondary py-4">Sin cabezas en el periodo.</td></tr>
                                        ) : datos.balance.map((f) => (
                                            <tr key={f.rancho.id}>
                                                <td className="fw-semibold">{f.rancho.nombre}</td>
                                                {CONCEPTOS.map(({ campo }) => (
                                                    <td key={campo} className={`num ${campo === "inicial" || campo === "final" ? "fw-semibold" : ""}`}>
                                                        {f[campo] || (campo === "inicial" || campo === "final" ? 0 : "")}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                    {datos.balance.length > 1 && (
                                        <tfoot>
                                            <tr className="fw-semibold">
                                                <td>Total</td>
                                                {CONCEPTOS.map(({ campo }) => <td key={campo} className="num">{totales[campo]}</td>)}
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {completo && datos && (
                    <div className="card card-outline card-primary">
                        <div className="card-header">
                            <h3 className="card-title mb-0">Movimientos <span className="text-body-secondary small">({datos.movimientos.length})</span></h3>
                        </div>
                        <div className="card-body p-0">
                            <TablaResponsive alturaMaxima="60vh">
                                <table className="table tabla-datos tabla-excel mb-0">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th><th>Folio</th><th>Movimiento</th><th>Rancho</th><th>Destino</th>
                                            <th className="num">Cab.</th><th>Animales</th><th>Contraparte</th><th className="num">Importe</th><th>Notas</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {datos.movimientos.length === 0 ? (
                                            <tr><td colSpan={10} className="text-center text-body-secondary py-4">Sin movimientos en el periodo.</td></tr>
                                        ) : datos.movimientos.map((m) => (
                                            <tr key={m.id}>
                                                <td className="text-nowrap">{fecha(m.fecha)}</td>
                                                <td className="text-nowrap">{m.folio}</td>
                                                <td className="text-nowrap">
                                                    <span className={claseTipo(m.tipo)}>{m.tipo_nombre}{m.motivo_nombre && ` · ${m.motivo_nombre}`}</span>
                                                </td>
                                                <td>{m.rancho}</td>
                                                <td>{m.rancho_destino}</td>
                                                <td className="num fw-semibold">{m.cabezas}</td>
                                                <td className="small">
                                                    {m.resumen}
                                                    <div className="text-body-secondary font-monospace" style={{ maxWidth: "28rem" }}>{m.animales}</div>
                                                </td>
                                                <td className="small">{m.contraparte}</td>
                                                <td className="num">{dinero(m.importe)}</td>
                                                <td className="small">{m.notas}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </TablaResponsive>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default ReporteMovimientosView;
