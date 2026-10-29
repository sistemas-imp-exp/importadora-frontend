import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../../layouts/components/PageHeader";
import AvisoSoloLectura from "../../../shared/components/AvisoSoloLectura";
import BuscadorTabla from "../../../shared/components/BuscadorTabla";
import ConfirmModal from "../../../shared/components/ConfirmModal";
import DensidadToggle from "../../../shared/components/DensidadToggle";
import Paginacion from "../../../shared/components/Paginacion";
import PorPaginaSelect from "../../../shared/components/PorPaginaSelect";
import SearchableSelect from "../../../shared/components/SearchableSelect";
import SkeletonTable from "../../../shared/components/SkeletonTable";
import { useToastContext } from "../../../shared/context/ToastProvider";
import { useAuth } from "../../../shared/hooks/useAuth";
import { useDensidadTabla } from "../../../shared/hooks/useDensidadTabla";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import { formatearKg } from "../../../shared/utils/numeros";
import ResguardosTabla from "../components/ResguardosTabla";
import RetiroResguardoModal from "../components/RetiroResguardoModal";
import type { CrearRetiroRequest, Resguardo, Retiro } from "../interfaces/Resguardo";
import {
    cancelarRetiro, obtenerClientesConResguardo, obtenerResguardos, registrarRetiro, type FiltrosResguardos,
} from "../services/resguardos.service";

interface Props {
    /** Desde qué módulo se abre: decide migas, permiso de escritura y textos. */
    area: "INV" | "CAR";
}

const ESTADOS: { valor: FiltrosResguardos["estado"]; etiqueta: string }[] = [
    { valor: "pendiente", etiqueta: "Por entregar" },
    { valor: "entregado", etiqueta: "Entregados" },
    { valor: "todos", etiqueta: "Todos" },
];

/**
 * Producto vendido que el cliente dejó guardado en nuestras cámaras: lo que
 * falta entregar de cada nota y sus retiros. Inventario y Cartera ven y
 * registran lo mismo; cada retiro avisa al otro área.
 */
