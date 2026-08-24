import PageHeader from "../../../../layouts/components/PageHeader";
import { useEffect, useState } from "react";
import { actualizarCliente, obtenerClientes, crearCliente } from "../../services/cliente.service";
import type { Cliente } from "../../interfaces/clientes/Cliente";
import ClientesTable from "../../components/clientes/ClientesTable";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import ClienteForm from "../../components/clientes/ClienteForm";
import Modal from "../../../../shared/components/Modal";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { useToastContext } from "../../../../shared/context/ToastProvider";

function ClientesView() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);

    const { mostrarToast } = useToastContext();

    useEffect(() => {
        cargar();
    }, []);

    async function cargar() {
        try {
            const datos = await obtenerClientes();
            setClientes(datos);
            setError(null);
        } catch (error) {
            const mensaje = obtenerMensajeError(error);
            setError(mensaje);
            mostrarToast("Error al cargar", mensaje, "danger");
        } finally {
            setLoading(false);
        }
    }

    async function guardarCliente(cliente: Cliente) {
        try {
            if (cliente.id === 0) {
                await crearCliente(cliente);
                mostrarToast("Cliente creado", "El cliente fue registrado correctamente.", "success");
            } else {
                await actualizarCliente(cliente);
                mostrarToast("Cliente actualizado", "Los cambios fueron guardados correctamente.", "success");
            }
            await cargar();
            setMostrarModal(false);
            setClienteSeleccionado(null);
        } catch (error) {
            mostrarToast("Error del servidor", obtenerMensajeError(error), "danger");
            setClienteSeleccionado(cliente);
            throw error;
        }
    }

    return (
        <>
            <PageHeader
                title="Clientes"
                subtitle="Clientes que compran mercancía"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Inventario", to: "/inventario" },
                    { label: "Clientes" }
                ]}
            />

            <div className="container-fluid">
                <div className="card card-outline card-primary">
                    <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                        <h3 className="card-title mb-0 me-auto">Lista de clientes</h3>
                        <button
                            className="btn btn-success"
                            onClick={() => {
                                setClienteSeleccionado(null);
                                setMostrarModal(true);
                            }}
                        >
                            <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
                            Nuevo cliente
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
                            <ClientesTable
                                clientes={clientes}
                                onEditar={(cliente) => {
                                    setClienteSeleccionado(cliente);
                                    setMostrarModal(true);
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>

            <Modal
                title={clienteSeleccionado ? "Editar cliente" : "Registrar cliente"}
                show={mostrarModal}
                onClose={() => {
                    setMostrarModal(false);
                    setClienteSeleccionado(null);
                }}
            >
                <ClienteForm
                    cliente={clienteSeleccionado}
                    onGuardar={guardarCliente}
                    onCancelar={() => {
                        setMostrarModal(false);
                        setClienteSeleccionado(null);
                    }}
                />
            </Modal>
        </>
    );
}

export default ClientesView;
