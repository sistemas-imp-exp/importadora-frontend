import PageHeader from "../../../../layouts/components/PageHeader";
import { useEffect, useState } from "react";
import {
    actualizarBanco,
    obtenerBancos,
    crearBanco,
    eliminarBanco
} from "../../services/nomina/banco.service";
import type { Banco } from "../../interfaces/nomina/Banco";
import BancosTable from "../../components/bancos/BancosTable";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import BancoForm from "../../components/bancos/BancoForm";
import Modal from "../../../../shared/components/Modal";
import ConfirmModal from "../../../../shared/components/ConfirmModal";
import SmallBox from "../../../../shared/components/SmallBox";
import CardCollapseButton from "../../../../shared/components/CardCollapseButton";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { useToastContext } from "../../../../shared/context/ToastProvider";

function BancosView() {
    const [bancos, setBancos] = useState<Banco[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [mostrarModal, setMostrarModal] = useState(false);
    const [mostrarConfirmModal, setMostrarConfirmModal] = useState(false);

    const [bancoSeleccionado, setBancoSeleccionado] = useState<Banco | null>(null);
    const [bancoEliminar, setBancoEliminar] = useState<Banco | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [colapsado, setColapsado] = useState(false);

    const { mostrarToast } = useToastContext();

    useEffect(() => {
        cargar();
    }, []);

    async function cargar() {
        try {
            const datos = await obtenerBancos();
            setBancos(datos);
            setError(null);
        } catch (error) {
            const mensaje = obtenerMensajeError(error);
            setError(mensaje);
            mostrarToast("Error al cargar", mensaje, "danger");
        } finally {
            setLoading(false);
        }
    }

    async function guardarBanco(banco: Banco) {
        try {
            if (banco.id === 0) {
                await crearBanco(banco);
                mostrarToast("Banco creado", "El banco fue registrado correctamente.", "success");
            } else {
                await actualizarBanco(banco);
                mostrarToast("Banco actualizado", "Los cambios fueron guardados correctamente.", "success");
            }

            await cargar();

            setMostrarModal(false);
            setBancoSeleccionado(null);
        } catch (error) {
            mostrarToast("Error del servidor", obtenerMensajeError(error), "danger");
            setBancoSeleccionado(banco);
            throw error;
        }
    }

    async function borrarBanco() {
        if (!bancoEliminar) return;

        try {
            setIsLoading(true);
            await eliminarBanco(bancoEliminar.id);
            await cargar();

            setMostrarConfirmModal(false);
            setBancoEliminar(null);

            mostrarToast("Banco eliminado", "El banco fue eliminado correctamente.", "success");
        } catch (error) {
            mostrarToast("Error del servidor", obtenerMensajeError(error), "danger");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            <PageHeader
                title="Bancos"
                subtitle="Catálogo de bancos para la cuenta bancaria de los empleados"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Tesorería", to: "/tesoreria" },
                    { label: "Catálogos" },
                    { label: "Bancos" }
                ]}
            />

            <div className="container-fluid">
                <div className="row mb-3">
                    <div className="col-md-3 col-6">
                        <SmallBox titulo="Bancos activos" valor={bancos.filter((b) => b.activo).length} icono="bi bi-bank2" color="success" />
                    </div>
                    <div className="col-md-3 col-6">
                        <SmallBox titulo="Bancos en total" valor={bancos.length} icono="bi bi-bank2" color="primary" />
                    </div>
                </div>

                <div className="card card-outline card-primary">
                    <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                        <h3 className="card-title mb-0 me-auto">Lista de bancos</h3>

                        <div className="card-tools d-flex gap-2">
                            <button
                                className="btn btn-success"
                                onClick={() => {
                                    setBancoSeleccionado(null);
                                    setMostrarModal(true);
                                }}
                            >
                                <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
                                Nuevo banco
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
                                <BancosTable
                                    bancos={bancos}
                                    onEditar={(banco) => {
                                        setBancoSeleccionado(banco);
                                        setMostrarModal(true);
                                    }}
                                    onDelete={(banco) => {
                                        setBancoEliminar(banco);
                                        setMostrarConfirmModal(true);
                                    }}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Modal
                title={bancoSeleccionado ? "Editar banco" : "Registrar banco"}
                show={mostrarModal}
                onClose={() => {
                    setMostrarModal(false);
                    setBancoSeleccionado(null);
                }}
            >
                <BancoForm
                    banco={bancoSeleccionado}
                    onGuardar={guardarBanco}
                    onCancelar={() => {
                        setMostrarModal(false);
                        setBancoSeleccionado(null);
                    }}
                />
            </Modal>

            <ConfirmModal
                show={mostrarConfirmModal}
                isLoading={isLoading}
                onCancel={() => {
                    setMostrarConfirmModal(false);
                    setBancoEliminar(null);
                }}
                onConfirm={borrarBanco}
            >
                <div className="text-center">
                    <i className="bi bi-exclamation-triangle-fill text-warning fs-1"></i>

                    <h3 id="modal-title" className="text-slate-900 text-base font-semibold dark:text-slate-50">
                        ¿Está seguro de eliminar el banco <strong>{bancoEliminar?.nombre}</strong>?
                    </h3>

                    <p className="text-slate-600 text-sm mt-2 leading-relaxed dark:text-slate-400">
                        Esta acción no se puede deshacer.
                    </p>
                </div>
            </ConfirmModal>
        </>
    );
}

export default BancosView;
