import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../../layouts/components/PageHeader";
import Modal from "../../../shared/components/Modal";
import BuscadorTabla from "../../../shared/components/BuscadorTabla";
import FiltroChip from "../../../shared/components/FiltroChip";
import Paginacion from "../../../shared/components/Paginacion";
import SkeletonTable from "../../../shared/components/SkeletonTable";
import AvisoSoloLectura from "../../../shared/components/AvisoSoloLectura";
import TablaResponsive from "../../../shared/components/TablaResponsive";
import MenuAccionesFila from "../../../shared/components/tabla/MenuAccionesFila";
import { useAuth } from "../../../shared/hooks/useAuth";
import { useToastContext } from "../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import { primerYUltimoDiaDelMesActualISO } from "../../../shared/utils/fechas";
import CancelarMovimientoGanado from "../components/CancelarMovimientoGanado";
import DetalleMovimiento from "../components/DetalleMovimiento";
import MovimientoForm from "../components/MovimientoForm";
import { useCatalogosGanado } from "../hooks/useCatalogosGanado";
import type { Movimiento, TipoMovimiento } from "../interfaces/Ganado";
import {
    cancelarMovimiento, crearMovimiento, editarMovimiento, obtenerMovimientos, type FiltroMovimientos,
} from "../services/ganado.service";
import { AREA_GANADO, TIPOS, TODOS_MOTIVOS, claseBadge, claseTipo, dinero, fecha, nombreUsuario } from "../utils/ganado";

const POR_PAGINA = 50;
const TIPOS_VALIDOS = ["ALTA", "BAJA", "TRASPASO"];

