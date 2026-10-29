import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import PageHeader from "../../../layouts/components/PageHeader";
import Modal from "../../../shared/components/Modal";
import BuscadorTabla from "../../../shared/components/BuscadorTabla";
import FiltroChip from "../../../shared/components/FiltroChip";
import Paginacion from "../../../shared/components/Paginacion";
import SearchableSelect from "../../../shared/components/SearchableSelect";
import SkeletonTable from "../../../shared/components/SkeletonTable";
import AvisoSoloLectura from "../../../shared/components/AvisoSoloLectura";
import MenuAccionesFila from "../../../shared/components/tabla/MenuAccionesFila";
import { usePaginacion } from "../../../shared/hooks/usePaginacion";
import { useAuth } from "../../../shared/hooks/useAuth";
import { useToastContext } from "../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import { formatearFechaNumerica, hoyISO, primerYUltimoDiaDelMesActualISO } from "../../../shared/utils/fechas";
import CancelarMovimientoModal from "../components/CancelarMovimientoModal";
import PagoForm from "../components/PagoForm";
import { useCatalogosCartera } from "../hooks/useCatalogosCartera";
import { TIPOS_PAGO, type ClienteCartera, type PagoCliente, type PagoClienteRequest, type TipoPago } from "../interfaces/Cartera";
import { actualizarPago, cancelarPago, crearPago, descargarPagos, identificarPago, obtenerPagos } from "../services/cartera.service";
import BotonDescargaExcel from "../../../shared/components/BotonDescargaExcel";
import { dinero, fecha, rutaClienteCartera } from "../utils/cartera";

const POR_PAGINA = 50;
const OPCIONES_ESTADO = [
    { value: "activo", label: "Activos" },
    { value: "cancelado", label: "Cancelados" },
];

type Pestana = "identificados" | "por_identificar";

/** Días desde la fecha del pago hasta hoy (seguimiento de los que no tienen cliente). */
function diasDesde(iso: string): number {
    const ms = new Date(hoyISO() + "T12:00:00").getTime() - new Date(iso + "T12:00:00").getTime();
    return Math.max(0, Math.round(ms / 86_400_000));
}

function claseAntiguedad(dias: number): string {
    if (dias > 60) return "bg-danger-subtle text-danger-emphasis border-danger-subtle";
    if (dias > 15) return "bg-warning-subtle text-warning-emphasis border-warning-subtle";
    return "bg-light text-body-secondary";
}

