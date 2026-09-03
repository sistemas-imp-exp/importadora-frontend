import PageHeader from "../../../../layouts/components/PageHeader";
import { useEffect, useState } from "react";
import { crearMovimiento, obtenerMovimientos } from "../../services/movimientoCamara.service";
import { obtenerCamaras } from "../../services/camara.service";
import { obtenerExistencias } from "../../services/existencia.service";
import type { MovimientoCamaraApi, CrearMovimientoCamaraRequest } from "../../interfaces/movimientos/MovimientoCamara";
import type { Camara } from "../../interfaces/camaras/Camara";
import type { ExistenciaApi } from "../../interfaces/existencias/Existencia";
import MovimientoCamaraForm from "../../components/movimientos/MovimientoCamaraForm";
import MovimientosCamaraTable from "../../components/movimientos/MovimientosCamaraTable";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { useToastContext } from "../../../../shared/context/ToastProvider";

function MovimientosCamaraView() {
    const [movimientos, setMovimientos] = useState<MovimientoCamaraApi[]>([]);
    const [camaras, setCamaras] = useState<Camara[]>([]);
    const [existencias, setExistencias] = useState<ExistenciaApi[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { mostrarToast } = useToastContext();

    useEffect(() => {
        cargar();
    }, []);

    async function cargar() {
        try {
            const [datosMovimientos, datosCamaras, datosExistencias] = await Promise.all([
                obtenerMovimientos(),
                obtenerCamaras(),
                obtenerExistencias(),
            ]);
            setMovimientos(datosMovimientos);
            setCamaras(datosCamaras);
            setExistencias(datosExistencias);
            setError(null);
        } catch (error) {
            const mensaje = obtenerMensajeError(error);
            setError(mensaje);
            mostrarToast("Error al cargar", mensaje, "danger");
        } finally {
            setLoading(false);
        }
    }

    async function guardarMovimiento(movimiento: CrearMovimientoCamaraRequest) {
        try {
            await crearMovimiento(movimiento);
            mostrarToast("Movimiento registrado", "El movimiento entre cámaras fue registrado correctamente.", "success");
            await cargar();
        } catch (error) {
            mostrarToast("Error del servidor", obtenerMensajeError(error), "danger");
            throw error;
        }
    }

    return (
        <>
            <PageHeader
                title="Movimientos entre cámaras"
                subtitle="Traslados internos de mercancía, sin compra ni venta"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Inventario", to: "/inventario" },
                    { label: "Movimientos entre cámaras" }
                ]}
            />

            <div className="container-fluid">
                {loading ? (
                    <SkeletonTable columnas={4} filas={3} />
                ) : error ? (
                    <div className="alert alert-danger" role="alert">{error}</div>
                ) : (
                    <>
                        <MovimientoCamaraForm camaras={camaras} existencias={existencias} onGuardar={guardarMovimiento} />

                        <div className="card card-outline card-primary">
                            <div className="card-header">
                                <h3 className="card-title mb-0">Movimientos registrados</h3>
                            </div>
                            <div className="card-body p-0">
                                <MovimientosCamaraTable movimientos={movimientos} camaras={camaras} />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

export default MovimientosCamaraView;
