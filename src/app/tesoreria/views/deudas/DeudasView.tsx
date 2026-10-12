import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "../../../../layouts/components/PageHeader";
import Modal from "../../../../shared/components/Modal";
import BuscadorTabla from "../../../../shared/components/BuscadorTabla";
import FiltroChip from "../../../../shared/components/FiltroChip";
import Paginacion from "../../../../shared/components/Paginacion";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import DensidadToggle from "../../../../shared/components/DensidadToggle";
import AvisoSoloLectura from "../../../../shared/components/AvisoSoloLectura";
import { usePaginacion } from "../../../../shared/hooks/usePaginacion";
import { useDensidadTabla } from "../../../../shared/hooks/useDensidadTabla";
import { useAuth } from "../../../../shared/hooks/useAuth";
import { useToastContext } from "../../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import DeudasTable from "../../components/deudas/DeudasTable";
import DeudaForm from "../../components/deudas/DeudaForm";
import CancelarDeudaModal from "../../components/deudas/CancelarDeudaModal";
import type { Divisa } from "../../interfaces/divisas/Divisa";
import type { Deuda, DeudaRequest, Deudor, EstadoDeuda } from "../../interfaces/deudas/Deuda";
import { formatearDineroDivisa } from "../../utils/deudas";
import { obtenerDivisas } from "../../services/divisa.service";
import { actualizarDeuda, crearDeuda, obtenerDeudas, obtenerDeudores } from "../../services/deudas.service";

const POR_PAGINA = 20;

const OPCIONES_ESTADO = [
    { value: "abierta", label: "Abiertas" },
    { value: "pagada", label: "Pagadas" },
    { value: "cancelada", label: "Canceladas" },
];

