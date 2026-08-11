import PageHeader from "../../../../layouts/components/PageHeader";
import { useEffect, useState } from "react";
import {
    actualizarEmpleado,
    obtenerEmpleados,
    crearEmpleado,
    eliminarEmpleado
} from "../../services/nomina/empleado.service";
import { obtenerRanchos } from "../../services/nomina/rancho.service";
import { obtenerPuestos } from "../../services/nomina/puesto.service";
import { obtenerBancos } from "../../services/nomina/banco.service";
import type { Empleado, EmpleadoRequest } from "../../interfaces/nomina/Empleado";
import type { Rancho } from "../../interfaces/nomina/Rancho";
import type { Puesto } from "../../interfaces/nomina/Puesto";
import type { Banco } from "../../interfaces/nomina/Banco";
import EmpleadosTable from "../../components/empleados/EmpleadosTable";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import EmpleadoForm from "../../components/empleados/EmpleadoForm";
import Modal from "../../../../shared/components/Modal";
import ConfirmModal from "../../../../shared/components/ConfirmModal";
import SmallBox from "../../../../shared/components/SmallBox";
import CardCollapseButton from "../../../../shared/components/CardCollapseButton";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { useToastContext } from "../../../../shared/context/ToastProvider";

function EmpleadosView() {
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [ranchos, setRanchos] = useState<Rancho[]>([]);
    const [puestos, setPuestos] = useState<Puesto[]>([]);
    const [bancos, setBancos] = useState<Banco[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [mostrarModal, setMostrarModal] = useState(false);
    const [mostrarConfirmModal, setMostrarConfirmModal] = useState(false);

    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<Empleado | null>(null);
    const [empleadoEliminar, setEmpleadoEliminar] = useState<Empleado | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [colapsado, setColapsado] = useState(false);

    const { mostrarToast } = useToastContext();

    useEffect(() => {
        cargar();
    }, []);

    async function cargar() {
        try {
            const [datosEmpleados, datosRanchos, datosPuestos, datosBancos] = await Promise.all([
                obtenerEmpleados(),
                obtenerRanchos(),
                obtenerPuestos(),
                obtenerBancos()
            ]);
            setEmpleados(datosEmpleados);
            setRanchos(datosRanchos.filter((r) => r.activo));
            setPuestos(datosPuestos.filter((p) => p.activo));
            setBancos(datosBancos.filter((b) => b.activo));
            setError(null);
        } catch (error) {
            const mensaje = obtenerMensajeError(error);
            setError(mensaje);
            mostrarToast("Error al cargar", mensaje, "danger");
        } finally {
            setLoading(false);
        }
    }

    async function guardarEmpleado(empleado: EmpleadoRequest) {
        try {
            if (empleado.id === 0) {
                await crearEmpleado(empleado);
                mostrarToast("Empleado creado", "El empleado fue registrado correctamente.", "success");
            } else {
                await actualizarEmpleado(empleado);
                mostrarToast("Empleado actualizado", "Los cambios fueron guardados correctamente.", "success");
            }

            await cargar();

            setMostrarModal(false);
            setEmpleadoSeleccionado(null);
        } catch (error) {
            mostrarToast("Error del servidor", obtenerMensajeError(error), "danger");
            throw error;
        }
    }

    async function borrarEmpleado() {
        if (!empleadoEliminar) return;

        try {
            setIsLoading(true);
            await eliminarEmpleado(empleadoEliminar.id);
            await cargar();

            setMostrarConfirmModal(false);
            setEmpleadoEliminar(null);

            mostrarToast("Empleado eliminado", "El empleado fue eliminado correctamente.", "success");
        } catch (error) {
            mostrarToast("Error del servidor", obtenerMensajeError(error), "danger");
        } finally {
            setIsLoading(false);
        }
    }

    const sinCatalogos = !loading && !error && (ranchos.length === 0 || puestos.length === 0);

    return (
        <>
            <PageHeader
                title="Empleados"
                subtitle="Empleados por rancho para la nómina semanal"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Tesorería", to: "/tesoreria" },
                    { label: "Catálogos" },
                    { label: "Empleados" }
                ]}
            />

            <div className="container-fluid">
                {sinCatalogos && (
                    <div className="callout callout-warning mb-3">
                        <p>
                            Necesitas al menos un <b>rancho</b> y un <b>puesto</b> activos antes de registrar empleados.
                        </p>
                    </div>
                )}

                <div className="row mb-3">
                    <div className="col-md-3 col-6">
                        <SmallBox titulo="Empleados activos" valor={empleados.filter((e) => e.activo).length} icono="bi bi-person-badge" color="success" />
                    </div>
                    <div className="col-md-3 col-6">
                        <SmallBox titulo="Empleados en total" valor={empleados.length} icono="bi bi-person-badge" color="primary" />
                    </div>
                </div>

                <div className="card card-outline card-primary">
                    <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                        <h3 className="card-title mb-0 me-auto">Lista de empleados</h3>

                        <div className="card-tools d-flex gap-2">
                            <button
                                className="btn btn-success"
                                disabled={sinCatalogos}
                                onClick={() => {
                                    setEmpleadoSeleccionado(null);
                                    setMostrarModal(true);
                                }}
                            >
                                <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
                                Nuevo empleado
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
                                <SkeletonTable columnas={8} filas={5} />
                            ) : (
                                <EmpleadosTable
                                    empleados={empleados}
                                    onEditar={(empleado) => {
                                        setEmpleadoSeleccionado(empleado);
                                        setMostrarModal(true);
                                    }}
                                    onDelete={(empleado) => {
                                        setEmpleadoEliminar(empleado);
                                        setMostrarConfirmModal(true);
                                    }}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Modal
                title={empleadoSeleccionado ? "Editar empleado" : "Registrar empleado"}
                show={mostrarModal}
                size="modal-lg"
                onClose={() => {
                    setMostrarModal(false);
                    setEmpleadoSeleccionado(null);
                }}
            >
                <EmpleadoForm
                    empleado={empleadoSeleccionado}
                    ranchos={ranchos}
                    puestos={puestos}
                    bancos={bancos}
                    onGuardar={guardarEmpleado}
                    onCancelar={() => {
                        setMostrarModal(false);
                        setEmpleadoSeleccionado(null);
                    }}
                />
            </Modal>

            <ConfirmModal
                show={mostrarConfirmModal}
                isLoading={isLoading}
                onCancel={() => {
                    setMostrarConfirmModal(false);
                    setEmpleadoEliminar(null);
                }}
                onConfirm={borrarEmpleado}
            >
                <div className="text-center">
                    <i className="bi bi-exclamation-triangle-fill text-warning fs-1"></i>

                    <h3 id="modal-title" className="text-slate-900 text-base font-semibold dark:text-slate-50">
                        ¿Está seguro de eliminar a <strong>{empleadoEliminar?.nombre}</strong>?
                    </h3>

                    <p className="text-slate-600 text-sm mt-2 leading-relaxed dark:text-slate-400">
                        Esta acción no se puede deshacer.
                    </p>
                </div>
            </ConfirmModal>
        </>
    );
}

export default EmpleadosView;
