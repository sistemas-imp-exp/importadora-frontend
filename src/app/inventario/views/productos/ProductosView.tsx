import PageHeader from "../../../../layouts/components/PageHeader";
import { useEffect, useState } from "react";
import { actualizarProducto, obtenerProductos, crearProducto } from "../../services/producto.service";
import type { Producto } from "../../interfaces/productos/Producto";
import ProductosTable from "../../components/productos/ProductosTable";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import ProductoForm from "../../components/productos/ProductoForm";
import Modal from "../../../../shared/components/Modal";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { useToastContext } from "../../../../shared/context/ToastProvider";

function ProductosView() {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);

    const { mostrarToast } = useToastContext();

    useEffect(() => {
        cargar();
    }, []);

    async function cargar() {
        try {
            const datos = await obtenerProductos();
            setProductos(datos);
            setError(null);
        } catch (error) {
            const mensaje = obtenerMensajeError(error);
            setError(mensaje);
            mostrarToast("Error al cargar", mensaje, "danger");
        } finally {
            setLoading(false);
        }
    }

    async function guardarProducto(producto: Producto) {
        try {
            if (producto.id === 0) {
                await crearProducto(producto);
                mostrarToast("Producto creado", "El producto fue registrado correctamente.", "success");
            } else {
                await actualizarProducto(producto);
                mostrarToast("Producto actualizado", "Los cambios fueron guardados correctamente.", "success");
            }
            await cargar();
            setMostrarModal(false);
            setProductoSeleccionado(null);
        } catch (error) {
            mostrarToast("Error del servidor", obtenerMensajeError(error), "danger");
            setProductoSeleccionado(producto);
            throw error;
        }
    }

    return (
        <>
            <PageHeader
                title="Productos"
                subtitle="Catálogo de talla/tipo de producto"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Inventario", to: "/inventario" },
                    { label: "Productos" }
                ]}
            />

            <div className="container-fluid">
                <div className="card card-outline card-primary">
                    <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                        <h3 className="card-title mb-0 me-auto">Lista de productos</h3>
                        <button
                            className="btn btn-success"
                            onClick={() => {
                                setProductoSeleccionado(null);
                                setMostrarModal(true);
                            }}
                        >
                            <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
                            Nuevo producto
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
                            <ProductosTable
                                productos={productos}
                                onEditar={(producto) => {
                                    setProductoSeleccionado(producto);
                                    setMostrarModal(true);
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>

            <Modal
                title={productoSeleccionado ? "Editar producto" : "Registrar producto"}
                show={mostrarModal}
                onClose={() => {
                    setMostrarModal(false);
                    setProductoSeleccionado(null);
                }}
            >
                <ProductoForm
                    producto={productoSeleccionado}
                    onGuardar={guardarProducto}
                    onCancelar={() => {
                        setMostrarModal(false);
                        setProductoSeleccionado(null);
                    }}
                />
            </Modal>
        </>
    );
}

export default ProductosView;