function DeudasView() {
    const { puedeEditar } = useAuth();
    const editable = puedeEditar("TES");
    const { mostrarToast } = useToastContext();
    const [parametros, setParametros] = useSearchParams();
    const deudorFiltro = parametros.get("deudor") ?? "";
    // Por defecto se ven las abiertas: es lo que se consulta al cobrar.
    const estadoFiltro = parametros.get("estado") ?? "abierta";

    const [deudas, setDeudas] = useState<Deuda[]>([]);
    const [deudores, setDeudores] = useState<Deudor[]>([]);
    const [divisas, setDivisas] = useState<Divisa[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busqueda, setBusqueda] = useState("");
    const [densidad, setDensidad] = useDensidadTabla("deudas");
    const [mostrarForm, setMostrarForm] = useState(false);
    const [enEdicion, setEnEdicion] = useState<Deuda | null>(null);
    const [aCancelar, setACancelar] = useState<Deuda | null>(null);

    useEffect(() => {
        Promise.all([obtenerDeudores(), obtenerDivisas()])
            .then(([datosDeudores, datosDivisas]) => {
                setDeudores(datosDeudores);
                setDivisas(datosDivisas);
            })
            .catch((err) => mostrarToast("Error al cargar", obtenerMensajeError(err), "danger"));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        cargar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deudorFiltro, estadoFiltro]);

    async function cargar() {
        try {
            const datos = await obtenerDeudas({
                deudor: deudorFiltro ? Number(deudorFiltro) : undefined,
                estado: (estadoFiltro || undefined) as EstadoDeuda | undefined,
            });
            setDeudas(datos);
            setError(null);
        } catch (err) {
            const mensaje = obtenerMensajeError(err);
            setError(mensaje);
            mostrarToast("Error al cargar", mensaje, "danger");
        } finally {
            setLoading(false);
        }
    }

    function cambiarFiltro(nombre: "deudor" | "estado", valor: string) {
        const nuevos = new URLSearchParams(parametros);
        // El estado vacío ("Todos") se guarda explícito para no volver al valor por defecto.
        if (valor || nombre === "estado") nuevos.set(nombre, valor);
        else nuevos.delete(nombre);
        setParametros(nuevos, { replace: true });
    }

    async function guardar(datos: DeudaRequest) {
        try {
            if (enEdicion) {
                await actualizarDeuda(enEdicion.id, datos);
                mostrarToast("Deuda actualizada", "Los cambios se guardaron correctamente.", "success");
            } else {
                await crearDeuda(datos);
                mostrarToast("Deuda registrada", "La deuda se registró correctamente.", "success");
            }
            setMostrarForm(false);
            setEnEdicion(null);
            await cargar();
        } catch (err) {
            mostrarToast("Error al guardar", obtenerMensajeError(err), "danger");
            throw err;
        }
    }

    const filtradas = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();
        if (!termino) return deudas;
        return deudas.filter(
            (d) => d.deudor.nombre.toLowerCase().includes(termino) || d.concepto.toLowerCase().includes(termino),
        );
    }, [deudas, busqueda]);

    // Pendiente por divisa de lo que se está viendo (sin mezclar divisas).
    const pendiente = useMemo(() => {
        const totales = new Map<string, { simbolo: string; total: number }>();
        for (const d of filtradas) {
            if (d.estado !== "abierta") continue;
            const actual = totales.get(d.divisa.codigo) ?? { simbolo: d.divisa.simbolo, total: 0 };
            totales.set(d.divisa.codigo, { ...actual, total: actual.total + Number(d.saldo) });
        }
        return [...totales.entries()].sort(([a], [b]) => a.localeCompare(b));
    }, [filtradas]);

    const { pagina, setPagina, totalPaginas, inicio, fin } = usePaginacion(
        filtradas.length, POR_PAGINA, `${busqueda}|${deudorFiltro}|${estadoFiltro}`,
    );

    const opcionesDeudor = deudores.map((d) => ({ value: String(d.id), label: d.nombre }));

    return (
        <>
            <PageHeader
                title="Deudas"
                subtitle="Lo que le deben a la caja y su historial de abonos"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Tesorería", to: "/tesoreria" },
                    { label: "Deudas" },
                ]}
            />

            <div className="container-fluid">
                {!editable && <AvisoSoloLectura area="Tesorería" />}

                {pendiente.length > 0 && (
                    <div className="row g-3 mb-3">
                        {pendiente.map(([codigo, { simbolo, total }]) => (
                            <div className="col-md-3 col-sm-6" key={codigo}>
                                <div className="card card-outline card-warning mb-0">
                                    <div className="card-body py-2">
                                        <div className="small text-body-secondary">Pendiente {codigo}</div>
                                        <div className="fs-4 fw-bold">{formatearDineroDivisa(simbolo, total)}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="card card-outline card-primary">
                    <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                        <h3 className="card-title mb-0 me-auto">Lista de deudas</h3>
                        <DensidadToggle valor={densidad} onChange={setDensidad} />
                        {editable && (
                            <button
                                className="btn btn-success btn-sm"
                                onClick={() => {
                                    setEnEdicion(null);
                                    setMostrarForm(true);
                                }}
                            >
                                <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>Nueva deuda
                            </button>
                        )}
                    </div>

                    <div className="d-flex flex-wrap gap-2 align-items-center p-3 border-bottom">
                        <BuscadorTabla valor={busqueda} onChange={setBusqueda} placeholder="Buscar por deudor o concepto..." />
                        <FiltroChip
                            etiqueta="Estado"
                            icono="bi-flag"
                            valor={estadoFiltro}
                            opciones={OPCIONES_ESTADO}
                            onChange={(v) => cambiarFiltro("estado", v)}
                            etiquetaTodos="Todos los estados"
                        />
                        <FiltroChip
                            etiqueta="Deudor"
                            icono="bi-person"
                            valor={deudorFiltro}
                            opciones={opcionesDeudor}
                            onChange={(v) => cambiarFiltro("deudor", v)}
                            etiquetaTodos="Todos los deudores"
                        />
                        <Link to="/tesoreria/deudas/deudores" className="btn btn-link btn-sm ms-auto">
                            <i className="bi bi-people me-1" aria-hidden="true"></i>Deudores y estados de cuenta
                        </Link>
                    </div>

                    <div className="card-body p-0">
                        {error ? (
                            <div className="alert alert-danger m-3 text-center">{error}</div>
                        ) : loading ? (
                            <SkeletonTable columnas={9} filas={5} />
                        ) : (
                            <>
                                <DeudasTable
                                    deudas={filtradas.slice(inicio, fin)}
                                    densidad={densidad}
                                    onEditar={editable ? (deuda) => {
                                        setEnEdicion(deuda);
                                        setMostrarForm(true);
                                    } : undefined}
                                    onCancelar={editable ? setACancelar : undefined}
                                />
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 p-3 border-top">
                                    <small className="text-body-secondary">
                                        {filtradas.length === 0
                                            ? "Sin resultados"
                                            : `Mostrando ${inicio + 1}-${Math.min(fin, filtradas.length)} de ${filtradas.length}`}
                                    </small>
                                    <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <Modal
                title={enEdicion ? "Editar deuda" : "Registrar deuda"}
                show={mostrarForm}
                size="modal-lg"
                onClose={() => setMostrarForm(false)}
            >
                <DeudaForm
                    key={enEdicion?.id ?? "nueva"}
                    deuda={enEdicion}
                    deudores={deudores}
                    divisas={divisas}
                    deudorInicial={deudorFiltro ? Number(deudorFiltro) : undefined}
                    onGuardar={guardar}
                    onCancelar={() => setMostrarForm(false)}
                />
            </Modal>

            <CancelarDeudaModal
                deuda={aCancelar}
                onClose={() => setACancelar(null)}
                onCancelada={() => {
                    setACancelar(null);
                    cargar();
                    mostrarToast("Deuda cancelada", "La deuda quedó cancelada en el historial.", "success");
                }}
            />
        </>
    );
}

export default DeudasView;
