import PageHeader from "../../../../layouts/components/PageHeader";
import { useEffect, useState } from "react";
import { actualizarSalida, crearSalida, eliminarSalida, obtenerSalidas } from "../../services/salida.service";
import { obtenerClientes } from "../../services/cliente.service";
import { obtenerCamaras } from "../../services/camara.service";
import { obtenerProductos } from "../../services/producto.service";
import { obtenerEntradas } from "../../services/entrada.service";
import type { SalidaApi, CrearSalidaRequest } from "../../interfaces/salidas/Salida";
import type { Cliente } from "../../interfaces/clientes/Cliente";
import type { Camara } from "../../interfaces/camaras/Camara";
import type { Producto } from "../../interfaces/productos/Producto";
import type { EntradaApi } from "../../interfaces/entradas/Entrada";
import SalidaForm from "../../components/salidas/SalidaForm";
import SalidasTable from "../../components/salidas/SalidasTable";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import ConfirmModal from "../../../../shared/components/ConfirmModal";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { useToastContext } from "../../../../shared/context/ToastProvider";

function SalidasView() {
    const [salidas, setSalidas] = useState<SalidaApi[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [camaras, setCamaras] = useState<Camara[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [entradas, setEntradas] = useState<EntradaApi[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [salidaEditando, setSalidaEditando] = useState<SalidaApi | null>(null);
    const [salidaEliminar, setSalidaEliminar] = useState<SalidaApi | null>(null);
    const [eliminando, setEliminando] = useState(false);

    const { mostrarToast } = useToastContext();

    useEffect(() => {
        cargar();
    }, []);

    async function cargar() {
        try {
            const [datosSalidas, datosClientes, datosCamaras, datosProductos, datosEntradas] = await Promise.all([
                obtenerSalidas(),
                obtenerClientes(),
                obtenerCamaras(),
                obtenerProductos(),
                obtenerEntradas(),
            ]);
            setSalidas(datosSalidas);
            setClientes(datosClientes);
            setCamaras(datosCamaras);
            setProductos(datosProductos);
            setEntradas(datosEntradas);
            setError(null);
        } catch (error) {
            const mensaje = obtenerMensajeError(error);
            setError(mensaje);
            mostrarToast("Error al cargar", mensaje, "danger");
        } finally {
            setLoading(false);
        }
    }

    async function guardarSalida(salida: CrearSalidaRequest) {
        try {
            if (salidaEditando) {
                await actualizarSalida(salidaEditando.id, salida);
                mostrarToast("Salida actualizada", "Los cambios fueron guardados correctamente.", "success");
                setSalidaEditando(null);
            } else {
                await crearSalida(salida);
                mostrarToast("Salida creada", "La salida fue registrada correctamente.", "success");
            }
            await cargar();
        } catch (error) {
            mostrarToast("Error del servidor", obtenerMensajeError(error), "danger");
            throw error;
        }
    }

    async function confirmarEliminar() {
        if (!salidaEliminar) return;
        try {
            setEliminando(true);
            await eliminarSalida(salidaEliminar.id);
            mostrarToast("Salida eliminada", "La salida fue eliminada correctamente.", "success");
            setSalidaEliminar(null);
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
                title="Salidas"
                subtitle="Despacho de mercancía"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Inventario", to: "/inventario" },
                    { label: "Salidas" }
                ]}
            />

            <div className="container-fluid">
                {loading ? (
                    <SkeletonTable columnas={4} filas={3} />
                ) : error ? (
                    <div className="alert alert-danger" role="alert">{error}</div>
                ) : (
                    <>
                        <SalidaForm
                            clientes={clientes}
                            camaras={camaras}
                            productos={productos}
                            entradas={entradas}
                            salida={salidaEditando}
                            onGuardar={guardarSalida}
                            onCancelar={() => setSalidaEditando(null)}
                        />

                        <div className="card card-outline card-primary">
                            <div className="card-header">
                                <h3 className="card-title mb-0">Salidas registradas</h3>
                            </div>
                            <div className="card-body p-0">
                                <SalidasTable
                                    salidas={salidas}
                                    camaras={camaras}
                                    entradas={entradas}
                                    onEditar={setSalidaEditando}
                                    onEliminar={setSalidaEliminar}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>

            <ConfirmModal
                show={salidaEliminar !== null}
                isLoading={eliminando}
                onCancel={() => setSalidaEliminar(null)}
                onConfirm={confirmarEliminar}
            >
                <div className="text-center">
                    <i className="bi bi-exclamation-triangle-fill text-warning fs-1"></i>
                    <h3 className="text-slate-900 text-base font-semibold dark:text-slate-50">
                        ¿Eliminar la salida {salidaEliminar?.folio_de_salida}?
                    </h3>
                    <p className="text-slate-600 text-sm mt-2 leading-relaxed dark:text-slate-400">
                        Se eliminan también todas sus líneas, y las cajas que descontaban vuelven a estar disponibles en sus lotes de origen.
                    </p>
                </div>
            </ConfirmModal>
        </>
    );
}

export default SalidasView;
