import PageHeader from "../../../../layouts/components/PageHeader";
import { useEffect, useState } from "react";
import { crearSalida, obtenerSalidas } from "../../services/salida.service";
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
            await crearSalida(salida);
            mostrarToast("Salida creada", "La salida fue registrada correctamente.", "success");
            await cargar();
        } catch (error) {
            mostrarToast("Error del servidor", obtenerMensajeError(error), "danger");
            throw error;
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
                            onGuardar={guardarSalida}
                        />

                        <div className="card card-outline card-primary">
                            <div className="card-header">
                                <h3 className="card-title mb-0">Salidas registradas</h3>
                            </div>
                            <div className="card-body p-0">
                                <SalidasTable salidas={salidas} />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

export default SalidasView;
