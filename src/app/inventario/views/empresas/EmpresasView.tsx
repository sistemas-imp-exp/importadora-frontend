import PageHeader from "../../../../layouts/components/PageHeader";
import { useEffect, useState } from "react";
import { actualizarEmpresa, obtenerEmpresas, crearEmpresa } from "../../services/empresa.service";
import type { Empresa } from "../../interfaces/empresas/Empresa";
import EmpresasTable from "../../components/empresas/EmpresasTable";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import EmpresaForm from "../../components/empresas/EmpresaForm";
import Modal from "../../../../shared/components/Modal";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { useToastContext } from "../../../../shared/context/ToastProvider";

function EmpresasView() {
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [empresaSeleccionada, setEmpresaSeleccionada] = useState<Empresa | null>(null);

    const { mostrarToast } = useToastContext();

    useEffect(() => {
        cargar();
    }, []);

    async function cargar() {
        try {
            const datos = await obtenerEmpresas();
            setEmpresas(datos);
            setError(null);
        } catch (error) {
            const mensaje = obtenerMensajeError(error);
            setError(mensaje);
            mostrarToast("Error al cargar", mensaje, "danger");
        } finally {
            setLoading(false);
        }
    }

    async function guardarEmpresa(empresa: Empresa) {
        try {
            if (empresa.id === 0) {
                await crearEmpresa(empresa);
                mostrarToast("Empresa creada", "La empresa fue registrada correctamente.", "success");
            } else {
                await actualizarEmpresa(empresa);
                mostrarToast("Empresa actualizada", "Los cambios fueron guardados correctamente.", "success");
            }
            await cargar();
            setMostrarModal(false);
            setEmpresaSeleccionada(null);
        } catch (error) {
            mostrarToast("Error del servidor", obtenerMensajeError(error), "danger");
            setEmpresaSeleccionada(empresa);
            throw error;
        }
    }

    return (
        <>
            <PageHeader
                title="Empresas"
                subtitle="Empresas propietarias de cámaras de resguardo"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Inventario", to: "/inventario" },
                    { label: "Empresas" }
                ]}
            />

            <div className="container-fluid">
                <div className="card card-outline card-primary">
                    <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                        <h3 className="card-title mb-0 me-auto">Lista de empresas</h3>
                        <button
                            className="btn btn-success"
                            onClick={() => {
                                setEmpresaSeleccionada(null);
                                setMostrarModal(true);
                            }}
                        >
                            <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
                            Nueva empresa
                        </button>
                    </div>

                    <div className="card-body p-0">
                        {error ? (
                            <div className="alert alert-danger m-3" role="alert">
                                <div className="text-center">{error}</div>
                            </div>
                        ) : loading ? (
                            <SkeletonTable columnas={2} filas={5} />
                        ) : (
                            <EmpresasTable
                                empresas={empresas}
                                onEditar={(empresa) => {
                                    setEmpresaSeleccionada(empresa);
                                    setMostrarModal(true);
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>

            <Modal
                title={empresaSeleccionada ? "Editar empresa" : "Registrar empresa"}
                show={mostrarModal}
                onClose={() => {
                    setMostrarModal(false);
                    setEmpresaSeleccionada(null);
                }}
            >
                <EmpresaForm
                    empresa={empresaSeleccionada}
                    onGuardar={guardarEmpresa}
                    onCancelar={() => {
                        setMostrarModal(false);
                        setEmpresaSeleccionada(null);
                    }}
                />
            </Modal>
        </>
    );
}

export default EmpresasView;
