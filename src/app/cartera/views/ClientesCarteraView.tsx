import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../../../layouts/components/PageHeader";
import Modal from "../../../shared/components/Modal";
import BuscadorTabla from "../../../shared/components/BuscadorTabla";
import FiltroChip from "../../../shared/components/FiltroChip";
import Paginacion from "../../../shared/components/Paginacion";
import PorPaginaSelect from "../../../shared/components/PorPaginaSelect";
import SkeletonTable from "../../../shared/components/SkeletonTable";
import TablaResponsive from "../../../shared/components/TablaResponsive";
import DensidadToggle from "../../../shared/components/DensidadToggle";
import AvisoSoloLectura from "../../../shared/components/AvisoSoloLectura";
import MenuAccionesFila from "../../../shared/components/tabla/MenuAccionesFila";
import EncabezadoOrdenable from "../../../shared/components/tabla/EncabezadoOrdenable";
import { columnasFijas } from "../../../shared/components/tabla/columnasFijas";
import { useDensidadTabla } from "../../../shared/hooks/useDensidadTabla";
import { usePaginacion } from "../../../shared/hooks/usePaginacion";
import { useOrdenTabla } from "../../../shared/hooks/useOrdenTabla";
import { useAuth } from "../../../shared/hooks/useAuth";
import { useToastContext } from "../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import ClienteCarteraForm from "../components/ClienteCarteraForm";
import type { ClienteCartera, ClienteCarteraRequest, EmpresaCartera } from "../interfaces/Cartera";
import { actualizarCliente, crearCliente, obtenerClientes, obtenerEmpresas } from "../services/cartera.service";
import { claseSaldo, dinero, fecha, rutaClienteCartera } from "../utils/cartera";

const [FIJA_CLIENTE] = columnasFijas(["16rem"]);

type Columna = "nombre" | "conjunto" | "ultimo" | `empresa-${number}`;

const OPCIONES_SALDO = [
    { value: "verificar", label: "Con ventas por verificar" },
    { value: "con", label: "Con saldo" },
    { value: "favor", label: "Saldo a favor" },
    { value: "cero", label: "En cero" },
];

