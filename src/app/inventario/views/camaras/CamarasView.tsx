import PageHeader from "../../../../layouts/components/PageHeader";
import { useEffect, useState } from "react";
import { actualizarCamara, obtenerCamaras, crearCamara } from "../../services/camara.service";
import { obtenerEmpresas } from "../../services/empresa.service";
import type { Camara } from "../../interfaces/camaras/Camara";
import type { Empresa } from "../../interfaces/empresas/Empresa";
import CamarasTable from "../../components/camaras/CamarasTable";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import CamaraForm from "../../components/camaras/CamaraForm";
import Modal from "../../../../shared/components/Modal";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { useToastContext } from "../../../../shared/context/ToastProvider";

function CamarasView() {
    const [camaras, setCamaras] = useState<Camara[]>([]);
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [camaraSeleccionada, setCamaraSeleccionada] = useState<Camara | null>(null);

    const { mostrarToast } = useToastContext();

    useEffect(() => {
        cargar();
    }, []);

    async function cargar() {
        try {
            const [datosCamaras, datosEmpresas] = await Promise.all([obtenerCamaras(), obtenerEmpresas()]);
            setCamaras(datosCamaras);
            setEmpresas(datosEmpresas);
            setError(null);
        } catch (error) {
            const mensaje = obtenerMensajeError(error);
            setError(mensaje);
            mostrarToast("Error al cargar", mensaje, "danger");
        } finally {
            setLoading(false);
        }
    }

    async function guardarCamara(camara: Camara) {
        try {
            if (camara.id === 0) {
                await crearCamara(camara);
                mostrarToast("Cámara creada", "La cámara fue registrada correctamente.", "success");
            } else {
                await actualizarCamara(camara);
                mostrarToast("Cámara actualizada", "Los cambios fueron guardados correctamente.", "success");
            }
            await cargar();
            setMostrarModal(false);
            setCamaraSeleccionada(null);
        } catch (error) {
            mostrarToast("Error del servidor", obtenerMensajeError(error), "danger");
            setCamaraSeleccionada(camara);
            throw error;
        }
    }

    return (
        <>
            <PageHeader
                title="Cámaras"
                subtitle="Cámaras de resguardo, propias o de terceros"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Inventario", to: "/inventario" },
                    { label: "Cámaras" }
                ]}
            />

            <div className="container-fluid">
                <div className="card card-outline card-primary">
                    <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                        <h3 className="card-title mb-0 me-auto">Lista de cámaras</h3>
                        <button
                            className="btn btn-success"
                            onClick={() => {
                                setCamaraSeleccionada(null);
                                setMostrarModal(true);
                            }}
                        >
                            <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
                            Nueva cámara
                        </button>
                    </div>

                    <div className="card-body p-0">
                        {error ? (
                            <div className="alert alert-danger m-3" role="alert">
                                <div className="text-center">{error}</div>
                            </div>
                        ) : loading ? (
                            <SkeletonTable columnas={6} filas={5} />
                        ) : (
                            <CamarasTable
                                camaras={camaras}
                                empresas={empresas}
                                onEditar={(camara) => {
                                    setCamaraSeleccionada(camara);
                                    setMostrarModal(true);
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>

            <Modal
                title={camaraSeleccionada ? "Editar cámara" : "Registrar cámara"}
                show={mostrarModal}
                onClose={() => {
                    setMostrarModal(false);
                    setCamaraSeleccionada(null);
                }}
            >
                <CamaraForm
                    camara={camaraSeleccionada}
                    empresas={empresas}
                    onGuardar={guardarCamara}
                    onCancelar={() => {
                        setMostrarModal(false);
                        setCamaraSeleccionada(null);
                    }}
                />
            </Modal>
        </>
    );
}

export default CamarasView;
