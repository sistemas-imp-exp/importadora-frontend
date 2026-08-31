import PageHeader from "../../../../layouts/components/PageHeader";
import { useEffect, useState } from "react";
import { actualizarEntrada, crearEntrada, eliminarEntrada, obtenerEntradas } from "../../services/entrada.service";
import { obtenerProveedores } from "../../services/proveedor.service";
import { obtenerCamaras } from "../../services/camara.service";
import { obtenerProductos } from "../../services/producto.service";
import type { EntradaApi, CrearEntradaRequest } from "../../interfaces/entradas/Entrada";
import type { Proveedor } from "../../interfaces/proveedores/Proveedor";
import type { Camara } from "../../interfaces/camaras/Camara";
import type { Producto } from "../../interfaces/productos/Producto";
import EntradaForm from "../../components/entradas/EntradaForm";
import EntradasTable from "../../components/entradas/EntradasTable";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import ConfirmModal from "../../../../shared/components/ConfirmModal";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { useToastContext } from "../../../../shared/context/ToastProvider";

function EntradasView() {
    const [entradas, setEntradas] = useState<EntradaApi[]>([]);
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [camaras, setCamaras] = useState<Camara[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [entradaEditando, setEntradaEditando] = useState<EntradaApi | null>(null);
    const [entradaEliminar, setEntradaEliminar] = useState<EntradaApi | null>(null);
    const [eliminando, setEliminando] = useState(false);

    const { mostrarToast } = useToastContext();

    useEffect(() => {
        cargar();
    }, []);

    async function cargar() {
        try {
            const [datosEntradas, datosProveedores, datosCamaras, datosProductos] = await Promise.all([
                obtenerEntradas(),
                obtenerProveedores(),
                obtenerCamaras(),
                obtenerProductos(),
            ]);
            setEntradas(datosEntradas);
            setProveedores(datosProveedores);
            setCamaras(datosCamaras);
            setProductos(datosProductos);
            setError(null);
        } catch (error) {
            const mensaje = obtenerMensajeError(error);
            setError(mensaje);
            mostrarToast("Error al cargar", mensaje, "danger");
        } finally {
            setLoading(false);
        }
    }

    async function guardarEntrada(entrada: CrearEntradaRequest) {
        try {
            if (entradaEditando) {
                await actualizarEntrada(entradaEditando.id, entrada);
                mostrarToast("Entrada actualizada", "Los cambios fueron guardados correctamente.", "success");
                setEntradaEditando(null);
            } else {
                await crearEntrada(entrada);
                mostrarToast("Entrada creada", "La entrada fue registrada correctamente.", "success");
            }
            await cargar();
        } catch (error) {
            mostrarToast("Error del servidor", obtenerMensajeError(error), "danger");
            throw error;
        }
    }

    async function confirmarEliminar() {
        if (!entradaEliminar) return;
        try {
            setEliminando(true);
            await eliminarEntrada(entradaEliminar.id);
            mostrarToast("Entrada eliminada", "La entrada fue eliminada correctamente.", "success");
            setEntradaEliminar(null);
            await cargar();
        } catch (error) {
            mostrarToast("Error del servidor", obtenerMensajeError(error), "danger");
        } finally {
            setEliminando(false);
        }
    }

    return (
        <>
            <PageHeader
                title="Entradas"
                subtitle="Recepción de mercancía"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Inventario", to: "/inventario" },
                    { label: "Entradas" }
                ]}
            />

            <div className="container-fluid">
                {loading ? (
                    <SkeletonTable columnas={4} filas={3} />
                ) : error ? (
                    <div className="alert alert-danger" role="alert">{error}</div>
                ) : (
                    <>
                        <EntradaForm
                            proveedores={proveedores}
                            camaras={camaras}
                            productos={productos}
                            entrada={entradaEditando}
                            onGuardar={guardarEntrada}
                            onCancelar={() => setEntradaEditando(null)}
                        />

                        <div className="card card-outline card-primary">
                            <div className="card-header">
                                <h3 className="card-title mb-0">Entradas registradas</h3>
                            </div>
                            <div className="card-body p-0">
                                <EntradasTable
                                    entradas={entradas}
                                    camaras={camaras}
                                    onEditar={setEntradaEditando}
                                    onEliminar={setEntradaEliminar}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>

            <ConfirmModal
                show={entradaEliminar !== null}
                isLoading={eliminando}
                onCancel={() => setEntradaEliminar(null)}
                onConfirm={confirmarEliminar}
            >
                <div className="text-center">
                    <i className="bi bi-exclamation-triangle-fill text-warning fs-1"></i>
                    <h3 className="text-slate-900 text-base font-semibold dark:text-slate-50">
                        ¿Eliminar la entrada de {entradaEliminar?.proveedor?.nombre} del {entradaEliminar?.fecha}?
                    </h3>
                    <p className="text-slate-600 text-sm mt-2 leading-relaxed dark:text-slate-400">
                        Se eliminan también todas sus líneas. Si alguna ya fue vendida o movida a otra cámara, no se podrá eliminar.
                    </p>
                </div>
            </ConfirmModal>
        </>
    );
}

export default EntradasView;
