import PageHeader from "../../../../layouts/components/PageHeader";
import { useEffect, useState } from "react";
import {
    actualizarPuesto,
    obtenerPuestos,
    crearPuesto,
    eliminarPuesto
} from "../../services/nomina/puesto.service";
import type { Puesto } from "../../interfaces/nomina/Puesto";
import PuestosTable from "../../components/puestos/PuestosTable";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import PuestoForm from "../../components/puestos/PuestoForm";
import Modal from "../../../../shared/components/Modal";
import ConfirmModal from "../../../../shared/components/ConfirmModal";
import SmallBox from "../../../../shared/components/SmallBox";
import CardCollapseButton from "../../../../shared/components/CardCollapseButton";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { useToastContext } from "../../../../shared/context/ToastProvider";

function PuestosView() {
    const [puestos, setPuestos] = useState<Puesto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [mostrarModal, setMostrarModal] = useState(false);
    const [mostrarConfirmModal, setMostrarConfirmModal] = useState(false);

    const [puestoSeleccionado, setPuestoSeleccionado] = useState<Puesto | null>(null);
    const [puestoEliminar, setPuestoEliminar] = useState<Puesto | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [colapsado, setColapsado] = useState(false);

    const { mostrarToast } = useToastContext();

    useEffect(() => {
        cargar();
    }, []);

    async function cargar() {
        try {
            const datos = await obtenerPuestos();
            setPuestos(datos);
            setError(null);
        } catch (error) {
            const mensaje = obtenerMensajeError(error);
            setError(mensaje);
            mostrarToast("Error al cargar", mensaje, "danger");
        } finally {
            setLoading(false);
        }
    }

    async function guardarPuesto(puesto: Puesto) {
        try {
            if (puesto.id === 0) {
                await crearPuesto(puesto);
                mostrarToast("Puesto creado", "El puesto fue registrado correctamente.", "success");
            } else {
                await actualizarPuesto(puesto);
                mostrarToast("Puesto actualizado", "Los cambios fueron guardados correctamente.", "success");
            }

            await cargar();

            setMostrarModal(false);
            setPuestoSeleccionado(null);
        } catch (error) {
            mostrarToast("Error del servidor", obtenerMensajeError(error), "danger");
            setPuestoSeleccionado(puesto);
            throw error;
        }
    }

    async function borrarPuesto() {
        if (!puestoEliminar) return;

        try {
            setIsLoading(true);
            await eliminarPuesto(puestoEliminar.id);
            await cargar();

            setMostrarConfirmModal(false);
            setPuestoEliminar(null);

            mostrarToast("Puesto eliminado", "El puesto fue eliminado correctamente.", "success");
        } catch (error) {
            mostrarToast("Error del servidor", obtenerMensajeError(error), "danger");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            <PageHeader
                title="Puestos"
                subtitle="Catálogo de puestos para los empleados de nómina"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Tesorería", to: "/tesoreria" },
                    { label: "Catálogos" },
                    { label: "Puestos" }
                ]}
            />

            <div className="container-fluid">
                <div className="row mb-3">
                    <div className="col-md-3 col-6">
                        <SmallBox titulo="Puestos activos" valor={puestos.filter((p) => p.activo).length} icono="bi bi-briefcase" color="success" />
                    </div>
                    <div className="col-md-3 col-6">
                        <SmallBox titulo="Puestos en total" valor={puestos.length} icono="bi bi-briefcase" color="primary" />
                    </div>
                </div>

                <div className="card card-outline card-primary">
                    <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                        <h3 className="card-title mb-0 me-auto">Lista de puestos</h3>

                        <div className="card-tools d-flex gap-2">
                            <button
                                className="btn btn-success"
                                onClick={() => {
                                    setPuestoSeleccionado(null);
                                    setMostrarModal(true);
                                }}
                            >
                                <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
                                Nuevo puesto
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
                                <PuestosTable
                                    puestos={puestos}
                                    onEditar={(puesto) => {
                                        setPuestoSeleccionado(puesto);
                                        setMostrarModal(true);
                                    }}
                                    onDelete={(puesto) => {
                                        setPuestoEliminar(puesto);
                                        setMostrarConfirmModal(true);
                                    }}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Modal
                title={puestoSeleccionado ? "Editar puesto" : "Registrar puesto"}
                show={mostrarModal}
                onClose={() => {
                    setMostrarModal(false);
                    setPuestoSeleccionado(null);
                }}
            >
                <PuestoForm
                    puesto={puestoSeleccionado}
                    onGuardar={guardarPuesto}
                    onCancelar={() => {
                        setMostrarModal(false);
                        setPuestoSeleccionado(null);
                    }}
                />
            </Modal>

            <ConfirmModal
                show={mostrarConfirmModal}
                isLoading={isLoading}
                onCancel={() => {
                    setMostrarConfirmModal(false);
                    setPuestoEliminar(null);
                }}
                onConfirm={borrarPuesto}
            >
                <div className="text-center">
                    <i className="bi bi-exclamation-triangle-fill text-warning fs-1"></i>

                    <h3 id="modal-title" className="text-slate-900 text-base font-semibold dark:text-slate-50">
                        ¿Está seguro de eliminar el puesto <strong>{puestoEliminar?.nombre}</strong>?
                    </h3>

                    <p className="text-slate-600 text-sm mt-2 leading-relaxed dark:text-slate-400">
                        Esta acción no se puede deshacer.
                    </p>
                </div>
            </ConfirmModal>
        </>
    );
}

export default PuestosView;
