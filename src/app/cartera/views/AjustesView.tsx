import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "../../../layouts/components/PageHeader";
import Modal from "../../../shared/components/Modal";
import BuscadorTabla from "../../../shared/components/BuscadorTabla";
import FiltroChip from "../../../shared/components/FiltroChip";
import Paginacion from "../../../shared/components/Paginacion";
import SkeletonTable from "../../../shared/components/SkeletonTable";
import AvisoSoloLectura from "../../../shared/components/AvisoSoloLectura";
import MenuAccionesFila from "../../../shared/components/tabla/MenuAccionesFila";
import { usePaginacion } from "../../../shared/hooks/usePaginacion";
import { useAuth } from "../../../shared/hooks/useAuth";
import { useToastContext } from "../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import { primerYUltimoDiaDelMesActualISO } from "../../../shared/utils/fechas";
import AjusteForm, { type GuardarAjuste } from "../components/AjusteForm";
import CancelarMovimientoModal from "../components/CancelarMovimientoModal";
import { useCatalogosCartera } from "../hooks/useCatalogosCartera";
import type { AjusteCliente } from "../interfaces/Cartera";
import { actualizarAjuste, cancelarAjuste, crearAjuste, crearTraspaso, obtenerAjustes } from "../services/cartera.service";
import { dinero, fecha, rutaClienteCartera } from "../utils/cartera";

const POR_PAGINA = 50;
const OPCIONES_NATURALEZA = [
    { value: "C", label: "Cargos (suben el saldo)" },
    { value: "A", label: "Abonos (bajan el saldo)" },
    { value: "T", label: "Traspasos entre empresas" },
];
const OPCIONES_ESTADO = [
    { value: "activo", label: "Activos" },
    { value: "cancelado", label: "Cancelados" },
];

