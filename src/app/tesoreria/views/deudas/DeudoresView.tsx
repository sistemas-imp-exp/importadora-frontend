import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import PageHeader from "../../../../layouts/components/PageHeader";
import Modal from "../../../../shared/components/Modal";
import BuscadorTabla from "../../../../shared/components/BuscadorTabla";
import Paginacion from "../../../../shared/components/Paginacion";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import AvisoSoloLectura from "../../../../shared/components/AvisoSoloLectura";
import BotonAccionFila from "../../../../shared/components/tabla/BotonAccionFila";
import { usePaginacion } from "../../../../shared/hooks/usePaginacion";
import { useAuth } from "../../../../shared/hooks/useAuth";
import { useToastContext } from "../../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import DeudorForm from "../../components/deudas/DeudorForm";
import { TIPOS_DEUDOR, type Deudor, type DeudorRequest } from "../../interfaces/deudas/Deuda";
import { actualizarDeudor, crearDeudor, descargarEstadoCuenta, obtenerDeudores } from "../../services/deudas.service";

const POR_PAGINA = 15;

type FiltroEstado = "activos" | "inactivos" | "todos";

function DeudoresView() {
    const { puedeEditar } = useAuth();
    const editable = puedeEditar("TES");
    const { mostrarToast } = useToastContext();
    const [deudores, setDeudores] = useState<Deudor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("activos");
    const [mostrarModal, setMostrarModal] = useState(false);
    const [seleccionado, setSeleccionado] = useState<Deudor | null>(null);
    const [descargando, setDescargando] = useState<string | null>(null);

    useEffect(() => {
        cargar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function cargar() {
        try {
            setDeudores(await obtenerDeudores());
            setError(null);
        } catch (err) {
            const mensaje = obtenerMensajeError(err);
            setError(mensaje);
            mostrarToast("Error al cargar", mensaje, "danger");
        } finally {
            setLoading(false);
        }
    }

    async function guardar(datos: DeudorRequest) {
        try {
            if (seleccionado) {
                await actualizarDeudor(seleccionado.id, datos);
                mostrarToast("Deudor actualizado", "Los cambios se guardaron correctamente.", "success");
            } else {
                await crearDeudor(datos);
                mostrarToast("Deudor registrado", "El deudor se registró correctamente.", "success");
            }
            setMostrarModal(false);
            setSeleccionado(null);
            await cargar();
        } catch (err) {
            mostrarToast("Error al guardar", obtenerMensajeError(err), "danger");
            throw err;
        }
    }

    async function descargar(deudor: Deudor, formato: "pdf" | "excel") {
        setDescargando(`${deudor.id}-${formato}`);
        try {
            await descargarEstadoCuenta(deudor, formato);
        } catch (err) {
            mostrarToast("Error al descargar", obtenerMensajeError(err), "danger");
        } finally {
            setDescargando(null);
        }
    }

    const filtrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();
        return deudores.filter((d) => {
            if (filtroEstado === "activos" && !d.activo) return false;
            if (filtroEstado === "inactivos" && d.activo) return false;
            return !termino || d.nombre.toLowerCase().includes(termino) || d.telefono.includes(termino);
        });
    }, [deudores, busqueda, filtroEstado]);

    const { pagina, setPagina, totalPaginas, inicio, fin } = usePaginacion(
        filtrados.length, POR_PAGINA, `${busqueda}|${filtroEstado}`,
    );

    function abrir(deudor: Deudor | null) {
        setSeleccionado(deudor);
        setMostrarModal(true);
    }

    return (
        <>
            <PageHeader
                title="Deudores"
                subtitle="Personas que le deben a la caja: trabajadores o externos"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Tesorería", to: "/tesoreria" },
                    { label: "Deudas" },
                    { label: "Deudores" },
                ]}
            />

            <div className="container-fluid">
                {!editable && <AvisoSoloLectura area="Tesorería" />}

                <div className="card card-outline card-primary">
                    <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                        <h3 className="card-title mb-0 me-auto">Lista de deudores</h3>
                        {editable && (
                            <button className="btn btn-success btn-sm" onClick={() => abrir(null)}>
                                <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>Nuevo deudor
                            </button>
                        )}
                    </div>

                    <div className="card-body p-0">
                        {error ? (
                            <div className="alert alert-danger m-3 text-center">{error}</div>
                        ) : loading ? (
                            <SkeletonTable columnas={6} filas={5} />
                        ) : (
                            <>
                                <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center p-3 border-bottom">
                                    <BuscadorTabla valor={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre o teléfono..." />
                                    <select
                                        className="form-select form-select-sm"
                                        style={{ width: "auto" }}
                                        value={filtroEstado}
                                        onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
                                        aria-label="Estado"
                                    >
                                        <option value="activos">Solo activos</option>
                                        <option value="inactivos">Solo inactivos</option>
                                        <option value="todos">Todos</option>
                                    </select>
                                </div>
                                <div className="table-responsive">
                                    <table className="table tabla-datos mb-0">
                                        <thead>
                                            <tr>
                                                <th>Nombre</th>
                                                <th>Tipo</th>
                                                <th>Teléfono</th>
                                                <th>Notas</th>
                                                <th className="num">Deudas abiertas</th>
                                                <th className="text-center">Estado</th>
                                                <th className="text-end">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtrados.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="text-center text-body-secondary py-5">
                                                        <i className="bi bi-inbox fs-3 d-block mb-2" aria-hidden="true"></i>
                                                        {deudores.length === 0 ? "No hay deudores registrados." : "Ningún deudor coincide con la búsqueda."}
                                                    </td>
                                                </tr>
                                            ) : (
                                                filtrados.slice(inicio, fin).map((deudor) => (
                                                    <tr key={deudor.id}>
                                                        <td className="fw-semibold">{deudor.nombre}</td>
                                                        <td>{TIPOS_DEUDOR[deudor.tipo]}</td>
                                                        <td className="text-nowrap">{deudor.telefono || <span className="text-body-secondary">—</span>}</td>
                                                        <td className="truncar" title={deudor.notas || undefined}>
                                                            {deudor.notas || <span className="text-body-secondary">—</span>}
                                                        </td>
                                                        <td className="num">
                                                            {deudor.deudas_abiertas > 0 ? (
                                                                <Link to={`/tesoreria/deudas?deudor=${deudor.id}`}>{deudor.deudas_abiertas}</Link>
                                                            ) : (
                                                                <span className="text-body-secondary">0</span>
                                                            )}
                                                        </td>
                                                        <td className="text-center">
                                                            {deudor.activo ? (
                                                                <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle">Activo</span>
                                                            ) : (
                                                                <span className="badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle">Inactivo</span>
                                                            )}
                                                        </td>
                                                        <td className="text-end text-nowrap">
                                                            <Link
                                                                to={`/tesoreria/deudas?deudor=${deudor.id}`}
                                                                className="btn btn-sm btn-outline-secondary"
                                                                title="Ver deudas"
                                                            >
                                                                <i className="bi bi-list-ul" aria-hidden="true"></i>
                                                                <span className="visually-hidden">Ver deudas de {deudor.nombre}</span>
                                                            </Link>{" "}
                                                            <BotonAccionFila
                                                                icono="bi-file-earmark-pdf"
                                                                etiqueta={`Estado de cuenta en PDF de ${deudor.nombre}`}
                                                                onClick={() => descargar(deudor, "pdf")}
                                                                motivoBloqueo={descargando ? "Descargando..." : null}
                                                            />{" "}
                                                            <BotonAccionFila
                                                                icono="bi-file-earmark-excel"
                                                                etiqueta={`Estado de cuenta en Excel de ${deudor.nombre}`}
                                                                onClick={() => descargar(deudor, "excel")}
                                                                motivoBloqueo={descargando ? "Descargando..." : null}
                                                            />
                                                            {editable && (
                                                                <>
                                                                    {" "}
                                                                    <BotonAccionFila
                                                                        icono="bi-pencil"
                                                                        etiqueta={`Editar a ${deudor.nombre}`}
                                                                        onClick={() => abrir(deudor)}
                                                                    />
                                                                </>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 p-3 border-top">
                                    <small className="text-body-secondary">
                                        {filtrados.length === 0 ? "Sin resultados" : `Mostrando ${inicio + 1}-${Math.min(fin, filtrados.length)} de ${filtrados.length}`}
                                    </small>
                                    <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <Modal
                title={seleccionado ? "Editar deudor" : "Registrar deudor"}
                show={mostrarModal}
                size="modal-lg"
                onClose={() => setMostrarModal(false)}
            >
                <DeudorForm
                    key={seleccionado?.id ?? "nuevo"}
                    deudor={seleccionado}
                    onGuardar={guardar}
                    onCancelar={() => setMostrarModal(false)}
                />
            </Modal>
        </>
    );
}

export default DeudoresView;
