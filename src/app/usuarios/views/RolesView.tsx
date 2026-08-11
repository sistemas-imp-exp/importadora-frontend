import PageHeader from "../../../layouts/components/PageHeader";
import { useEffect, useState } from "react";
import {
    actualizarArea,
    obtenerAreas,
    crearArea,
    eliminarArea,
} from "../services/area.service";
import type { Area } from "../interfaces/Area";
import AreasTable from "../components/AreasTable";
import AreaForm from "../components/AreaForm";
import SkeletonTable from "../../../shared/components/SkeletonTable";
import Modal from "../../../shared/components/Modal";
import ConfirmModal from "../../../shared/components/ConfirmModal";
import SmallBox from "../../../shared/components/SmallBox";
import CardCollapseButton from "../../../shared/components/CardCollapseButton";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import { useToastContext } from "../../../shared/context/ToastProvider";

function RolesView() {
    const [areas, setAreas] = useState<Area[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [mostrarModal, setMostrarModal] = useState(false);
    const [mostrarConfirmModal, setMostrarConfirmModal] = useState(false);

    const [areaSeleccionada, setAreaSeleccionada] = useState<Area | null>(null);
    const [areaEliminar, setAreaEliminar] = useState<Area | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [colapsado, setColapsado] = useState(false);

    const { mostrarToast } = useToastContext();

    useEffect(() => {
        cargar();
    }, []);

    async function cargar() {
        try {
            const datos = await obtenerAreas();

            setAreas(datos);
            setError(null);
        } catch (error) {
            const mensaje = obtenerMensajeError(error);

            setError(mensaje);

            mostrarToast("Error al cargar", mensaje, "danger");
        } finally {
            setLoading(false);
        }
    }

    async function guardarArea(area: Area) {
        try {
            if (area.id === 0) {
                await crearArea(area);

                mostrarToast("Rol creado", "El rol fue registrado correctamente.", "success");
            } else {
                await actualizarArea(area);

                mostrarToast("Rol actualizado", "Los cambios fueron guardados correctamente.", "success");
            }

            await cargar();

            setMostrarModal(false);
            setAreaSeleccionada(null);
        } catch (error) {
            mostrarToast("Error del servidor", obtenerMensajeError(error), "danger");

            // Mantiene abierto el formulario para corregir.
            setAreaSeleccionada(area);
            throw error;
        }
    }

    async function borrarArea() {
        if (!areaEliminar) return;

        try {
            setIsLoading(true);

            await eliminarArea(areaEliminar.id);

            await cargar();

            setMostrarConfirmModal(false);
            setAreaEliminar(null);

            mostrarToast("Rol eliminado", "El rol fue eliminado correctamente.", "success");
        } catch (error) {
            mostrarToast("Error del servidor", obtenerMensajeError(error), "danger");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            <PageHeader
                title="Roles"
                subtitle="Catálogo de roles (áreas de acceso) asignables a los usuarios"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Usuarios", to: "/usuarios" },
                    { label: "Roles" },
                ]}
            />

            <div className="container-fluid">
                <div className="callout callout-info mb-3">
                    <p>
                        Al eliminar un rol, se quitará automáticamente de todos los usuarios
                        que lo tengan asignado. Si solo desea dejar de usarlo, cambie su <b>estado</b>.
                    </p>
                </div>

                <div className="row mb-3">
                    <div className="col-md-3 col-6">
                        <SmallBox titulo="Roles activos" valor={areas.filter((a) => a.activo).length} icono="bi bi-shield-check" color="success" />
                    </div>
                    <div className="col-md-3 col-6">
                        <SmallBox titulo="Roles en total" valor={areas.length} icono="bi bi-shield-check" color="primary" />
                    </div>
                </div>

                <div className="card card-outline card-primary">
                    <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                        <h3 className="card-title mb-0 me-auto">Lista de roles</h3>

                        <div className="card-tools d-flex gap-2">
                            <button
                                className="btn btn-success"
                                onClick={() => {
                                    setAreaSeleccionada(null);
                                    setMostrarModal(true);
                                }}
                            >
                                <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
                                Nuevo rol
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
                                <SkeletonTable columnas={4} filas={5} />
                            ) : (
                                <AreasTable
                                    areas={areas}
                                    onEditar={(area) => {
                                        setAreaSeleccionada(area);
                                        setMostrarModal(true);
                                    }}
                                    onDelete={(area) => {
                                        setAreaEliminar(area);
                                        setMostrarConfirmModal(true);
                                    }}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Modal
                title={areaSeleccionada ? "Editar rol" : "Registrar rol"}
                show={mostrarModal}
                onClose={() => {
                    setMostrarModal(false);
                    setAreaSeleccionada(null);
                }}
            >
                <AreaForm
                    area={areaSeleccionada}
                    onGuardar={guardarArea}
                    onCancelar={() => {
                        setMostrarModal(false);
                        setAreaSeleccionada(null);
                    }}
                />
            </Modal>

            <ConfirmModal
                show={mostrarConfirmModal}
                isLoading={isLoading}
                onCancel={() => {
                    setMostrarConfirmModal(false);
                    setAreaEliminar(null);
                }}
                onConfirm={borrarArea}
            >
                <div className="text-center">
                    <i className="bi bi-exclamation-triangle-fill text-warning fs-1"></i>

                    <h3 id="modal-title" className="text-slate-900 text-base font-semibold dark:text-slate-50">
                        ¿Está seguro de eliminar el rol <strong>{areaEliminar?.nombre}</strong>?
                    </h3>

                    <p className="text-slate-600 text-sm mt-2 leading-relaxed dark:text-slate-400">
                        Esta acción no se puede deshacer y quitará este rol de todos los
                        usuarios que lo tengan asignado.
                    </p>
                </div>
            </ConfirmModal>
        </>
    );
}

export default RolesView;
