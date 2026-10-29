import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../../layouts/components/PageHeader";
import AvisoSoloLectura from "../../../shared/components/AvisoSoloLectura";
import BotonDescargaExcel from "../../../shared/components/BotonDescargaExcel";
import BuscadorTabla from "../../../shared/components/BuscadorTabla";
import CampoNumero from "../../../shared/components/CampoNumero";
import SearchableSelect from "../../../shared/components/SearchableSelect";
import SkeletonTable from "../../../shared/components/SkeletonTable";
import TablaResponsive from "../../../shared/components/TablaResponsive";
import { useToastContext } from "../../../shared/context/ToastProvider";
import { useAuth } from "../../../shared/hooks/useAuth";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import { formatearKg, formatearPrecioKg } from "../../../shared/utils/numeros";
import GastoOperativoModal from "../components/GastoOperativoModal";
import HistorialCostoModal from "../components/HistorialCostoModal";
import { useCatalogosCartera } from "../hooks/useCatalogosCartera";
import {
    descargarUtilidadReal, guardarCostosVenta, obtenerUtilidadReal, type FilaUtilidad, type UtilidadReal,
} from "../services/cartera.service";
import { claseSaldo, dinero, fecha } from "../utils/cartera";

function hoyISO(): string {
    const hoy = new Date();
    return new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function margen(utilidad: number, venta: number): string {
    return venta ? `${((utilidad / venta) * 100).toFixed(1)}%` : "—";
}

/** Fila con el costo editado (sin guardar) aplicado: importe y utilidad al vuelo. */
function calcular(fila: FilaUtilidad, editado: string | undefined) {
    const costoUnitario = editado !== undefined ? (editado === "" ? null : Number(editado)) : fila.costo_unitario === null ? null : Number(fila.costo_unitario);
    const kilos = Number(fila.kilos);
    const venta = fila.venta === null ? null : Number(fila.venta);
    const costo = costoUnitario === null ? null : Math.round(kilos * costoUnitario * 100) / 100;
    const utilidad = venta !== null && costo !== null ? venta - costo : null;
    return { costoUnitario, kilos, venta, costo, utilidad };
}

/**
 * Utilidad real como la hoja Registro del área: las ventas ya registradas en
 * Inventario y el costo unitario que Cartera asigna rastreando la factura (si
 * falta, se propone el del lote). Al pie, gasto operativo por kilo y utilidad real.
 */
function UtilidadRealView() {
    const { puedeEditar } = useAuth();
    const editable = puedeEditar("CAR");
    const { mostrarToast } = useToastContext();
    const { clientes } = useCatalogosCartera((m) => mostrarToast("Error al cargar", m, "danger"));

    const hoy = hoyISO();
    const [desde, setDesde] = useState(hoy.slice(0, 8) + "01");
    const [hasta, setHasta] = useState(hoy);
    const [clienteId, setClienteId] = useState<number | "">("");
    const [busqueda, setBusqueda] = useState("");
    const [datos, setDatos] = useState<UtilidadReal | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [recarga, setRecarga] = useState(0);
    // Costos editados sin guardar: {linea_id: texto} ("" = volver al propuesto del lote).
    const [editados, setEditados] = useState<Record<number, string>>({});
    const [guardando, setGuardando] = useState(false);
    const [historial, setHistorial] = useState<FilaUtilidad | null>(null);
    const [verGasto, setVerGasto] = useState(false);

    const filtro = useMemo(() => ({ desde, hasta, cliente: clienteId || undefined }), [desde, hasta, clienteId]);

    useEffect(() => {
        if (!desde || !hasta) return;
        let vigente = true;
        obtenerUtilidadReal(filtro)
            .then((d) => { if (vigente) { setDatos(d); setError(null); } })
            .catch((e) => { if (vigente) setError(obtenerMensajeError(e)); });
        return () => { vigente = false; };
    }, [filtro, desde, hasta, recarga]);

    const filas = useMemo(() => {
        const t = busqueda.trim().toLowerCase();
        return (datos?.filas ?? []).filter((f) => !t || `${f.nota} ${f.cliente} ${f.producto} ${f.lote} ${f.proveedor}`.toLowerCase().includes(t));
    }, [datos, busqueda]);

    // Totales con lo editado aplicado, con la misma regla que el backend: sin precio o sin costo no suman.
    const totales = useMemo(() => {
        const t = { kilos: 0, venta: 0, costo: 0, utilidad: 0, gasto: 0, sinPrecio: 0, sinCosto: 0 };
        for (const f of filas) {
            const c = calcular(f, editados[f.linea_id]);
            if (c.venta === null) { t.sinPrecio += 1; continue; }
            if (c.costo === null) { t.sinCosto += 1; continue; }
            t.kilos += c.kilos;
            t.venta += c.venta;
            t.costo += c.costo;
            t.utilidad += c.venta - c.costo;
            t.gasto += c.kilos * Number(f.gasto_por_kilo);
        }
        return t;
    }, [filas, editados]);

    const pendientes = Object.keys(editados).length;

    async function guardar() {
        setGuardando(true);
        try {
            const cambios = await guardarCostosVenta(Object.entries(editados).map(([id, valor]) => ({
                linea_id: Number(id), costo_unitario: valor === "" ? null : Number(valor),
            })));
            mostrarToast("Costos guardados", `${cambios} costo(s) actualizados.`, "success");
            setEditados({});
            setRecarga((n) => n + 1);
        } catch (e) {
            mostrarToast("Error del servidor", obtenerMensajeError(e), "danger");
        } finally {
            setGuardando(false);
        }
    }

    function aMes(mes: string) {
        if (!mes) return;
        const [anio, m] = mes.split("-").map(Number);
        const ultimo = new Date(anio, m, 0).getDate();
        setDesde(`${mes}-01`);
        setHasta(`${mes}-${String(ultimo).padStart(2, "0")}`);
    }

    const real = totales.utilidad - totales.gasto;
    const opcionesClientes = clientes.map((c) => ({ value: c.id, label: c.nombre }));

    return (
        <>
            <PageHeader
                title="Utilidad real"
                subtitle="Ventas con el costo de cada factura y el gasto operativo"
                breadcrumbs={[{ label: "Inicio", to: "/" }, { label: "Cartera", to: "/cartera" }, { label: "Utilidad real" }]}
            />
            <div className="container-fluid">
                {!editable && <AvisoSoloLectura area="Cartera" />}

                <div className="card card-outline card-primary mb-3">
                    <div className="card-body d-flex flex-wrap gap-3 align-items-end">
                        <div>
                            <label className="form-label small fw-semibold text-uppercase text-body-secondary mb-1" htmlFor="utilidad-mes">Mes</label>
                            <input id="utilidad-mes" type="month" className="form-control form-control-sm" value={desde.slice(0, 7)}
                                onChange={(e) => aMes(e.target.value)} />
                        </div>
                        <div>
                            <label className="form-label small fw-semibold text-uppercase text-body-secondary mb-1" htmlFor="utilidad-desde">Desde</label>
                            <input id="utilidad-desde" type="date" className="form-control form-control-sm" value={desde} onChange={(e) => setDesde(e.target.value)} />
                        </div>
                        <div>
                            <label className="form-label small fw-semibold text-uppercase text-body-secondary mb-1" htmlFor="utilidad-hasta">Hasta</label>
                            <input id="utilidad-hasta" type="date" className="form-control form-control-sm" value={hasta} onChange={(e) => setHasta(e.target.value)} />
                        </div>
                        <div style={{ minWidth: "16rem" }}>
                            <span className="form-label small fw-semibold text-uppercase text-body-secondary mb-1 d-block">Cliente</span>
                            <SearchableSelect placeholder="Todos los clientes" options={opcionesClientes} value={clienteId} onChange={setClienteId} />
                        </div>
                        <button type="button" className="btn btn-sm btn-outline-secondary ms-auto" onClick={() => setVerGasto(true)}>
                            <i className="bi bi-gear me-1" aria-hidden="true"></i>
                            Gasto operativo: {datos ? formatearPrecioKg(datos.gasto_por_kilo) : "…"}/kg
                        </button>
                    </div>
                </div>

                <div className="row g-3 mb-3">
                    {[
                        { titulo: "Venta", valor: dinero(totales.venta), extra: `${formatearKg(totales.kilos)} kg` },
                        { titulo: "Costo", valor: dinero(totales.costo) },
                        { titulo: "Utilidad bruta", valor: dinero(totales.utilidad), extra: margen(totales.utilidad, totales.venta), clase: claseSaldo(-totales.utilidad) },
                        { titulo: "Gasto operativo", valor: dinero(totales.gasto), extra: "kilos × gasto por kg" },
                        { titulo: "Utilidad real", valor: dinero(real), extra: margen(real, totales.venta), clase: claseSaldo(-real) },
                    ].map((t) => (
                        <div key={t.titulo} className="col-6 col-lg">
                            <div className="border rounded p-3 h-100 bg-body">
                                <div className="small text-uppercase text-body-secondary fw-semibold">{t.titulo}</div>
                                <div className={`fs-5 fw-bold ${t.clase ?? ""}`}>{t.valor}</div>
                                {t.extra && <div className="small text-body-secondary">{t.extra}</div>}
                            </div>
                        </div>
                    ))}
                </div>

                {(totales.sinPrecio > 0 || totales.sinCosto > 0 || (datos?.resumen.costo_propuesto ?? 0) > 0) && (
                    <div className="alert alert-warning py-2 small" role="status">
                        {totales.sinPrecio > 0 && <div>{totales.sinPrecio} línea(s) sin precio: Inventario debe capturarlo. No suman.</div>}
                        {totales.sinCosto > 0 && <div>{totales.sinCosto} línea(s) sin costo (p. ej. ventas en resguardo): captura su costo. No suman.</div>}
                        {(datos?.resumen.costo_propuesto ?? 0) > 0 && (
                            <div>{datos?.resumen.costo_propuesto} línea(s) usan el costo propuesto del lote: confírmalo o corrígelo con el de la factura.</div>
                        )}
                    </div>
                )}

                <div className="card card-outline card-primary">
                    <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                        <h3 className="card-title mb-0 me-auto">Registro <span className="badge text-bg-secondary">{filas.length}</span></h3>
                        <BuscadorTabla valor={busqueda} onChange={setBusqueda} placeholder="Nota, cliente, producto, lote o proveedor..." />
                        <BotonDescargaExcel onDescargar={() => descargarUtilidadReal(filtro)} titulo="Descargar como la hoja Registro"
                            disabled={!datos || datos.filas.length === 0} />
                    </div>

                    {editable && pendientes > 0 && (
                        <div className="card-body py-2 border-bottom bg-warning-subtle d-flex flex-wrap gap-2 align-items-center">
                            <span className="small fw-semibold me-auto">{pendientes} costo(s) sin guardar.</span>
                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setEditados({})} disabled={guardando}>Descartar</button>
                            <button type="button" className="btn btn-sm btn-primary" onClick={guardar} disabled={guardando}>
                                <i className="bi bi-save me-1" aria-hidden="true"></i>{guardando ? "Guardando..." : "Guardar costos"}
                            </button>
                        </div>
                    )}

                    <div className="card-body p-0">
                        {error ? (
                            <div className="alert alert-danger m-3" role="alert">{error}</div>
                        ) : !datos ? (
                            <div className="p-3"><SkeletonTable columnas={8} filas={6} /></div>
                        ) : (
                            <TablaResponsive alturaMaxima="65vh">
                                <table className="table tabla-datos densidad-compacta mb-0">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Lote</th>
                                            <th>Nota</th>
                                            <th>Proveedor</th>
                                            <th>Cliente</th>
                                            <th>Producto</th>
                                            <th className="num">Kilos</th>
                                            <th className="num">Precio</th>
                                            <th className="num">Total venta</th>
                                            <th className="num" style={{ minWidth: "9rem" }}>Costo unitario</th>
                                            <th className="num">Importe</th>
                                            <th className="num">Utilidad</th>
                                            <th className="num">%</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filas.length === 0 ? (
                                            <tr><td colSpan={13} className="text-center text-body-secondary py-5">No hay ventas en el periodo.</td></tr>
                                        ) : filas.map((f) => {
                                            const editado = editados[f.linea_id];
                                            const c = calcular(f, editado);
                                            const propuesto = editado === undefined && !f.costo_capturado && f.costo_unitario !== null;
                                            return (
                                                <tr key={f.linea_id} className={editado !== undefined ? "table-warning" : undefined}>
                                                    <td className="text-nowrap">{fecha(f.fecha)}</td>
                                                    <td className="text-nowrap">
                                                        {f.lote === "RESGUARDO"
                                                            ? <span className="badge border bg-warning-subtle text-warning-emphasis border-warning-subtle">Resguardo</span>
                                                            : f.lote}
                                                    </td>
                                                    <td className="text-nowrap">{f.nota}</td>
                                                    <td className="truncar" title={f.proveedor}>{f.proveedor || "—"}</td>
                                                    <td className="truncar" title={f.cliente}>{f.cliente}</td>
                                                    <td className="text-nowrap">{f.producto}</td>
                                                    <td className="num">{formatearKg(f.kilos)}</td>
                                                    <td className="num">{f.precio !== null ? formatearPrecioKg(f.precio) : <span className="badge text-bg-light border">Sin precio</span>}</td>
                                                    <td className="num">{c.venta !== null ? dinero(c.venta) : "—"}</td>
                                                    <td className="num">
                                                        {editable ? (
                                                            <div className="d-flex gap-1 align-items-center">
                                                                <CampoNumero
                                                                    decimales={4}
                                                                    className={`form-control form-control-sm text-end ${propuesto ? "fst-italic text-body-secondary" : ""}`}
                                                                    aria-label={`Costo unitario de ${f.producto}, nota ${f.nota}`}
                                                                    title={propuesto ? "Propuesto del lote: captura el de la factura para confirmarlo" : undefined}
                                                                    value={editado ?? f.costo_unitario ?? ""}
                                                                    onChange={(v) => setEditados((a) => ({ ...a, [f.linea_id]: v }))}
                                                                />
                                                                <button type="button" className="btn btn-sm btn-link p-0 text-body-secondary"
                                                                    title="Historial del costo" aria-label={`Historial del costo de ${f.producto}, nota ${f.nota}`}
                                                                    onClick={() => setHistorial(f)}>
                                                                    <i className="bi bi-clock-history" aria-hidden="true"></i>
                                                                </button>
                                                            </div>
                                                        ) : c.costoUnitario !== null ? (
                                                            <span className={propuesto ? "fst-italic text-body-secondary" : undefined}>{formatearPrecioKg(c.costoUnitario)}</span>
                                                        ) : "—"}
                                                    </td>
                                                    <td className="num">{c.costo !== null ? dinero(c.costo) : <span className="badge text-bg-light border">Sin costo</span>}</td>
                                                    <td className={`num fw-semibold ${c.utilidad !== null ? claseSaldo(-c.utilidad) : ""}`}>{c.utilidad !== null ? dinero(c.utilidad) : "—"}</td>
                                                    <td className="num">{c.utilidad !== null && c.venta ? margen(c.utilidad, c.venta) : "—"}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="fw-bold">
                                            <td colSpan={6} className="text-end text-uppercase small">Totales</td>
                                            <td className="num">{formatearKg(totales.kilos)}</td>
                                            <td></td>
                                            <td className="num">{dinero(totales.venta)}</td>
                                            <td></td>
                                            <td className="num">{dinero(totales.costo)}</td>
                                            <td className="num">{dinero(totales.utilidad)}</td>
                                            <td className="num">{margen(totales.utilidad, totales.venta)}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan={11} className="text-end small">Gasto operativo (kilos × gasto por kg)</td>
                                            <td className="num">−{dinero(totales.gasto)}</td>
                                            <td></td>
                                        </tr>
                                        <tr className="fw-bold">
                                            <td colSpan={11} className="text-end text-uppercase small">Utilidad real</td>
                                            <td className={`num ${claseSaldo(-real)}`}>{dinero(real)}</td>
                                            <td className="num">{margen(real, totales.venta)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </TablaResponsive>
                        )}
                    </div>
                </div>
            </div>

            {historial && <HistorialCostoModal fila={historial} onCerrar={() => setHistorial(null)} />}
            {verGasto && (
                <GastoOperativoModal editable={editable} onCerrar={() => setVerGasto(false)} onCambio={() => setRecarga((n) => n + 1)} />
            )}
        </>
    );
}

export default UtilidadRealView;