function AjustesView() {
    const { puedeEditar } = useAuth();
    const editable = puedeEditar("CAR");
    const { mostrarToast } = useToastContext();
    const [parametros, setParametros] = useSearchParams();
    const clienteParam = Number(parametros.get("cliente")) || undefined;
    const { clientes, empresas } = useCatalogosCartera((m) => mostrarToast("Error al cargar", m, "danger"));

    const mes = primerYUltimoDiaDelMesActualISO();
    const [desde, setDesde] = useState(clienteParam ? "" : mes.primerDia);
    const [hasta, setHasta] = useState(clienteParam ? "" : mes.ultimoDia);
    const [ajustes, setAjustes] = useState<AjusteCliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busqueda, setBusqueda] = useState("");
    const [naturaleza, setNaturaleza] = useState("");
    const [estado, setEstado] = useState("activo");
    const [formulario, setFormulario] = useState<{ ajuste: AjusteCliente | null } | null>(
        parametros.get("nuevo") && editable ? { ajuste: null } : null,
    );
    const [aCancelar, setACancelar] = useState<AjusteCliente | null>(null);

    async function cargar() {
        try {
            setAjustes(await obtenerAjustes({ desde: desde || undefined, hasta: hasta || undefined, cliente: clienteParam }));
            setError(null);
        } catch (err) {
            const mensaje = obtenerMensajeError(err);
            setError(mensaje);
            mostrarToast("Error al cargar", mensaje, "danger");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        // Diferido: la carga actualiza estado y no debe correr dentro del render del efecto.
        const temporizador = setTimeout(cargar, 0);
        return () => clearTimeout(temporizador);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [desde, hasta, clienteParam]);

    function cerrarFormulario() {
        setFormulario(null);
        if (parametros.get("nuevo")) {
            const nuevos = new URLSearchParams(parametros);
            nuevos.delete("nuevo");
            setParametros(nuevos, { replace: true });
        }
    }

    async function guardar(guardarAjuste: GuardarAjuste) {
        try {
            if (guardarAjuste.modo === "traspaso") {
                await crearTraspaso(guardarAjuste.datos);
                mostrarToast("Traspaso registrado", "El saldo pasó de una empresa a la otra.", "success");
            } else if (formulario?.ajuste) {
                await actualizarAjuste(formulario.ajuste.id, guardarAjuste.datos);
                mostrarToast("Ajuste actualizado", "Los cambios se guardaron correctamente.", "success");
            } else {
                await crearAjuste(guardarAjuste.datos);
                mostrarToast("Ajuste registrado", "El saldo del cliente ya lo refleja.", "success");
            }
            cerrarFormulario();
            await cargar();
        } catch (err) {
            mostrarToast("Error al guardar", obtenerMensajeError(err), "danger");
            throw err;
        }
    }

    const filtrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();
        return ajustes.filter((a) =>
            (!termino || `${a.cliente.nombre} ${a.concepto} ${a.notas}`.toLowerCase().includes(termino))
            && (!naturaleza || (naturaleza === "T" ? a.es_traspaso : a.naturaleza === naturaleza && !a.es_traspaso))
            && (!estado || (estado === "cancelado") === a.cancelado),
        );
    }, [ajustes, busqueda, naturaleza, estado]);

    const { pagina, setPagina, totalPaginas, inicio, fin } = usePaginacion(
        filtrados.length, POR_PAGINA, `${busqueda}|${naturaleza}|${estado}|${desde}|${hasta}`,
    );

    return (
        <>
            <PageHeader
                title="Ajustes"
                subtitle="Cargos, abonos en texto libre y traspasos de saldo entre empresas"
                breadcrumbs={[{ label: "Inicio", to: "/" }, { label: "Cartera", to: "/cartera" }, { label: "Ajustes" }]}
            />
            <div className="container-fluid">
                {!editable && <AvisoSoloLectura area="Cartera" />}
                <div className="card card-outline card-primary">
                    <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                        <h3 className="card-title mb-0 me-auto">Ajustes</h3>
                        <div className="d-flex align-items-center gap-1">
                            <input type="date" className="form-control form-control-sm" value={desde} onChange={(e) => setDesde(e.target.value)} aria-label="Desde" />
                            <span className="small">al</span>
                            <input type="date" className="form-control form-control-sm" value={hasta} onChange={(e) => setHasta(e.target.value)} aria-label="Hasta" />
                        </div>
                        {editable && (
                            <button className="btn btn-success btn-sm" onClick={() => setFormulario({ ajuste: null })}>
                                <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>Nuevo ajuste
                            </button>
                        )}
                    </div>
                    <div className="d-flex flex-wrap gap-2 align-items-center p-3 border-bottom">
                        <BuscadorTabla valor={busqueda} onChange={setBusqueda} placeholder="Buscar cliente o concepto..." />
                        <FiltroChip etiqueta="Tipo" icono="bi-sliders" valor={naturaleza} onChange={setNaturaleza} etiquetaTodos="Todos" opciones={OPCIONES_NATURALEZA} />
                        <FiltroChip etiqueta="Estado" icono="bi-flag" valor={estado} onChange={setEstado} etiquetaTodos="Todos" opciones={OPCIONES_ESTADO} />
                        <span className="ms-auto small text-body-secondary">{filtrados.length} ajuste(s)</span>
                    </div>
                    <div className="card-body p-0">
                        {error ? (
                            <div className="alert alert-danger m-3">{error}</div>
                        ) : loading ? (
                            <SkeletonTable columnas={7} filas={6} />
                        ) : (
                            <div className="table-responsive">
                                <table className="table tabla-datos mb-0">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Cliente</th>
                                            <th>Empresa</th>
                                            <th>Tipo</th>
                                            <th>Concepto</th>
                                            <th className="num">Cargo</th>
                                            <th className="num">Abono</th>
                                            <th>Capturó</th>
                                            <th className="text-end">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtrados.length === 0 ? (
                                            <tr><td colSpan={9} className="text-center text-body-secondary py-5">No hay ajustes con estos filtros.</td></tr>
                                        ) : filtrados.slice(inicio, fin).map((a) => {
                                            const tachado = a.cancelado ? "text-decoration-line-through text-body-secondary" : "";
                                            const cargo = a.naturaleza === "C";
                                            return (
                                                <tr key={a.id} className="fila-principal">
                                                    <td className={`text-nowrap ${tachado}`}>{fecha(a.fecha)}</td>
                                                    <td className="fw-semibold"><Link to={rutaClienteCartera(a.cliente.id)}>{a.cliente.nombre}</Link></td>
                                                    <td className="small">{a.empresa.nombre}</td>
                                                    <td>
                                                        {cargo ? (
                                                            <span className="badge border bg-danger-subtle text-danger-emphasis border-danger-subtle">Cargo</span>
                                                        ) : (
                                                            <span className="badge border bg-success-subtle text-success-emphasis border-success-subtle">Abono</span>
                                                        )}
                                                        {a.es_traspaso && a.contraparte && (
                                                            <span className="badge border bg-info-subtle text-info-emphasis border-info-subtle ms-1" title="Traspaso entre empresas">
                                                                <i className="bi bi-arrow-left-right me-1" aria-hidden="true"></i>
                                                                {cargo ? "desde" : "a"} {a.contraparte.empresa}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className={tachado}>
                                                        {a.concepto}
                                                        {a.notas && <div className="small text-body-secondary">{a.notas}</div>}
                                                        {a.cancelado && (
                                                            <span className="badge border bg-secondary-subtle text-secondary-emphasis border-secondary-subtle ms-1" title={a.motivo_cancelacion}>Cancelado</span>
                                                        )}
                                                    </td>
                                                    <td className={`num ${tachado}`}>{cargo ? dinero(a.monto) : ""}</td>
                                                    <td className={`num ${tachado}`}>{cargo ? "" : dinero(a.monto)}</td>
                                                    <td className="small text-nowrap">{a.usuario.username}</td>
                                                    <td className="text-end">
                                                        {editable && (
                                                            <MenuAccionesFila
                                                                etiqueta={`Acciones del ajuste ${a.concepto}`}
                                                                acciones={[
                                                                    {
                                                                        etiqueta: "Editar", icono: "bi-pencil", onClick: () => setFormulario({ ajuste: a }),
                                                                        motivoBloqueo: a.cancelado ? "Está cancelado" : a.es_traspaso ? "Un traspaso no se edita: cancélalo y regístralo de nuevo" : null,
                                                                    },
                                                                    {
                                                                        etiqueta: a.es_traspaso ? "Cancelar traspaso" : "Cancelar ajuste", icono: "bi-x-circle", variante: "danger" as const,
                                                                        onClick: () => setACancelar(a), motivoBloqueo: a.cancelado ? "Ya está cancelado" : null,
                                                                    },
                                                                ]}
                                                            />
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                    {!loading && !error && (
                        <div className="card-footer d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <small className="text-body-secondary">
                                {filtrados.length === 0 ? "Sin resultados" : `Mostrando ${inicio + 1}-${Math.min(fin, filtrados.length)} de ${filtrados.length}`}
                            </small>
                            <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
                        </div>
                    )}
                </div>
            </div>

            <Modal title={formulario?.ajuste ? "Editar ajuste" : "Nuevo ajuste"} show={formulario !== null} size="modal-lg" onClose={cerrarFormulario}>
                {formulario && empresas.length > 0 && (
                    <AjusteForm
                        key={formulario.ajuste?.id ?? "nuevo"}
                        ajuste={formulario.ajuste}
                        clientes={clientes}
                        empresas={empresas}
                        clienteInicial={clienteParam}
                        onGuardar={guardar}
                        onCancelar={cerrarFormulario}
                    />
                )}
            </Modal>

            <CancelarMovimientoModal
                descripcion={aCancelar ? `${aCancelar.es_traspaso ? "el traspaso" : "el ajuste"} "${aCancelar.concepto}" de ${aCancelar.cliente.nombre} por ${dinero(aCancelar.monto)}` : null}
                aviso={aCancelar?.es_traspaso ? "Se cancelan los dos movimientos del traspaso (las dos empresas)." : undefined}
                onClose={() => setACancelar(null)}
                onConfirmar={async (motivo) => {
                    if (!aCancelar) return;
                    await cancelarAjuste(aCancelar.id, motivo);
                    setACancelar(null);
                    mostrarToast("Ajuste cancelado", "Ya no cuenta en el saldo del cliente.", "success");
                    await cargar();
                }}
            />
        </>
    );
}

export default AjustesView;