function PagosView() {
    const { puedeEditar } = useAuth();
    const editable = puedeEditar("CAR");
    const { mostrarToast } = useToastContext();
    const navigate = useNavigate();
    const [parametros, setParametros] = useSearchParams();
    const clienteParam = Number(parametros.get("cliente")) || undefined;
    const { clientes, empresas } = useCatalogosCartera((m) => mostrarToast("Error al cargar", m, "danger"));

    const mes = primerYUltimoDiaDelMesActualISO();
    const [pestana, setPestana] = useState<Pestana>(parametros.get("pestana") === "por_identificar" ? "por_identificar" : "identificados");
    const [desde, setDesde] = useState(clienteParam ? "" : mes.primerDia);
    const [hasta, setHasta] = useState(clienteParam ? "" : mes.ultimoDia);
    const [pagos, setPagos] = useState<PagoCliente[]>([]);
    const [pendientes, setPendientes] = useState<PagoCliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busqueda, setBusqueda] = useState("");
    const [tipo, setTipo] = useState("");
    const [empresa, setEmpresa] = useState("");
    const [estado, setEstado] = useState("activo");
    const [formulario, setFormulario] = useState<{ pago: PagoCliente | null } | null>(
        parametros.get("nuevo") && editable ? { pago: null } : null,
    );
    const [aCancelar, setACancelar] = useState<PagoCliente | null>(null);
    const [aIdentificar, setAIdentificar] = useState<PagoCliente | null>(null);
    const [descargandoPdf, setDescargandoPdf] = useState(false);

    async function cargar() {
        try {
            // Los por identificar se siguen sin importar la fecha: pueden tardar meses en asignarse.
            const [identificados, sinCliente] = await Promise.all([
                obtenerPagos({ desde: desde || undefined, hasta: hasta || undefined, cliente: clienteParam, por_identificar: false }),
                obtenerPagos({ por_identificar: true, estado: "activo" }),
            ]);
            setPagos(identificados);
            setPendientes(sinCliente);
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

    async function guardar(datos: PagoClienteRequest) {
        try {
            if (formulario?.pago) {
                await actualizarPago(formulario.pago.id, datos);
                mostrarToast("Pago actualizado", "Los cambios se guardaron correctamente.", "success");
            } else {
                await crearPago(datos);
                mostrarToast(
                    "Pago registrado",
                    datos.cliente_id ? "El pago ya baja el saldo del cliente." : "Quedó en Por identificar hasta que se le asigne cliente.",
                    "success",
                );
                if (!datos.cliente_id) setPestana("por_identificar");
            }
            cerrarFormulario();
            await cargar();
        } catch (err) {
            mostrarToast("Error al guardar", obtenerMensajeError(err), "danger");
            throw err;
        }
    }

    // La descarga lleva los mismos filtros que la tabla (pestaña, fechas, búsqueda, tipo, empresa y estado).
    const filtroDescarga = pestana === "por_identificar"
        ? { por_identificar: true, estado: "activo" as const, q: busqueda.trim() || undefined, tipo: (tipo || undefined) as TipoPago | undefined, empresa: Number(empresa) || undefined }
        : {
            por_identificar: false, desde: desde || undefined, hasta: hasta || undefined, cliente: clienteParam,
            estado: (estado || undefined) as "activo" | "cancelado" | undefined, q: busqueda.trim() || undefined,
            tipo: (tipo || undefined) as TipoPago | undefined, empresa: Number(empresa) || undefined,
        };

    async function descargarPdf() {
        setDescargandoPdf(true);
        try {
            await descargarPagos("pdf", filtroDescarga);
        } catch (err) {
            mostrarToast("No se pudo descargar", obtenerMensajeError(err), "danger");
        } finally {
            setDescargandoPdf(false);
        }
    }

    const fuente = pestana === "por_identificar" ? pendientes : pagos;
    const filtrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();
        return fuente.filter((p) =>
            (!termino || `${p.cliente?.nombre ?? ""} ${p.referencia} ${p.notas} ${p.ingreso_tesoreria?.folio ?? ""}`.toLowerCase().includes(termino))
            && (!tipo || p.tipo === tipo)
            && (!empresa || String(p.empresa.id) === empresa)
            && (pestana === "por_identificar" || !estado || (estado === "cancelado") === p.cancelado),
        );
    }, [fuente, busqueda, tipo, empresa, estado, pestana]);

    const total = filtrados.filter((p) => !p.cancelado).reduce((acc, p) => acc + Number(p.monto), 0);
    const totalPendiente = pendientes.reduce((acc, p) => acc + Number(p.monto), 0);
    const { pagina, setPagina, totalPaginas, inicio, fin } = usePaginacion(
        filtrados.length, POR_PAGINA, `${pestana}|${busqueda}|${tipo}|${empresa}|${estado}|${desde}|${hasta}`,
    );
    const clienteFiltrado = clienteParam ? clientes.find((c) => c.id === clienteParam) : undefined;
    const porIdentificar = pestana === "por_identificar";

    return (
        <>
            <PageHeader
                title="Pagos de clientes"
                subtitle="Transferencias y efectivo que bajan el saldo de cada cliente"
                breadcrumbs={[{ label: "Inicio", to: "/" }, { label: "Cartera", to: "/cartera" }, { label: "Pagos" }]}
            />
            <div className="container-fluid">
                {!editable && <AvisoSoloLectura area="Cartera" />}
                <div className="card card-outline card-primary">
                    <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                        <ul className="nav nav-pills me-auto" role="tablist">
                            <li className="nav-item" role="presentation">
                                <button type="button" role="tab" aria-selected={!porIdentificar}
                                    className={`nav-link py-1 ${!porIdentificar ? "active" : ""}`} onClick={() => setPestana("identificados")}>
                                    <i className="bi bi-person-check me-1" aria-hidden="true"></i>Identificados
                                </button>
                            </li>
                            <li className="nav-item" role="presentation">
                                <button type="button" role="tab" aria-selected={porIdentificar}
                                    className={`nav-link py-1 ${porIdentificar ? "active" : ""}`} onClick={() => setPestana("por_identificar")}>
                                    <i className="bi bi-question-circle me-1" aria-hidden="true"></i>Por identificar
                                    {pendientes.length > 0 && <span className="badge text-bg-warning ms-1">{pendientes.length}</span>}
                                </button>
                            </li>
                        </ul>
                        {clienteFiltrado && !porIdentificar && (
                            <span className="badge border bg-primary-subtle text-primary-emphasis border-primary-subtle">
                                {clienteFiltrado.nombre}
                                <button type="button" className="btn-close btn-close-sm ms-2" style={{ fontSize: ".55rem" }}
                                    aria-label="Quitar filtro de cliente" onClick={() => setParametros({}, { replace: true })}></button>
                            </span>
                        )}
                        {!porIdentificar && (
                            <div className="d-flex align-items-center gap-1">
                                <input type="date" className="form-control form-control-sm" value={desde} onChange={(e) => setDesde(e.target.value)} aria-label="Desde" />
                                <span className="small">al</span>
                                <input type="date" className="form-control form-control-sm" value={hasta} onChange={(e) => setHasta(e.target.value)} aria-label="Hasta" />
                            </div>
                        )}
                        {editable && (
                            <button className="btn btn-success btn-sm" onClick={() => setFormulario({ pago: null })}>
                                <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>Registrar pago
                            </button>
                        )}
                    </div>
                    {porIdentificar && pendientes.length > 0 && (
                        <div className="alert alert-warning rounded-0 border-start-0 border-end-0 py-2 mb-0 small">
                            <strong>{pendientes.length}</strong> pago(s) sin cliente por <strong>{dinero(totalPendiente)}</strong>.
                            No bajan ningún saldo hasta identificarlos; al identificarlos se aplican con su fecha original.
                        </div>
                    )}
                    <div className="d-flex flex-wrap gap-2 align-items-center p-3 border-bottom">
                        <BuscadorTabla valor={busqueda} onChange={setBusqueda} placeholder={porIdentificar ? "Buscar referencia o notas..." : "Buscar cliente, referencia o folio..."} />
                        <FiltroChip etiqueta="Tipo" icono="bi-cash" valor={tipo} onChange={setTipo} etiquetaTodos="Todos los tipos"
                            opciones={TIPOS_PAGO.map((t) => ({ value: t.value, label: `${t.corto} · ${t.label}` }))} />
                        <FiltroChip etiqueta="Empresa" icono="bi-building" valor={empresa} onChange={setEmpresa} etiquetaTodos="Todas las empresas"
                            opciones={empresas.map((e) => ({ value: String(e.id), label: e.nombre }))} />
                        {!porIdentificar && (
                            <FiltroChip etiqueta="Estado" icono="bi-flag" valor={estado} onChange={setEstado} etiquetaTodos="Todos" opciones={OPCIONES_ESTADO} />
                        )}
                        <span className="ms-auto small">
                            <span className="text-body-secondary">{filtrados.length} pago(s) · Total </span>
                            <span className="fw-bold">{dinero(total)}</span>
                        </span>
                        <BotonDescargaExcel onDescargar={() => descargarPagos("excel", filtroDescarga)}
                            titulo="Descargar en Excel los pagos con estos filtros" disabled={filtrados.length === 0} />
                        <button type="button" className="btn btn-sm btn-outline-secondary" disabled={filtrados.length === 0 || descargandoPdf}
                            title="Descargar en PDF los pagos con estos filtros" onClick={descargarPdf}>
                            <i className={`bi ${descargandoPdf ? "bi-hourglass-split" : "bi-file-earmark-pdf"} me-1`} aria-hidden="true"></i>PDF
                        </button>
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
                                            {porIdentificar ? <th>Antigüedad</th> : <th>Cliente</th>}
                                            <th>Empresa</th>
                                            <th>Tipo</th>
                                            <th className="num">Monto</th>
                                            <th>Referencia</th>
                                            <th>Capturó</th>
                                            <th className="text-end">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtrados.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="text-center text-body-secondary py-5">
                                                    {porIdentificar ? "No hay pagos por identificar." : "No hay pagos con estos filtros."}
                                                </td>
                                            </tr>
                                        ) : filtrados.slice(inicio, fin).map((p) => {
                                            const tachado = p.cancelado ? "text-decoration-line-through text-body-secondary" : "";
                                            const dias = diasDesde(p.fecha);
                                            return (
                                                <tr key={p.id} className="fila-principal">
                                                    <td className={`text-nowrap ${tachado}`}>{fecha(p.fecha)}</td>
                                                    {porIdentificar ? (
                                                        <td><span className={`badge border ${claseAntiguedad(dias)}`}>{dias === 0 ? "Hoy" : `Hace ${dias} día(s)`}</span></td>
                                                    ) : (
                                                        <td className="fw-semibold">
                                                            {p.cliente ? <Link to={rutaClienteCartera(p.cliente.id)}>{p.cliente.nombre}</Link> : "Por identificar"}
                                                            {p.identificado_por && (
                                                                <div className="small fw-normal text-body-secondary"
                                                                    title={`Llegó sin cliente; lo identificó ${p.identificado_por.username}`}>
                                                                    <i className="bi bi-person-check me-1" aria-hidden="true"></i>
                                                                    Identificado {formatearFechaNumerica(p.identificado_en ? new Date(p.identificado_en) : null)} · {p.identificado_por.username}
                                                                </div>
                                                            )}
                                                        </td>
                                                    )}
                                                    <td className="small">{p.empresa.nombre}</td>
                                                    <td>
                                                        <span className="badge border bg-light text-body-emphasis" title={p.tipo_display}>{p.tipo}</span>
                                                        <span className="small ms-1 text-body-secondary">{p.tipo_display}</span>
                                                    </td>
                                                    <td className={`num fw-semibold ${tachado}`}>{dinero(p.monto)}</td>
                                                    <td className="small">
                                                        {p.ingreso_tesoreria && (
                                                            <span className="badge border bg-info-subtle text-info-emphasis border-info-subtle me-1" title={p.ingreso_tesoreria.concepto}>
                                                                Tesorería {p.ingreso_tesoreria.folio}
                                                            </span>
                                                        )}
                                                        {p.referencia}
                                                        {p.notas && <div className="text-body-secondary">{p.notas}</div>}
                                                        {p.cancelado && (
                                                            <span className="badge border bg-secondary-subtle text-secondary-emphasis border-secondary-subtle ms-1" title={p.motivo_cancelacion}>
                                                                Cancelado
                                                            </span>
                                                        )}
                                                        {p.editado_por && !p.cancelado && (
                                                            <span className="badge border bg-warning-subtle text-warning-emphasis border-warning-subtle ms-1">Editado</span>
                                                        )}
                                                    </td>
                                                    <td className="small text-nowrap">{p.usuario.username}</td>
                                                    <td className="text-end text-nowrap">
                                                        {editable && porIdentificar && (
                                                            <button type="button" className="btn btn-sm btn-primary me-1" onClick={() => setAIdentificar(p)}>
                                                                <i className="bi bi-person-check me-1" aria-hidden="true"></i>Identificar
                                                            </button>
                                                        )}
                                                        <MenuAccionesFila
                                                            etiqueta={`Acciones del pago de ${p.cliente?.nombre ?? "cliente por identificar"}`}
                                                            acciones={[
                                                                ...(p.cliente ? [{ etiqueta: "Estado de cuenta", icono: "bi-journal-text", onClick: () => navigate(rutaClienteCartera(p.cliente!.id)) }] : []),
                                                                ...(editable ? [
                                                                    { etiqueta: "Editar", icono: "bi-pencil", onClick: () => setFormulario({ pago: p }), motivoBloqueo: p.cancelado ? "El pago está cancelado" : null },
                                                                    { etiqueta: "Cancelar pago", icono: "bi-x-circle", variante: "danger" as const, onClick: () => setACancelar(p), motivoBloqueo: p.cancelado ? "Ya está cancelado" : null },
                                                                ] : []),
                                                            ]}
                                                        />
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

            <Modal title={formulario?.pago ? "Editar pago" : "Registrar pago"} show={formulario !== null} size="modal-lg" onClose={cerrarFormulario}>
                {formulario && empresas.length > 0 && (
                    <PagoForm
                        key={formulario.pago?.id ?? "nuevo"}
                        pago={formulario.pago}
                        clientes={clientes}
                        empresas={empresas}
                        clienteInicial={clienteParam}
                        onGuardar={guardar}
                        onCancelar={cerrarFormulario}
                    />
                )}
            </Modal>

            <Modal title="Identificar pago" show={aIdentificar !== null} onClose={() => setAIdentificar(null)}>
                {aIdentificar && (
                    <IdentificarPago
                        pago={aIdentificar}
                        clientes={clientes}
                        onCancelar={() => setAIdentificar(null)}
                        onIdentificar={async (clienteId) => {
                            const pago = await identificarPago(aIdentificar.id, clienteId);
                            setAIdentificar(null);
                            mostrarToast("Pago identificado", `Se aplicó a ${pago.cliente?.nombre} con fecha ${fecha(pago.fecha)}.`, "success");
                            await cargar();
                        }}
                    />
                )}
            </Modal>

            <CancelarMovimientoModal
                descripcion={aCancelar ? `el pago ${aCancelar.cliente ? `de ${aCancelar.cliente.nombre}` : "por identificar"} por ${dinero(aCancelar.monto)} del ${fecha(aCancelar.fecha)}` : null}
                aviso={aCancelar?.ingreso_tesoreria ? `El ingreso ${aCancelar.ingreso_tesoreria.folio} de Tesorería no se toca y queda libre para otro pago.` : undefined}
                onClose={() => setACancelar(null)}
                onConfirmar={async (motivo) => {
                    if (!aCancelar) return;
                    await cancelarPago(aCancelar.id, motivo);
                    setACancelar(null);
                    mostrarToast("Pago cancelado", "Ya no cuenta en el saldo del cliente.", "success");
                    await cargar();
                }}
            />
        </>
    );
}

function IdentificarPago({ pago, clientes, onIdentificar, onCancelar }: {
    pago: PagoCliente;
    clientes: ClienteCartera[];
    onIdentificar: (clienteId: number) => Promise<void>;
    onCancelar: () => void;
}) {
    const [clienteId, setClienteId] = useState<number | "">("");
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function confirmar() {
        if (!clienteId) return setError("Elige el cliente.");
        setGuardando(true);
        try {
            await onIdentificar(clienteId);
        } catch (err) {
            setError(obtenerMensajeError(err));
        } finally {
            setGuardando(false);
        }
    }

    return (
        <>
            <div className="alert alert-light border py-2 small">
                <div className="fw-semibold">{dinero(pago.monto)} · {pago.tipo_display} · {pago.empresa.nombre}</div>
                <div>Fecha {fecha(pago.fecha)}{pago.referencia && ` · ${pago.referencia}`}</div>
                {pago.notas && <div className="text-body-secondary">{pago.notas}</div>}
            </div>
            <label className="form-label" htmlFor="identificar-cliente">¿De qué cliente es? <span className="text-danger">*</span></label>
            <SearchableSelect
                id="identificar-cliente"
                options={clientes.map((c) => ({ value: c.id, label: c.nombre, disabled: !c.activo }))}
                value={clienteId}
                onChange={setClienteId}
                placeholder="Buscar cliente..."
            />
            <div className="form-text">El pago baja su saldo con la fecha original ({fecha(pago.fecha)}).</div>
            {error && <div className="alert alert-danger py-2 mt-3 mb-0">{error}</div>}
            <div className="d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-outline-secondary" onClick={onCancelar} disabled={guardando}>Cancelar</button>
                <button type="button" className="btn btn-primary" onClick={confirmar} disabled={guardando}>
                    <i className="bi bi-person-check me-1" aria-hidden="true"></i>{guardando ? "Guardando..." : "Identificar"}
                </button>
            </div>
        </>
    );
}

export default PagosView;
