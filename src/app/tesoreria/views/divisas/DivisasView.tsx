import PageHeader from "../../../../layouts/components/PageHeader";
import { useEffect, useState } from "react";
import {
    actualizarDivisa,
    obtenerDivisas,
    crearDivisa,
    eliminarDivisa
} from "../../services/divisa.service";
import type { Divisa } from "../../interfaces/divisas/Divisa";
import DivisasTable from "../../components/divisas/DivisasTable";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import DivisaForm from "../../components/divisas/DivisaForm";
import Modal from "../../../../shared/components/Modal";
import ConfirmModal from "../../../../shared/components/ConfirmModal";
import SmallBox from "../../../../shared/components/SmallBox";
import CardCollapseButton from "../../../../shared/components/CardCollapseButton";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { useToastContext } from "../../../../shared/context/ToastProvider";

function DivisasView() {
    const [divisas, setDivisas] = useState<Divisa[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [mostrarModal, setMostrarModal] = useState(false);
    const [mostrarConfirmModal, setMostrarConfirmModal] = useState(false);

    const [divisaSeleccionada, setDivisaSeleccionada] = useState<Divisa | null>(null);
    const [divisaEliminar, setDivisaEliminar] = useState<Divisa | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [colapsado, setColapsado] = useState(false);

    const { mostrarToast } = useToastContext();

    useEffect(() => {
        cargar();
    }, []);

    async function cargar() {
        try {
            const datos = await obtenerDivisas();

            setDivisas(datos);
            setError(null);

        } catch (error) {

            const mensaje = obtenerMensajeError(error);

            setError(mensaje);

            mostrarToast(
                "Error al cargar",
                mensaje,
                "danger"
            );

        } finally {
            setLoading(false);
        }
    }

    async function guardarDivisa(divisa: Divisa) {
        try {

            if (divisa.id === 0) {

                await crearDivisa(divisa);

                mostrarToast(
                    "Divisa creada",
                    "La divisa fue registrada correctamente.",
                    "success"
                );

            } else {

                await actualizarDivisa(divisa);

                mostrarToast(
                    "Divisa actualizada",
                    "Los cambios fueron guardados correctamente.",
                    "success"
                );

            }

            await cargar();

            setMostrarModal(false);
            setDivisaSeleccionada(null);

        } catch (error) {

            mostrarToast(
                "Error del servidor",
                obtenerMensajeError(error),
                "danger"
            );

            // Mantiene abierto el formulario para corregir.
            setDivisaSeleccionada(divisa);
            throw error;
        }
    }

    async function borrarDivisa() {
        if (!divisaEliminar) return;

        try {
            setIsLoading(true);

            await eliminarDivisa(divisaEliminar.id);

            await cargar();

            setMostrarConfirmModal(false);
            setDivisaEliminar(null);

            mostrarToast(
                "Divisa eliminada",
                "La divisa fue eliminada correctamente.",
                "success"
            );

        } catch (error) {

            mostrarToast(
                "Error del servidor",
                obtenerMensajeError(error),
                "danger"
            );

        } finally {

            setIsLoading(false);

        }
    }

    return (
        <>
            <PageHeader
                title="Divisas"
                subtitle="Administración de monedas para movimientos de y arqueo de caja"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Tesorería", to: "/tesoreria" },
                    { label: "Divisas" }
                ]}
            />

            <div className="container-fluid">

                <div className="callout callout-info mb-3">
                    <p>
                        Una vez registrada una divisa, no se podrá <b>eliminar</b>.
                        Puede cambiar su <b>estado</b> si no desea usarla.
                    </p>
                </div>

                <div className="row mb-3">
                    <div className="col-md-3 col-6">
                        <SmallBox titulo="Divisas activas" valor={divisas.filter((d) => d.activa).length} icono="bi bi-currency-exchange" color="success" />
                    </div>
                    <div className="col-md-3 col-6">
                        <SmallBox titulo="Divisas en total" valor={divisas.length} icono="bi bi-currency-exchange" color="primary" />
                    </div>
                </div>

                <div className="card card-outline card-primary">

                    <div className="card-header d-flex flex-wrap gap-2 align-items-center">

                        <h3 className="card-title mb-0 me-auto">
                            Lista de divisas
                        </h3>

                        <div className="card-tools d-flex gap-2">

                            <button
                                className="btn btn-success"
                                onClick={() => {
                                    setDivisaSeleccionada(null);
                                    setMostrarModal(true);
                                }}
                            >
                                <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
                                Nueva divisa
                            </button>

                            <CardCollapseButton collapsed={colapsado} onToggle={() => setColapsado((c) => !c)} />

                        </div>

                    </div>

                    {!colapsado && (
                        <div className="card-body p-0">

                            {error ? (

                                <div
                                    className="alert alert-danger m-3"
                                    role="alert"
                                >
                                    <div className="text-center">
                                        {error}
                                    </div>
                                </div>

                            ) : loading ? (

                                <SkeletonTable columnas={4} filas={5} />

                            ) : (

                                <DivisasTable
                                    divisas={divisas}
                                    onEditar={(divisa) => {
                                        setDivisaSeleccionada(divisa);
                                        setMostrarModal(true);
                                    }}
                                    onDelete={(divisa) => {
                                        setDivisaEliminar(divisa);
                                        setMostrarConfirmModal(true);
                                    }}
                                />

                            )}

                        </div>
                    )}

                </div>

            </div>

            <Modal
                title={
                    divisaSeleccionada
                        ? "Editar divisa"
                        : "Registrar divisa"
                }
                show={mostrarModal}
                onClose={() => {
                    setMostrarModal(false);
                    setDivisaSeleccionada(null);
                }}
            >
                <DivisaForm
                    divisa={divisaSeleccionada}
                    onGuardar={guardarDivisa}
                    onCancelar={() => {
                        setMostrarModal(false);
                        setDivisaSeleccionada(null);
                    }}
                />
            </Modal>

            <ConfirmModal
                show={mostrarConfirmModal}
                isLoading={isLoading}
                onCancel={() => {
                    setMostrarConfirmModal(false);
                    setDivisaEliminar(null);
                }}
                onConfirm={borrarDivisa}
            >
                <div className="text-center">

                    <i className="bi bi-exclamation-triangle-fill text-warning fs-1"></i>

                    <h3
                        id="modal-title"
                        className="text-slate-900 text-base font-semibold dark:text-slate-50"
                    >
                        ¿Está seguro de eliminar la divisa{" "}
                        <strong>{divisaEliminar?.nombre}</strong>?
                    </h3>

                    <p className="text-slate-600 text-sm mt-2 leading-relaxed dark:text-slate-400">
                        Esta acción no se puede deshacer. Esto eliminará permanentemente la
                        divisa de nuestra base de datos.
                    </p>

                </div>
            </ConfirmModal>
        </>
    );
}

export default DivisasView;