function MovimientosView() {
    const { puedeEditar } = useAuth();
    const editable = puedeEditar(AREA_GANADO);
    const { mostrarToast } = useToastContext();
    const [parametros, setParametros] = useSearchParams();
    const { ranchos, especies, categorias } = useCatalogosGanado((m) => mostrarToast("Error al cargar", m, "danger"));

    const mes = primerYUltimoDiaDelMesActualISO();
    const [filtro, setFiltro] = useState<FiltroMovimientos>({ desde: mes.primerDia, hasta: mes.ultimoDia });
    const [busqueda, setBusqueda] = useState("");
    const [pagina, setPagina] = useState(1);
    const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [version, setVersion] = useState(0);
    const nuevoParam = parametros.get("nuevo") ?? "";
    const [nuevo, setNuevo] = useState<TipoMovimiento | null>(
        editable && TIPOS_VALIDOS.includes(nuevoParam) ? nuevoParam as TipoMovimiento : null,
    );
    const [detalle, setDetalle] = useState<number | null>(null);
    const [aCancelar, setACancelar] = useState<Movimiento | null>(null);

    useEffect(() => {
        const control = new AbortController();
        const temporizador = setTimeout(async () => {
            setLoading(true);
            try {
                const datos = await obtenerMovimientos({ ...filtro, q: busqueda, page: pagina, por_pagina: POR_PAGINA }, control.signal);
                setMovimientos(datos.results);
                setTotal(datos.count);
                setError(null);
            } catch (err) {
                if (control.signal.aborted) return;
                setError(obtenerMensajeError(err));
            } finally {
                if (!control.signal.aborted) setLoading(false);
            }
        }, 300);
        return () => {
            clearTimeout(temporizador);
            control.abort();
        };
    }, [filtro, busqueda, pagina, version]);

    function filtrar(cambios: Partial<FiltroMovimientos>) {
        setFiltro((f) => ({ ...f, ...cambios }));
        setPagina(1);
    }

    function cerrarNuevo() {
        setNuevo(null);
        if (parametros.get("nuevo")) {
            const siguientes = new URLSearchParams(parametros);
            siguientes.delete("nuevo");
            setParametros(siguientes, { replace: true });
        }
    }

    const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
    const inicio = (pagina - 1) * POR_PAGINA;

    return (
        <>
            <PageHeader
                title="Movimientos de ganado"
                subtitle="Altas (compra, nacimiento, regalo), bajas (venta, muerte) y traspasos entre ranchos"
                breadcrumbs={[{ label: "Inicio", to: "/" }, { label: "Ganado", to: "/ganado" }, { label: "Movimientos" }]}
            />
            <div className="container-fluid">
                {!editable && <AvisoSoloLectura area="Ganado" />}
                <div className="card card-outline card-primary">
                    <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                        <h3 className="card-title mb-0 me-auto">Movimientos</h3>
                        <div className="d-flex align-items-center gap-1">
                            <input type="date" className="form-control form-control-sm" aria-label="Desde" value={filtro.desde ?? ""}
                                onChange={(e) => filtrar({ desde: e.target.value })} />
                            <span className="small">al</span>
                            <input type="date" className="form-control form-control-sm" aria-label="Hasta" value={filtro.hasta ?? ""}
                                onChange={(e) => filtrar({ hasta: e.target.value })} />
                        </div>
                        {editable && TIPOS.map((t) => (
                            <button key={t.value} className={`btn btn-sm ${t.value === "ALTA" ? "btn-success" : t.value === "BAJA" ? "btn-outline-danger" : "btn-outline-primary"}`}
                                onClick={() => setNuevo(t.value)}>
                                <i className={`bi ${t.value === "ALTA" ? "bi-plus-lg" : t.value === "BAJA" ? "bi-dash-lg" : "bi-arrow-left-right"} me-1`} aria-hidden="true"></i>
                                {t.label}
                            </button>
                        ))}
                    </div>
                    <div className="d-flex flex-wrap gap-2 align-items-center p-3 border-bottom">
                        <BuscadorTabla valor={busqueda} onChange={(v) => { setBusqueda(v); setPagina(1); }} placeholder="Buscar folio, arete, contraparte o notas..." />
                        <FiltroChip etiqueta="Rancho" icono="bi-house" valor={filtro.rancho ?? ""} onChange={(v) => filtrar({ rancho: v })}
                            etiquetaTodos="Todos los ranchos" opciones={ranchos.map((r) => ({ value: String(r.id), label: r.nombre }))} />
                        <FiltroChip etiqueta="Tipo" icono="bi-sliders" valor={filtro.tipo ?? ""} onChange={(v) => filtrar({ tipo: v, motivo: "" })}
                            etiquetaTodos="Todos" opciones={TIPOS} />
                        <FiltroChip etiqueta="Motivo" icono="bi-question-circle" valor={filtro.motivo ?? ""} onChange={(v) => filtrar({ motivo: v })}
                            etiquetaTodos="Todos" opciones={TODOS_MOTIVOS.filter((m) => !filtro.tipo || (filtro.tipo === "ALTA") === ["COMPRA", "NACIMIENTO", "REGALO"].includes(m.value))} />
                        <FiltroChip etiqueta="Cancelados" icono="bi-x-circle" valor={filtro.cancelados ?? ""} onChange={(v) => filtrar({ cancelados: v })}
                            etiquetaTodos="Sin cancelados" opciones={[{ value: "1", label: "Incluir cancelados" }]} />
                        <span className="ms-auto small text-body-secondary">{total} movimiento(s)</span>
                    </div>
                    <div className="card-body p-0">
                        {error ? (
                            <div className="alert alert-danger m-3">{error}</div>
                        ) : loading && movimientos.length === 0 ? (
                            <SkeletonTable columnas={9} filas={6} />
                        ) : (
                            <TablaResponsive alturaMaxima="70vh">
                                <table className={`table tabla-datos mb-0 ${loading ? "opacity-50" : ""}`}>
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Folio</th>
                                            <th>Movimiento</th>
                                            <th>Rancho</th>
                                            <th>Destino</th>
                                            <th className="num">Cabezas</th>
                                            <th>Animales</th>
                                            <th>Contraparte</th>
                                            <th className="num">Importe</th>
                                            <th>Capturó</th>
                                            <th className="text-end">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {movimientos.length === 0 ? (
                                            <tr><td colSpan={11} className="text-center text-body-secondary py-5">No hay movimientos con estos filtros.</td></tr>
                                        ) : movimientos.map((m) => {
                                            const tachado = m.cancelado ? "text-decoration-line-through text-body-secondary" : "";
                                            return (
                                                <tr key={m.id}>
                                                    <td className={`text-nowrap ${tachado}`}>{fecha(m.fecha)}</td>
                                                    <td className="text-nowrap">
                                                        <button type="button" className="btn btn-link btn-sm p-0" onClick={() => setDetalle(m.id)}>{m.folio}</button>
                                                    </td>
                                                    <td className="text-nowrap">
                                                        <span className={claseTipo(m.tipo)}>{m.tipo_nombre}{m.motivo_nombre && ` · ${m.motivo_nombre}`}</span>
                                                        {m.cancelado && <span className={`${claseBadge("secondary")} ms-1`} title={m.motivo_cancelacion}>Cancelado</span>}
                                                    </td>
                                                    <td className={tachado}>{m.rancho.nombre}</td>
                                                    <td className={tachado}>{m.rancho_destino?.nombre}</td>
                                                    <td className={`num fw-semibold ${tachado}`}>{m.cabezas}</td>
                                                    <td className={`small ${tachado}`}>
                                                        {m.resumen}
                                                        {m.notas && <div className="text-body-secondary">{m.notas}</div>}
                                                    </td>
                                                    <td className={`small ${tachado}`}>{m.contraparte}</td>
                                                    <td className={`num ${tachado}`}>{dinero(m.importe)}</td>
                                                    <td className="small text-nowrap">{nombreUsuario(m.usuario)}</td>
                                                    <td className="text-end">
                                                        <MenuAccionesFila
                                                            etiqueta={`Acciones de ${m.folio}`}
                                                            acciones={[
                                                                { etiqueta: editable && !m.cancelado ? "Ver y editar" : "Ver detalle", icono: "bi-eye", onClick: () => setDetalle(m.id) },
                                                                ...(editable ? [{
                                                                    etiqueta: "Cancelar", icono: "bi-x-circle", variante: "danger" as const,
                                                                    onClick: () => setACancelar(m), motivoBloqueo: m.cancelado ? "Ya está cancelado" : null,
                                                                }] : []),
                                                            ]}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </TablaResponsive>
                        )}
                    </div>
                    {!error && (
                        <div className="card-footer d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <small className="text-body-secondary">
                                {total === 0 ? "Sin resultados" : `Mostrando ${inicio + 1}-${Math.min(inicio + POR_PAGINA, total)} de ${total}`}
                            </small>
                            <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
                        </div>
                    )}
                </div>
            </div>

            <Modal title="Nuevo movimiento" show={nuevo !== null} size="modal-xl" onClose={cerrarNuevo}>
                {nuevo && categorias.length > 0 && (
                    <MovimientoForm
                        key={nuevo}
                        tipoInicial={nuevo}
                        ranchos={ranchos}
                        especies={especies}
                        categorias={categorias}
                        onCancelar={cerrarNuevo}
                        onGuardar={async (datos) => {
                            const creado = await crearMovimiento(datos);
                            mostrarToast("Movimiento registrado", `${creado.folio}: ${creado.cabezas} cabeza(s).`, "success");
                            cerrarNuevo();
                            setVersion((v) => v + 1);
                        }}
                    />
                )}
            </Modal>

            <Modal title="Movimiento" show={detalle !== null} size="modal-lg" onClose={() => setDetalle(null)}>
                {detalle !== null && (
                    <DetalleMovimiento
                        key={detalle}
                        id={detalle}
                        editable={editable}
                        onCerrar={() => setDetalle(null)}
                        onGuardar={async (cambios) => {
                            await editarMovimiento(detalle, cambios);
                            mostrarToast("Movimiento actualizado", "Los cambios se guardaron correctamente.", "success");
                            setDetalle(null);
                            setVersion((v) => v + 1);
                        }}
                    />
                )}
            </Modal>

            <CancelarMovimientoGanado
                descripcion={aCancelar ? `el movimiento ${aCancelar.folio} (${aCancelar.tipo_nombre.toLowerCase()} de ${aCancelar.cabezas} cabeza(s))` : null}
                aviso={aCancelar?.tipo === "ALTA"
                    ? "Los animales de esta alta dejan de existir en el inventario."
                    : "Los animales regresan a donde estaban antes de este movimiento. Solo se cancela si es su último movimiento."}
                onClose={() => setACancelar(null)}
                onConfirmar={async (motivo) => {
                    if (!aCancelar) return;
                    await cancelarMovimiento(aCancelar.id, motivo);
                    setACancelar(null);
                    mostrarToast("Movimiento cancelado", "El inventario ya lo refleja.", "success");
                    setVersion((v) => v + 1);
                }}
            />
        </>
    );
}

export default MovimientosView;