function ResguardosView({ area }: Props) {
    const { puedeEditar } = useAuth();
    const editable = puedeEditar(area);
    const modulo = area === "INV" ? { nombre: "Inventario", ruta: "/inventario" } : { nombre: "Cartera", ruta: "/cartera" };
    const { mostrarToast } = useToastContext();
    const [densidad, setDensidad] = useDensidadTabla("resguardos");

    // Los avisos de la campana enlazan con ?busqueda=<folio de la venta>.
    const [searchParams] = useSearchParams();
    const parametroBusqueda = searchParams.get("busqueda") ?? "";
    const [busqueda, setBusqueda] = useState(parametroBusqueda);
    const [estado, setEstado] = useState<FiltrosResguardos["estado"]>(parametroBusqueda ? "todos" : "pendiente");
    const [pagina, setPagina] = useState(1);
    const [parametroPrevio, setParametroPrevio] = useState(parametroBusqueda);
    if (parametroBusqueda !== parametroPrevio) {
        setParametroPrevio(parametroBusqueda);
        setBusqueda(parametroBusqueda);
        setEstado("todos");
        setPagina(1);
    }
    const [porPagina, setPorPagina] = useState(25);
    const [clienteId, setClienteId] = useState<number | "">("");
    const [clientes, setClientes] = useState<{ id: number; nombre: string }[]>([]);

    const [resguardos, setResguardos] = useState<Resguardo[]>([]);
    const [total, setTotal] = useState(0);
    const [kilosPendientes, setKilosPendientes] = useState("0");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [recarga, setRecarga] = useState(0);

    const [retirando, setRetirando] = useState<Resguardo | null>(null);
    const [cancelando, setCancelando] = useState<Retiro | null>(null);
    const [procesando, setProcesando] = useState(false);

    useEffect(() => {
        let cancelado = false;
        const id = setTimeout(() => {
            obtenerResguardos({ pagina, porPagina, busqueda, estado, clienteId })
                .then((datos) => {
                    if (cancelado) return;
                    setResguardos(datos.results);
                    setTotal(datos.count);
                    setKilosPendientes(datos.kilos_pendientes);
                    setError(null);
                })
                .catch((e) => { if (!cancelado) setError(obtenerMensajeError(e)); })
                .finally(() => { if (!cancelado) setLoading(false); });
        }, busqueda ? 300 : 0);
        return () => { cancelado = true; clearTimeout(id); };
    }, [pagina, porPagina, busqueda, estado, clienteId, recarga]);

    useEffect(() => {
        obtenerClientesConResguardo().then(setClientes).catch(() => setClientes([]));
    }, [recarga]);

    const opcionesClientes = useMemo(() => clientes.map((c) => ({ value: c.id, label: c.nombre })), [clientes]);

    async function guardarRetiro(retiro: CrearRetiroRequest) {
        const creado = await registrarRetiro(retiro);
        mostrarToast(
            `Retiro ${creado.folio_retiro} registrado`,
            `Se entregaron ${formatearKg(creado.kilos)} kg. ${area === "INV" ? "Cartera" : "Inventario"} recibió el aviso.`,
            "success",
        );
        setRetirando(null);
        setRecarga((n) => n + 1);
    }

    async function confirmarCancelacion() {
        if (!cancelando) return;
        setProcesando(true);
        try {
            await cancelarRetiro(cancelando.id);
            mostrarToast("Retiro cancelado", `${cancelando.folio_retiro}: lo entregado vuelve a quedar pendiente.`, "success");
            setCancelando(null);
            setRecarga((n) => n + 1);
        } catch (e) {
            mostrarToast("Error del servidor", obtenerMensajeError(e), "danger");
        } finally {
            setProcesando(false);
        }
    }

    function filtrar(cambio: () => void) {
        cambio();
        setPagina(1);
    }

    const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
    const rango = total > 0 && (
        <div className="card-footer d-flex justify-content-between align-items-center flex-wrap gap-2">
            <small className="text-muted">
                Mostrando {(pagina - 1) * porPagina + 1}-{Math.min(pagina * porPagina, total)} de {total}
            </small>
            <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
        </div>
    );

    return (
        <>
            <PageHeader
                title="Resguardos"
                subtitle="Producto vendido que el cliente dejó guardado en nuestras cámaras"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: modulo.nombre, to: modulo.ruta },
                    { label: "Resguardos" },
                ]}
            />

            <div className="container-fluid">
                {!editable && <AvisoSoloLectura area={modulo.nombre} />}

                <div className="alert alert-light border small py-2 d-flex gap-2 align-items-start" role="note">
                    <i className="bi bi-info-circle text-body-secondary mt-1" aria-hidden="true"></i>
                    <span>
                        La venta se registra en Salidas como <strong>Venta en resguardo</strong>: por producto, sin lote ni
                        folio de salida, y se cobra completa. Aquí se registra lo que el cliente se va llevando, de los lotes
                        que haya de ese producto (un retiro puede juntar varios lotes y proveedores).
                    </span>
                </div>

                <div className="card card-outline card-primary">
                    <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                        <h3 className="card-title mb-0 me-auto">
                            Resguardos
                            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle fw-normal ms-2">
                                {formatearKg(kilosPendientes)} kg por entregar
                            </span>
                        </h3>
                        <BuscadorTabla
                            valor={busqueda}
                            onChange={(v) => filtrar(() => setBusqueda(v))}
                            placeholder="Folio, nota, cliente o RES-..."
                        />
                        <div style={{ minWidth: "14rem" }}>
                            <SearchableSelect
                                placeholder="Todos los clientes"
                                options={opcionesClientes}
                                value={clienteId}
                                onChange={(v) => filtrar(() => setClienteId(v))}
                            />
                        </div>
                        <div className="btn-group btn-group-sm" role="group" aria-label="Estado">
                            {ESTADOS.map((e) => (
                                <button key={e.valor} type="button" aria-pressed={estado === e.valor}
                                    className={`btn ${estado === e.valor ? "btn-primary" : "btn-outline-secondary"}`}
                                    onClick={() => filtrar(() => setEstado(e.valor))}>
                                    {e.etiqueta}
                                </button>
                            ))}
                        </div>
                        <PorPaginaSelect valor={porPagina} onChange={(v) => filtrar(() => setPorPagina(v))} />
                        <DensidadToggle valor={densidad} onChange={setDensidad} />
                    </div>

                    {loading ? (
                        <div className="card-body"><SkeletonTable columnas={6} filas={4} /></div>
                    ) : error ? (
                        <div className="card-body"><div className="alert alert-danger mb-0" role="alert">{error}</div></div>
                    ) : (
                        <>
                            <div className="card-body p-0">
                                <ResguardosTabla
                                    resguardos={resguardos}
                                    densidad={densidad}
                                    onRetirar={editable ? setRetirando : undefined}
                                    onCancelarRetiro={editable ? setCancelando : undefined}
                                />
                            </div>
                            {rango}
                        </>
                    )}
                </div>
            </div>

            {retirando && (
                <RetiroResguardoModal
                    key={retirando.id}
                    resguardo={retirando}
                    onCerrar={() => setRetirando(null)}
                    onRegistrar={guardarRetiro}
                />
            )}

            <ConfirmModal
                show={cancelando !== null}
                isLoading={procesando}
                onCancel={() => setCancelando(null)}
                onConfirm={confirmarCancelacion}
            >
                <div className="text-center">
                    <i className="bi bi-exclamation-triangle-fill text-warning fs-1" aria-hidden="true"></i>
                    <h3 className="fs-5 fw-semibold">¿Cancelar el retiro {cancelando?.folio_retiro}?</h3>
                    <p className="small text-body-secondary mt-2">
                        Los {cancelando ? formatearKg(cancelando.kilos) : ""} kg vuelven a quedar pendientes de entregar y
                        regresan a la existencia de sus lotes. Se avisa al otro área.
                    </p>
                </div>
            </ConfirmModal>
        </>
    );
}

export default ResguardosView;
