import PageHeader from "../../../../layouts/components/PageHeader";
import { useEffect, useState } from "react";
import {
    actualizarRancho,
    obtenerRanchos,
    crearRancho,
    eliminarRancho
} from "../../services/nomina/rancho.service";
import type { Rancho } from "../../interfaces/nomina/Rancho";
import RanchosTable from "../../components/ranchos/RanchosTable";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import RanchoForm from "../../components/ranchos/RanchoForm";
import Modal from "../../../../shared/components/Modal";
import ConfirmModal from "../../../../shared/components/ConfirmModal";
import SmallBox from "../../../../shared/components/SmallBox";
import CardCollapseButton from "../../../../shared/components/CardCollapseButton";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { useToastContext } from "../../../../shared/context/ToastProvider";

function RanchosView() {
    const [ranchos, setRanchos] = useState<Rancho[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [mostrarModal, setMostrarModal] = useState(false);
    const [mostrarConfirmModal, setMostrarConfirmModal] = useState(false);

    const [ranchoSeleccionado, setRanchoSeleccionado] = useState<Rancho | null>(null);
    const [ranchoEliminar, setRanchoEliminar] = useState<Rancho | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [colapsado, setColapsado] = useState(false);

    const { mostrarToast } = useToastContext();

    useEffect(() => {
        cargar();
    }, []);

    async function cargar() {
        try {
            const datos = await obtenerRanchos();
            setRanchos(datos);
            setError(null);
        } catch (error) {
            const mensaje = obtenerMensajeError(error);
            setError(mensaje);
            mostrarToast("Error al cargar", mensaje, "danger");
        } finally {
            setLoading(false);
        }
    }

    async function guardarRancho(rancho: Rancho) {
        try {
            if (rancho.id === 0) {
                await crearRancho(rancho);
                mostrarToast("Rancho creado", "El rancho fue registrado correctamente.", "success");
            } else {
                await actualizarRancho(rancho);
                mostrarToast("Rancho actualizado", "Los cambios fueron guardados correctamente.", "success");
            }

            await cargar();

            setMostrarModal(false);
            setRanchoSeleccionado(null);
        } catch (error) {
            mostrarToast("Error del servidor", obtenerMensajeError(error), "danger");
            setRanchoSeleccionado(rancho);
            throw error;
        }
    }

    async function borrarRancho() {
        if (!ranchoEliminar) return;

        try {
            setIsLoading(true);
            await eliminarRancho(ranchoEliminar.id);
            await cargar();

            setMostrarConfirmModal(false);
            setRanchoEliminar(null);

            mostrarToast("Rancho eliminado", "El rancho fue eliminado correctamente.", "success");
        } catch (error) {
            mostrarToast("Error del servidor", obtenerMensajeError(error), "danger");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            <PageHeader
                title="Ranchos"
                subtitle="Administración de ranchos para la nómina semanal"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Tesorería", to: "/tesoreria" },
                    { label: "Catálogos" },
                    { label: "Ranchos" }
                ]}
            />

            <div className="container-fluid">
                <div className="row mb-3">
                    <div className="col-md-3 col-6">
                        <SmallBox titulo="Ranchos activos" valor={ranchos.filter((r) => r.activo).length} icono="bi bi-geo-alt" color="success" />
                    </div>
                    <div className="col-md-3 col-6">
                        <SmallBox titulo="Ranchos en total" valor={ranchos.length} icono="bi bi-geo-alt" color="primary" />
                    </div>
                </div>

                <div className="card card-outline card-primary">
                    <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                        <h3 className="card-title mb-0 me-auto">Lista de ranchos</h3>

                        <div className="card-tools d-flex gap-2">
                            <button
                                className="btn btn-success"
                                onClick={() => {
                                    setRanchoSeleccionado(null);
                                    setMostrarModal(true);
                                }}
                            >
                                <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
                                Nuevo rancho
                            </button>
                            <CardCollapseButton collapsed={colapsado} onToggle={() => setColapsado((c) => !c)} />
                        </div>
                    </div>

                    {!colapsado && (
                        <div className="card-body p-0">
                            {error ? (
                                <div className="alert alert-danger m-3" role="alert">
                                    <div className="text-center">{error}</div>
                                </div>
                            ) : loading ? (
                                <SkeletonTable columnas={3} filas={5} />
                            ) : (
                                <RanchosTable
                                    ranchos={ranchos}
                                    onEditar={(rancho) => {
                                        setRanchoSeleccionado(rancho);
                                        setMostrarModal(true);
                                    }}
                                    onDelete={(rancho) => {
                                        setRanchoEliminar(rancho);
                                        setMostrarConfirmModal(true);
                                    }}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Modal
                title={ranchoSeleccionado ? "Editar rancho" : "Registrar rancho"}
                show={mostrarModal}
                onClose={() => {
                    setMostrarModal(false);
                    setRanchoSeleccionado(null);
                }}
            >
                <RanchoForm
                    rancho={ranchoSeleccionado}
                    onGuardar={guardarRancho}
                    onCancelar={() => {
                        setMostrarModal(false);
                        setRanchoSeleccionado(null);
                    }}
                />
            </Modal>

            <ConfirmModal
                show={mostrarConfirmModal}
                isLoading={isLoading}
                onCancel={() => {
                    setMostrarConfirmModal(false);
                    setRanchoEliminar(null);
                }}
                onConfirm={borrarRancho}
            >
                <div className="text-center">
                    <i className="bi bi-exclamation-triangle-fill text-warning fs-1"></i>

                    <h3 id="modal-title" className="text-slate-900 text-base font-semibold dark:text-slate-50">
                        ¿Está seguro de eliminar el rancho <strong>{ranchoEliminar?.nombre}</strong>?
                    </h3>

                    <p className="text-slate-600 text-sm mt-2 leading-relaxed dark:text-slate-400">
                        Esta acción no se puede deshacer.
                    </p>
                </div>
            </ConfirmModal>
        </>
    );
}

export default RanchosView;