function ClientesCarteraView() {
    const { puedeEditar } = useAuth();
    const editable = puedeEditar("CAR");
    const { mostrarToast } = useToastContext();
    const navigate = useNavigate();
    const [clientes, setClientes] = useState<ClienteCartera[]>([]);
    const [empresas, setEmpresas] = useState<EmpresaCartera[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busqueda, setBusqueda] = useState("");
    const [filtroSaldo, setFiltroSaldo] = useState("con");
    const [porPagina, setPorPagina] = useState(50);
    const [densidad, setDensidad] = useDensidadTabla("cartera-clientes");
    const [formulario, setFormulario] = useState<{ cliente: ClienteCartera | null } | null>(null);

    async function cargar() {
        try {
            const [datosClientes, datosEmpresas] = await Promise.all([obtenerClientes(), obtenerEmpresas()]);
            setClientes(datosClientes);
            setEmpresas(datosEmpresas);
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
    }, []);

    const filtrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();
        return clientes.filter((c) => {
            if (termino && !c.nombre.toLowerCase().includes(termino) && !c.celular.toLowerCase().includes(termino)) return false;
            const conjunto = Number(c.saldo_conjunto);
            if (filtroSaldo === "verificar") return c.ventas_por_verificar > 0 || c.ventas_con_diferencia > 0;
            if (filtroSaldo === "con") return conjunto > 0.004;
            if (filtroSaldo === "favor") return conjunto < -0.004;
            if (filtroSaldo === "cero") return Math.abs(conjunto) <= 0.004;
            return true;
        });
    }, [clientes, busqueda, filtroSaldo]);

    // Las columnas por empresa dependen del catálogo: el memo se rehace con él.
    const valoresOrden = useMemo(() => {
        const valores: Record<string, (c: ClienteCartera) => string | number | null> = {
            nombre: (c) => c.nombre,
            conjunto: (c) => Number(c.saldo_conjunto),
            ultimo: (c) => c.ultimo_pago?.fecha ?? null,
        };
        for (const e of empresas) valores[`empresa-${e.id}`] = (c) => Number(c.saldos[String(e.id)] ?? 0);
        return valores as Record<Columna, (c: ClienteCartera) => string | number | null>;
    }, [empresas]);
    const { ordenadas, orden, alternar } = useOrdenTabla(filtrados, valoresOrden);

    const { pagina, setPagina, totalPaginas, inicio, fin } = usePaginacion(
        ordenadas.length, porPagina, `${busqueda}|${filtroSaldo}|${porPagina}|${JSON.stringify(orden)}`,
    );

    const totales = useMemo(() => {
        const porEmpresa = new Map<number, number>();
        for (const c of filtrados) {
            for (const e of empresas) porEmpresa.set(e.id, (porEmpresa.get(e.id) ?? 0) + Number(c.saldos[String(e.id)] ?? 0));
        }
        return { porEmpresa, conjunto: filtrados.reduce((acc, c) => acc + Number(c.saldo_conjunto), 0) };
    }, [filtrados, empresas]);

    async function guardar(datos: ClienteCarteraRequest) {
        try {
            if (formulario?.cliente) {
                await actualizarCliente(formulario.cliente.id, datos);
                mostrarToast("Cliente actualizado", "Los cambios se guardaron correctamente.", "success");
            } else {
                const nuevo = await crearCliente(datos);
                mostrarToast("Cliente registrado", `${nuevo.nombre} se agregó al catálogo.`, "success");
            }
            setFormulario(null);
            await cargar();
        } catch (err) {
            mostrarToast("Error al guardar", obtenerMensajeError(err), "danger");
            throw err;
        }
    }

    const encabezado = (columna: Columna, texto: string, className?: string, style?: React.CSSProperties) => (
        <EncabezadoOrdenable columna={columna} orden={orden} onOrdenar={alternar} className={className} style={style}>
            {texto}
        </EncabezadoOrdenable>
    );

    return (
        <>
            <PageHeader
                title="Clientes"
                subtitle="Saldo de cada cliente por empresa y en conjunto"
                breadcrumbs={[{ label: "Inicio", to: "/" }, { label: "Cartera", to: "/cartera" }, { label: "Clientes" }]}
            />
            <div className="container-fluid">
                {!editable && <AvisoSoloLectura area="Cartera" />}
                <div className="card card-outline card-primary">
                    <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                        <h3 className="card-title mb-0 me-auto">Clientes</h3>
                        <PorPaginaSelect valor={porPagina} onChange={setPorPagina} />
                        <DensidadToggle valor={densidad} onChange={setDensidad} />
                        {editable && (
                            <button className="btn btn-success btn-sm" onClick={() => setFormulario({ cliente: null })}>
                                <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>Nuevo cliente
                            </button>
                        )}
                    </div>
                    <div className="d-flex flex-wrap gap-2 align-items-center p-3 border-bottom">
                        <BuscadorTabla valor={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre o celular..." />
                        <FiltroChip
                            etiqueta="Saldo"
                            icono="bi-cash-stack"
                            valor={filtroSaldo}
                            opciones={OPCIONES_SALDO}
                            onChange={setFiltroSaldo}
                            etiquetaTodos="Todos los clientes"
                        />
                        <span className="small text-body-secondary ms-auto">{filtrados.length} cliente(s)</span>
                    </div>
                    <div className="card-body p-0">
                        {error ? (
                            <div className="alert alert-danger m-3">{error}</div>
                        ) : loading ? (
                            <SkeletonTable columnas={6} filas={8} />
                        ) : (
                            <TablaResponsive alturaMaxima="70vh">
                                <table className={`table tabla-datos ${densidad === "compacta" ? "densidad-compacta" : ""}`}>
                                    <thead>
                                        <tr>
                                            {encabezado("nombre", "Cliente", "fija-izq fija-izq-borde", FIJA_CLIENTE)}
                                            {empresas.map((e) => (
                                                <Fragment key={e.id}>{encabezado(`empresa-${e.id}`, e.nombre, "num")}</Fragment>
                                            ))}
                                            {encabezado("conjunto", "Saldo conjunto", "num")}
                                            {encabezado("ultimo", "Último pago")}
                                            <th>Celular</th>
                                            <th className="fija-der text-end">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ordenadas.length === 0 ? (
                                            <tr>
                                                <td colSpan={empresas.length + 5} className="text-center text-body-secondary py-5">
                                                    <i className="bi bi-people fs-3 d-block mb-2" aria-hidden="true"></i>
                                                    Ningún cliente con estos filtros.
                                                </td>
                                            </tr>
                                        ) : (
                                            ordenadas.slice(inicio, fin).map((c) => (
                                                <tr key={c.id} className="fila-principal">
                                                    <td className="fija-izq fija-izq-borde" style={FIJA_CLIENTE} title={c.nombre}>
                                                        <div className="truncar" style={{ maxWidth: "100%" }}>
                                                            <Link to={rutaClienteCartera(c.id)} className="fw-semibold">{c.nombre}</Link>
                                                        </div>
                                                        {(c.pagare || !c.activo || c.ventas_por_verificar > 0 || c.ventas_con_diferencia > 0) && (
                                                            <div className="d-flex flex-wrap gap-1 mt-1">
                                                                {c.ventas_por_verificar > 0 && (
                                                                    <span className="badge border bg-warning-subtle text-warning-emphasis border-warning-subtle" title="Líneas de venta por verificar contra la nota">
                                                                        {c.ventas_por_verificar} por verificar
                                                                    </span>
                                                                )}
                                                                {c.ventas_con_diferencia > 0 && (
                                                                    <span className="badge border bg-danger-subtle text-danger-emphasis border-danger-subtle" title="Con diferencia reportada o sin precio: esperan a Inventario">
                                                                        {c.ventas_con_diferencia} en Inventario
                                                                    </span>
                                                                )}
                                                                {c.pagare && <span className="badge border bg-info-subtle text-info-emphasis border-info-subtle">Pagaré</span>}
                                                                {!c.activo && <span className="badge border bg-secondary-subtle text-secondary-emphasis border-secondary-subtle">Inactivo</span>}
                                                            </div>
                                                        )}
                                                    </td>
                                                    {empresas.map((e) => {
                                                        const saldo = c.saldos[String(e.id)] ?? "0";
                                                        return <td key={e.id} className={`num ${claseSaldo(saldo)}`}>{Number(saldo) ? dinero(saldo) : "—"}</td>;
                                                    })}
                                                    <td className={`num fw-semibold ${claseSaldo(c.saldo_conjunto)}`}>{dinero(c.saldo_conjunto)}</td>
                                                    <td className="text-nowrap">
                                                        {c.ultimo_pago ? (
                                                            <>
                                                                {fecha(c.ultimo_pago.fecha)}
                                                                {c.ultimo_pago.monto && <div className="small text-body-secondary">{dinero(c.ultimo_pago.monto)}</div>}
                                                            </>
                                                        ) : <span className="text-body-secondary">—</span>}
                                                    </td>
                                                    <td className="truncar small" title={c.celular}>{c.celular || "—"}</td>
                                                    <td className="fija-der text-end">
                                                        <MenuAccionesFila
                                                            etiqueta={`Acciones de ${c.nombre}`}
                                                            acciones={[
                                                                { etiqueta: "Estado de cuenta", icono: "bi-journal-text", onClick: () => navigate(rutaClienteCartera(c.id)) },
                                                                ...(editable ? [
                                                                    { etiqueta: "Registrar pago", icono: "bi-cash-coin", onClick: () => navigate(`/cartera/pagos?cliente=${c.id}&nuevo=1`) },
                                                                    { etiqueta: "Editar datos", icono: "bi-pencil", onClick: () => setFormulario({ cliente: c }) },
                                                                ] : []),
                                                            ]}
                                                        />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    {ordenadas.length > 0 && (
                                        <tfoot>
                                            <tr>
                                                <td className="fija-izq fija-izq-borde fw-bold" style={FIJA_CLIENTE}>Total ({filtrados.length})</td>
                                                {empresas.map((e) => (
                                                    <td key={e.id} className="num fw-bold">{dinero(totales.porEmpresa.get(e.id) ?? 0)}</td>
                                                ))}
                                                <td className="num fw-bold">{dinero(totales.conjunto)}</td>
                                                <td colSpan={2}></td>
                                                <td className="fija-der"></td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </TablaResponsive>
                        )}
                    </div>
                    {!loading && !error && (
                        <div className="card-footer d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <small className="text-body-secondary">
                                {ordenadas.length === 0 ? "Sin resultados" : `Mostrando ${inicio + 1}-${Math.min(fin, ordenadas.length)} de ${ordenadas.length}`}
                            </small>
                            <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
                        </div>
                    )}
                </div>
            </div>

            <Modal
                title={formulario?.cliente ? "Editar cliente" : "Nuevo cliente"}
                show={formulario !== null}
                size="modal-lg"
                onClose={() => setFormulario(null)}
            >
                {formulario && (
                    <ClienteCarteraForm
                        key={formulario.cliente?.id ?? "nuevo"}
                        cliente={formulario.cliente}
                        onGuardar={guardar}
                        onCancelar={() => setFormulario(null)}
                    />
                )}
            </Modal>
        </>
    );
}

export default ClientesCarteraView;
