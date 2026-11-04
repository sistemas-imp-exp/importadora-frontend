import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../../layouts/components/PageHeader";
import FiltroChip from "../../../shared/components/FiltroChip";
import SkeletonTable from "../../../shared/components/SkeletonTable";
import TablaResponsive from "../../../shared/components/TablaResponsive";
import { useToastContext } from "../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import { hoyISO } from "../../../shared/utils/fechas";
import BotonesDescarga from "../components/BotonesDescarga";
import { useCatalogosGanado } from "../hooks/useCatalogosGanado";
import type { InventarioGanado } from "../interfaces/Ganado";
import { descargarInventario, obtenerInventario, type FiltroInventario } from "../services/ganado.service";
import { fecha } from "../utils/ganado";

const CAMPOS = ["hembras", "machos", "con_arete", "sin_arete", "total"] as const;

/** Cabezas por rancho a una fecha; con "Ver animales", la lista de cada rancho con su arete en 3 columnas (como las hojas del área). */
function ReporteInventarioView() {
    const { mostrarToast } = useToastContext();
    const { ranchos, especies } = useCatalogosGanado((m) => mostrarToast("Error al cargar", m, "danger"));
    const [filtro, setFiltro] = useState<FiltroInventario>({ fecha: hoyISO() });
    const [datos, setDatos] = useState<InventarioGanado | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [verAnimales, setVerAnimales] = useState(false);

    useEffect(() => {
        if (!filtro.fecha) return;
        const control = new AbortController();
        const temporizador = setTimeout(async () => {
            setCargando(true);
            try {
                setDatos(await obtenerInventario(filtro, control.signal));
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
    }, [filtro]);

    return (
        <>
            <PageHeader
                title="Inventario de ganado"
                subtitle="Cabezas por rancho, especie y categoría a una fecha"
                breadcrumbs={[{ label: "Inicio", to: "/" }, { label: "Ganado", to: "/ganado" }, { label: "Inventario" }]}
            />
            <div className="container-fluid">
                <div className="card card-outline card-primary">
                    <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                        <h3 className="card-title mb-0 me-auto">
                            Al {fecha(filtro.fecha)}
                            {datos && <span className="ms-2 badge text-bg-primary">{datos.totales.total ?? 0} cabezas</span>}
                        </h3>
                        <BotonesDescarga disabled={!filtro.fecha} onDescargar={(formato) => descargarInventario(filtro, formato)} />
                    </div>
                    <div className="d-flex flex-wrap gap-2 align-items-center p-3 border-bottom">
                        <input type="date" className="form-control form-control-sm" style={{ maxWidth: "11rem" }} aria-label="Fecha"
                            max={hoyISO()} value={filtro.fecha ?? ""} onChange={(e) => setFiltro({ ...filtro, fecha: e.target.value })} />
                        <FiltroChip etiqueta="Rancho" icono="bi-house" valor={filtro.rancho ?? ""} onChange={(v) => setFiltro({ ...filtro, rancho: v })}
                            etiquetaTodos="Todos los ranchos" opciones={ranchos.map((r) => ({ value: String(r.id), label: r.nombre }))} />
                        <FiltroChip etiqueta="Especie" icono="bi-tag" valor={filtro.especie ?? ""} onChange={(v) => setFiltro({ ...filtro, especie: v })}
                            etiquetaTodos="Todas" opciones={especies.map((e) => ({ value: String(e.id), label: e.nombre }))} />
                        <div className="form-check form-switch ms-auto">
                            <input id="ver-animales" type="checkbox" className="form-check-input" checked={verAnimales}
                                onChange={(e) => setVerAnimales(e.target.checked)} />
                            <label className="form-check-label small" htmlFor="ver-animales">Ver animales</label>
                        </div>
                    </div>
                    <div className="card-body p-0">
                        {error ? (
                            <div className="alert alert-danger m-3">{error}</div>
                        ) : !datos ? (
                            <SkeletonTable columnas={8} filas={8} />
                        ) : datos.ranchos.length === 0 ? (
                            <p className="text-center text-body-secondary py-5 mb-0">Sin cabezas a esa fecha.</p>
                        ) : (
                            <TablaResponsive alturaMaxima="70vh">
                                <table className={`table tabla-datos tabla-hoja mb-0 ${cargando ? "opacity-50" : ""}`}>
                                    <thead className="sticky-top">
                                        <tr>
                                            <th>Especie</th>
                                            <th>Categoría</th>
                                            <th className="num">Hembras</th>
                                            <th className="num">Machos</th>
                                            <th className="num">Con arete</th>
                                            <th className="num">Sin arete</th>
                                            <th className="num">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {datos.ranchos.map((bloque) => (
                                            <Fragment key={bloque.rancho.id}>
                                                <tr className="fila-bloque">
                                                    <td colSpan={6} className="fw-semibold">{bloque.rancho.nombre}</td>
                                                    <td className="num fw-semibold">{bloque.total}</td>
                                                </tr>
                                                {bloque.filas.map((f) => (
                                                    <tr key={`${f.especie}-${f.categoria}`}>
                                                        <td className="small">{f.especie}</td>
                                                        <td>{f.categoria}</td>
                                                        {CAMPOS.map((c) => <td key={c} className={`num ${c === "total" ? "fw-semibold" : ""}`}>{f[c]}</td>)}
                                                    </tr>
                                                ))}
                                                {verAnimales && bloque.animales && (
                                                    <tr>
                                                        <td colSpan={7} className="p-0">
                                                            <table className="table table-sm tabla-datos tabla-excel mb-0">
                                                                <thead>
                                                                    <tr>
                                                                        <th>Categoría</th><th>Sexo</th>
                                                                        <th colSpan={3} className="text-center">Arete</th>
                                                                        <th>Folio</th><th>Raza / color</th><th>Nacimiento</th><th>Notas</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {bloque.animales.map((a) => (
                                                                        <tr key={a.id}>
                                                                            <td>{a.categoria}</td>
                                                                            <td>{a.sexo === "H" ? "Hembra" : "Macho"}</td>
                                                                            <td className="font-monospace">{a.arete_1}</td>
                                                                            <td className="font-monospace">{a.arete_2}</td>
                                                                            <td className="font-monospace">{a.arete_3 || "S/A"}</td>
                                                                            <td><Link to={`/ganado/animales/${a.id}`}>{a.folio}</Link></td>
                                                                            <td className="small">{a.raza}</td>
                                                                            <td className="text-nowrap">{fecha(a.fecha_nacimiento)}</td>
                                                                            <td className="small">{a.notas}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        ))}
                                    </tbody>
                                    {datos.ranchos.length > 1 && (
                                        <tfoot>
                                            <tr className="fw-semibold">
                                                <td colSpan={2}>Total general</td>
                                                {CAMPOS.map((c) => <td key={c} className="num">{datos.totales[c] ?? 0}</td>)}
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </TablaResponsive>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default ReporteInventarioView;
