import PageHeader from "../../../../layouts/components/PageHeader";
import { useEffect, useState } from "react";
import { actualizarSalida, crearSalida, eliminarSalida, obtenerSalidas } from "../../services/salida.service";
import { obtenerClientes } from "../../services/cliente.service";
import { obtenerCamaras } from "../../services/camara.service";
import { obtenerExistencias } from "../../services/existencia.service";
import type { SalidaApi, CrearSalidaRequest } from "../../interfaces/salidas/Salida";
import type { Cliente } from "../../interfaces/clientes/Cliente";
import type { Camara } from "../../interfaces/camaras/Camara";
import type { ExistenciaApi } from "../../interfaces/existencias/Existencia";
import SalidaForm from "../../components/salidas/SalidaForm";
import SalidasTable from "../../components/salidas/SalidasTable";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import ConfirmModal from "../../../../shared/components/ConfirmModal";
import BuscadorTabla from "../../../../shared/components/BuscadorTabla";
import Paginacion from "../../../../shared/components/Paginacion";
import PorPaginaSelect from "../../../../shared/components/PorPaginaSelect";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { useToastContext } from "../../../../shared/context/ToastProvider";

function SalidasView() {
    const [salidas, setSalidas] = useState<SalidaApi[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [camaras, setCamaras] = useState<Camara[]>([]);
    const [existencias, setExistencias] = useState<ExistenciaApi[]>([]);
    const [total, setTotal] = useState(0);
    const [busqueda, setBusqueda] = useState("");
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = useState(25);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [salidaEditando, setSalidaEditando] = useState<SalidaApi | null>(null);
    const [salidaEliminar, setSalidaEliminar] = useState<SalidaApi | null>(null);
    const [eliminando, setEliminando] = useState(false);

    const { mostrarToast } = useToastContext();

    // El listado depende de página y búsqueda; los catálogos y las existencias
    // no, así que se cargan por separado para no repetirlos en cada página.
    useEffect(() => {
        const id = setTimeout(() => { cargarListado(); }, busqueda ? 300 : 0);
        return () => clearTimeout(id);
    }, [pagina, porPagina, busqueda]);

    useEffect(() => {
        cargarApoyo();
    }, [salidaEditando]);

    async function cargarListado() {
        try {
            const datos = await obtenerSalidas({ pagina, porPagina, busqueda });
            setSalidas(datos.results);
            setTotal(datos.count);
            setError(null);
        } catch (error) {
            const mensaje = obtenerMensajeError(error);
            setError(mensaje);
            mostrarToast("Error al cargar", mensaje, "danger");
        } finally {
            setLoading(false);
        }
    }

    async function cargarApoyo() {
        try {
            const [datosClientes, datosCamaras, datosExistencias] = await Promise.all([
                obtenerClientes(),
                obtenerCamaras(),
                // Solo los lotes con existencia (más los de la salida en edición):
                // antes esta pantalla bajaba todas las entradas para armar el modal.
                obtenerExistencias(salidaEditando?.id),
            ]);
            setClientes(datosClientes);
            setCamaras(datosCamaras);
            setExistencias(datosExistencias);
        } catch (error) {
            mostrarToast("Error al cargar", obtenerMensajeError(error), "danger");
        }
    }

    async function cargar() {
        await Promise.all([cargarListado(), cargarApoyo()]);
    }

    function buscar(texto: string) {
        setBusqueda(texto);
        setPagina(1);
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
                            existencias={existencias}
                            salida={salidaEditando}
                            onGuardar={guardarSalida}
                            onCancelar={() => setSalidaEditando(null)}
                        />

                        <div className="card card-outline card-primary">
                            <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                                <h3 className="card-title mb-0 me-auto">Salidas registradas</h3>
                                <BuscadorTabla
                                    valor={busqueda}
                                    onChange={buscar}
                                    placeholder="Buscar por folio, cliente, nota o producto..."
                                />
                                <PorPaginaSelect valor={porPagina} onChange={(v) => { setPorPagina(v); setPagina(1); }} />
                            </div>
                            <div className="card-body p-0">
                                <SalidasTable
                                    salidas={salidas}
                                    camaras={camaras}
                                    onEditar={setSalidaEditando}
                                    onEliminar={setSalidaEliminar}
                                />
                            </div>

                            {total > 0 && (
                                <div className="card-footer d-flex justify-content-between align-items-center flex-wrap gap-2">
                                    <small className="text-muted">
                                        Mostrando {(pagina - 1) * porPagina + 1}-{Math.min(pagina * porPagina, total)} de {total}
                                    </small>
                                    <Paginacion
                                        pagina={pagina}
                                        totalPaginas={Math.max(1, Math.ceil(total / porPagina))}
                                        onCambiar={setPagina}
                                    />
                                </div>
                            )}
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
