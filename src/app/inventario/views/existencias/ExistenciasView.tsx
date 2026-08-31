import PageHeader from "../../../../layouts/components/PageHeader";
import { useEffect, useState } from "react";
import { obtenerEntradas } from "../../services/entrada.service";
import { obtenerCamaras } from "../../services/camara.service";
import type { EntradaApi } from "../../interfaces/entradas/Entrada";
import type { Camara } from "../../interfaces/camaras/Camara";
import ExistenciasTable from "../../components/existencias/ExistenciasTable";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import CardCollapseButton from "../../../../shared/components/CardCollapseButton";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { useToastContext } from "../../../../shared/context/ToastProvider";

function ExistenciasView() {
    const [entradas, setEntradas] = useState<EntradaApi[]>([]);
    const [camaras, setCamaras] = useState<Camara[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [colapsado, setColapsado] = useState(false);

    const { mostrarToast } = useToastContext();

    useEffect(() => {
        cargar();
    }, []);

    async function cargar() {
        try {
            const [datosEntradas, datosCamaras] = await Promise.all([obtenerEntradas(), obtenerCamaras()]);
            setEntradas(datosEntradas);
            setCamaras(datosCamaras);
            setError(null);
        } catch (error) {
            const mensaje = obtenerMensajeError(error);
            setError(mensaje);
            mostrarToast("Error al cargar", mensaje, "danger");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <PageHeader
                title="Existencias"
                subtitle="Cajas disponibles por cámara, proveedor y talla/tipo"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Inventario", to: "/inventario" },
                    { label: "Existencias" }
                ]}
            />

            <div className="container-fluid">
                <div className="card card-outline card-primary">
                    <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                        <h3 className="card-title mb-0 me-auto">Existencias</h3>
                        <button className="btn btn-outline-secondary btn-sm" type="button" onClick={cargar} title="Actualizar">
                            <i className="bi bi-arrow-clockwise" aria-hidden="true"></i>
                        </button>
                        <CardCollapseButton collapsed={colapsado} onToggle={() => setColapsado((c) => !c)} />
                    </div>

                    {!colapsado && (
                        <div className="card-body p-0">
                            {error ? (
                                <div className="alert alert-danger m-3" role="alert">{error}</div>
                            ) : loading ? (
                                <SkeletonTable columnas={9} filas={6} />
                            ) : (
                                <ExistenciasTable entradas={entradas} camaras={camaras} />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default ExistenciasView;
