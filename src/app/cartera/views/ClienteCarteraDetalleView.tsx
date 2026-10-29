import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../../../layouts/components/PageHeader";
import SkeletonCallout from "../../../shared/components/SkeletonCallout";
import SkeletonTable from "../../../shared/components/SkeletonTable";
import { useAuth } from "../../../shared/hooks/useAuth";
import { useToastContext } from "../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import type { ClienteCartera, EmpresaCartera, RenglonEstadoCuenta } from "../interfaces/Cartera";
import {
    descargarEstadoCuenta, obtenerCliente, obtenerEmpresas, obtenerEstadoCuenta,
} from "../services/cartera.service";
import { claseSaldo, dinero, fecha } from "../utils/cartera";
import VentasCliente from "../components/VentasCliente";
import Modal from "../../../shared/components/Modal";
import PagoForm from "../components/PagoForm";
import AjusteForm, { type GuardarAjuste } from "../components/AjusteForm";
import type { PagoClienteRequest } from "../interfaces/Cartera";
import { actualizarCliente, crearAjuste, crearPago, crearTraspaso } from "../services/cartera.service";
import ClienteCarteraForm from "../components/ClienteCarteraForm";
import type { ClienteCarteraRequest } from "../interfaces/Cartera";
import EstadoCuentaTabla from "../components/EstadoCuentaTabla";

