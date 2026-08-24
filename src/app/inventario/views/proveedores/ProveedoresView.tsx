import PageHeader from "../../../../layouts/components/PageHeader";
import { useEffect, useState } from "react";
import { actualizarProveedor, obtenerProveedores, crearProveedor } from "../../services/proveedor.service";
import type { Proveedor } from "../../interfaces/proveedores/Proveedor";
import ProveedoresTable from "../../components/proveedores/ProveedoresTable";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import ProveedorForm from "../../components/proveedores/ProveedorForm";
import Modal from "../../../../shared/components/Modal";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { useToastContext } from "../../../../shared/context/ToastProvider";

function ProveedoresView() {
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [proveedorSeleccionado, setProveedorSeleccionado] = useState<Proveedor | null>(null);

    const { mostrarToast } = useToastContext();

    useEffect(() => {
        cargar();
    }, []);

    async function cargar() {
        try {
            const datos = await obtenerProveedores();
            setProveedores(datos);
            setError(null);
        } catch (error) {
            const mensaje = obtenerMensajeError(error);
            setError(mensaje);
            mostrarToast("Error al cargar", mensaje, "danger");
        } finally {
            setLoading(false);
        }
    }

    async function guardarProveedor(proveedor: Proveedor) {
        try {
            if (proveedor.id === 0) {
                await crearProveedor(proveedor);
                mostrarToast("Proveedor creado", "El proveedor fue registrado correctamente.", "success");
            } else {
                await actualizarProveedor(proveedor);
                mostrarToast("Proveedor actualizado", "Los cambios fueron guardados correctamente.", "success");
            }
            await cargar();
            setMostrarModal(false);
            setProveedorSeleccionado(null);
        } catch (error) {
            mostrarToast("Error del servidor", obtenerMensajeError(error), "danger");
            setProveedorSeleccionado(proveedor);
            throw error;
        }
    }

    return (
        <>
            <PageHeader
                title="Proveedores"
                subtitle="Proveedores de mercancía"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Inventario", to: "/inventario" },
                    { label: "Proveedores" }
                ]}
            />

            <div className="container-fluid">
                <div className="card card-outline card-primary">
                    <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                        <h3 className="card-title mb-0 me-auto">Lista de proveedores</h3>
                        <button
                            className="btn btn-success"
                            onClick={() => {
                                setProveedorSeleccionado(null);
                                setMostrarModal(true);
                            }}
                        >
                            <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
                            Nuevo proveedor
                        </button>
                    </div>

                    <div className="card-body p-0">
                        {error ? (
                            <div className="alert alert-danger m-3" role="alert">
                                <div className="text-center">{error}</div>
                            </div>
                        ) : loading ? (
                            <SkeletonTable columnas={3} filas={5} />
                        ) : (
                            <ProveedoresTable
                                proveedores={proveedores}
                                onEditar={(proveedor) => {
                                    setProveedorSeleccionado(proveedor);
                                    setMostrarModal(true);
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>

            <Modal
                title={proveedorSeleccionado ? "Editar proveedor" : "Registrar proveedor"}
                show={mostrarModal}
                onClose={() => {
                    setMostrarModal(false);
                    setProveedorSeleccionado(null);
                }}
            >
                <ProveedorForm
                    proveedor={proveedorSeleccionado}
                    onGuardar={guardarProveedor}
                    onCancelar={() => {
                        setMostrarModal(false);
                        setProveedorSeleccionado(null);
                    }}
                />
            </Modal>
        </>
    );
}

export default ProveedoresView;