function ClienteCarteraDetalleView() {
    const { id } = useParams<{ id: string }>();
    const { puedeEditar } = useAuth();
    const editable = puedeEditar("CAR");
    const { mostrarToast } = useToastContext();
    const [cliente, setCliente] = useState<ClienteCartera | null>(null);
    const [empresas, setEmpresas] = useState<EmpresaCartera[]>([]);
    const [renglones, setRenglones] = useState<RenglonEstadoCuenta[]>([]);
    const [empresaFiltro, setEmpresaFiltro] = useState<number | "">("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [descargando, setDescargando] = useState<"pdf" | "excel" | null>(null);
    // Pestaña: estado de cuenta (saldo corrido) o ventas a verificar contra la nota en papel.
    const [pestana, setPestana] = useState<"cuenta" | "ventas">("cuenta");
    const [recargaCuenta, setRecargaCuenta] = useState(0);
    // Pago o ajuste capturado desde el propio cliente: al guardar se queda aquí.
    const [captura, setCaptura] = useState<"pago" | "ajuste" | "datos" | null>(null);

    async function guardarDatos(datos: ClienteCarteraRequest) {
        if (!cliente) return;
        try {
            await actualizarCliente(cliente.id, datos);
            mostrarToast("Cliente actualizado", "Los cambios se guardaron correctamente.", "success");
            setCaptura(null);
            setRecargaCuenta((n) => n + 1);
        } catch (err) {
            mostrarToast("Error al guardar", obtenerMensajeError(err), "danger");
            throw err;
        }
    }

    async function guardarPago(datos: PagoClienteRequest) {
        try {
            await crearPago(datos);
            mostrarToast("Pago registrado", "El pago ya baja el saldo del cliente.", "success");
            setCaptura(null);
            setRecargaCuenta((n) => n + 1);
        } catch (err) {
            mostrarToast("Error al guardar", obtenerMensajeError(err), "danger");
            throw err;
        }
    }

    async function guardarAjuste(guardar: GuardarAjuste) {
        try {
            if (guardar.modo === "traspaso") await crearTraspaso(guardar.datos);
            else await crearAjuste(guardar.datos);
            mostrarToast(guardar.modo === "traspaso" ? "Traspaso registrado" : "Ajuste registrado",
                "El saldo del cliente ya lo refleja.", "success");
            setCaptura(null);
            setRecargaCuenta((n) => n + 1);
        } catch (err) {
            mostrarToast("Error al guardar", obtenerMensajeError(err), "danger");
            throw err;
        }
    }

    useEffect(() => {
        if (!id) return;
        let vigente = true;
        const temporizador = setTimeout(() => {
            Promise.all([obtenerCliente(Number(id)), obtenerEmpresas(), obtenerEstadoCuenta(Number(id), empresaFiltro || undefined)])
                .then(([datosCliente, datosEmpresas, datosRenglones]) => {
                    if (!vigente) return;
                    setCliente(datosCliente);
                    setEmpresas(datosEmpresas);
                    setRenglones(datosRenglones);
                    setError(null);
                })
                .catch((err) => {
                    if (!vigente) return;
                    const mensaje = obtenerMensajeError(err);
                    setError(mensaje);
                    mostrarToast("Error al cargar", mensaje, "danger");
                })
                .finally(() => vigente && setLoading(false));
        }, 0);
        return () => {
            vigente = false;
            clearTimeout(temporizador);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, empresaFiltro, recargaCuenta]);

    async function descargar(formato: "pdf" | "excel") {
        if (!cliente) return;
        setDescargando(formato);
        try {
            await descargarEstadoCuenta(cliente.id, formato, empresaFiltro || undefined);
        } catch (err) {
            mostrarToast("Error al descargar", obtenerMensajeError(err), "danger");
        } finally {
            setDescargando(null);
        }
    }


    return (
        <>
            <PageHeader
                title="Estado de cuenta"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Cartera", to: "/cartera" },
                    { label: "Clientes", to: "/cartera/clientes" },
                    { label: cliente ? cliente.nombre : "Cliente" },
                ]}
            />
            <div className="container-fluid">
                {loading && (
                    <>
                        <SkeletonCallout lineas={3} />
                        <div className="card"><div className="card-body p-0"><SkeletonTable columnas={7} filas={5} /></div></div>
                    </>
                )}
                {error && (
                    <div className="callout callout-warning mb-3">
                        <p><b>Error al cargar:</b></p>
                        <p>{error}</p>
                    </div>
                )}
                {!loading && !error && cliente && (
                    <>
                        <div className="card shadow-sm mb-3 detalle-movimiento" style={{ borderLeft: "4px solid var(--bs-primary)" }}>
                            <div className="card-body">
                                <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                                    <div className="d-flex align-items-center gap-3">
                                        <span className="detalle-movimiento__icono bg-primary-subtle text-primary-emphasis" aria-hidden="true">
                                            <i className="bi bi-person-vcard"></i>
                                        </span>
                                        <div>
                                            <div className="detalle-movimiento__etiqueta">Cliente</div>
                                            <div className="d-flex flex-wrap align-items-center gap-2">
                                                <span className="fs-4 fw-bold lh-1">{cliente.nombre}</span>
                                                {cliente.pagare && <span className="badge border bg-info-subtle text-info-emphasis border-info-subtle">Pagaré</span>}
                                                {!cliente.activo && <span className="badge border bg-secondary-subtle text-secondary-emphasis border-secondary-subtle">Inactivo</span>}
                                            </div>
                                            {cliente.celular && (
                                                <div className="small text-body-secondary mt-1"><i className="bi bi-telephone me-1" aria-hidden="true"></i>{cliente.celular}</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        <div className="detalle-movimiento__etiqueta">Saldo conjunto</div>
                                        <div className={`fs-3 fw-bold lh-sm ${claseSaldo(cliente.saldo_conjunto)}`}>{dinero(cliente.saldo_conjunto)}</div>
                                        {Number(cliente.saldo_conjunto) < 0 && <div className="small text-success-emphasis">Saldo a favor del cliente</div>}
                                    </div>
                                </div>

                                <dl className="row g-3 mb-0 mt-1 pt-3 border-top detalle-movimiento__datos">
                                    {empresas.map((e) => (
                                        <div className="col-6 col-lg-3" key={e.id}>
                                            <dt>{e.nombre}</dt>
                                            <dd className={`fw-semibold ${claseSaldo(cliente.saldos[String(e.id)] ?? 0)}`}>{dinero(cliente.saldos[String(e.id)] ?? 0)}</dd>
                                        </div>
                                    ))}
                                    <div className="col-6 col-lg-3">
                                        <dt>Último pago</dt>
                                        <dd>
                                            {cliente.ultimo_pago ? (
                                                <>{fecha(cliente.ultimo_pago.fecha)}{cliente.ultimo_pago.monto && <> · {dinero(cliente.ultimo_pago.monto)}</>}</>
                                            ) : "—"}
                                        </dd>
                                    </div>
                                    {cliente.notas && (
                                        <div className="col-12">
                                            <dt>Notas</dt>
                                            <dd className="mb-0" style={{ whiteSpace: "pre-line" }}>{cliente.notas}</dd>
                                        </div>
                                    )}
                                </dl>

                                <div className="d-flex flex-wrap gap-2 mt-3 pt-3 border-top">
                                    <Link to="/cartera/clientes" className="btn btn-sm btn-outline-secondary me-auto">
                                        <i className="bi bi-arrow-left me-1" aria-hidden="true"></i>Volver a clientes
                                    </Link>
                                        {editable && (
                                        <>
                                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setCaptura("datos")}>
                                                <i className="bi bi-pencil me-1" aria-hidden="true"></i>Editar datos
                                            </button>
                                            <button type="button" className="btn btn-sm btn-success" onClick={() => setCaptura("pago")}>
                                                <i className="bi bi-cash-coin me-1" aria-hidden="true"></i>Registrar pago
                                            </button>
                                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setCaptura("ajuste")}>
                                                <i className="bi bi-sliders me-1" aria-hidden="true"></i>Ajuste
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="card card-outline card-primary">
                            <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                                <ul className="nav nav-pills me-auto" role="tablist">
                                    <li className="nav-item" role="presentation">
                                        <button type="button" role="tab" aria-selected={pestana === "cuenta"}
                                            className={`nav-link py-1 ${pestana === "cuenta" ? "active" : ""}`} onClick={() => setPestana("cuenta")}>
                                            <i className="bi bi-journal-text me-1" aria-hidden="true"></i>Estado de cuenta
                                        </button>
                                    </li>
                                    <li className="nav-item" role="presentation">
                                        <button type="button" role="tab" aria-selected={pestana === "ventas"}
                                            className={`nav-link py-1 ${pestana === "ventas" ? "active" : ""}`} onClick={() => setPestana("ventas")}>
                                            <i className="bi bi-clipboard-check me-1" aria-hidden="true"></i>Ventas por verificar
                                        </button>
                                    </li>
                                </ul>
                                {pestana === "cuenta" && (
                                <>
                                <select
                                    className="form-select form-select-sm w-auto"
                                    value={empresaFiltro}
                                    onChange={(e) => setEmpresaFiltro(e.target.value ? Number(e.target.value) : "")}
                                    aria-label="Empresa"
                                >
                                    <option value="">Todas las empresas</option>
                                    {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                                </select>
                                <button className="btn btn-outline-success btn-sm" onClick={() => descargar("excel")} disabled={descargando !== null}>
                                    <i className="bi bi-file-earmark-excel me-1" aria-hidden="true"></i>Excel
                                </button>
                                <button className="btn btn-outline-danger btn-sm" onClick={() => descargar("pdf")} disabled={descargando !== null}>
                                    <i className="bi bi-file-earmark-pdf me-1" aria-hidden="true"></i>PDF
                                </button>
                                </>
                                )}
                            </div>
                            {pestana === "ventas" ? (
                                <VentasCliente clienteId={cliente.id} empresas={empresas} editable={editable}
                                    onCambio={() => setRecargaCuenta((n) => n + 1)} />
                            ) : (
                            <div className="card-body p-0">
                                <EstadoCuentaTabla renglones={renglones} mostrarEmpresa={!empresaFiltro} />
                            </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            {cliente && empresas.length > 0 && (
                <>
                    <Modal title={`Registrar pago · ${cliente.nombre}`} show={captura === "pago"} size="modal-lg" onClose={() => setCaptura(null)}>
                        {captura === "pago" && (
                            <PagoForm pago={null} clientes={[cliente]} empresas={empresas} clienteInicial={cliente.id}
                                onGuardar={guardarPago} onCancelar={() => setCaptura(null)} />
                        )}
                    </Modal>
                    <Modal title="Editar cliente" show={captura === "datos"} size="modal-lg" onClose={() => setCaptura(null)}>
                        {captura === "datos" && (
                            <ClienteCarteraForm cliente={cliente} onGuardar={guardarDatos} onCancelar={() => setCaptura(null)} />
                        )}
                    </Modal>
                    <Modal title={`Ajuste · ${cliente.nombre}`} show={captura === "ajuste"} size="modal-lg" onClose={() => setCaptura(null)}>
                        {captura === "ajuste" && (
                            <AjusteForm ajuste={null} clientes={[cliente]} empresas={empresas} clienteInicial={cliente.id}
                                onGuardar={guardarAjuste} onCancelar={() => setCaptura(null)} />
                        )}
                    </Modal>
                </>
            )}
        </>
    );
}

export default ClienteCarteraDetalleView;
