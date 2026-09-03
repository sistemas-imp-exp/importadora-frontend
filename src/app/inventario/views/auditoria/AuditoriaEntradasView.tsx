import { useEffect, useState } from "react";
import PageHeader from "../../../../layouts/components/PageHeader";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import CardCollapseButton from "../../../../shared/components/CardCollapseButton";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { useToastContext } from "../../../../shared/context/ToastProvider";
import { obtenerResumenEntradas, type EntradaResumen } from "../../services/entrada.service";
import { editarEntradaAuditada, obtenerEdicionesEntrada } from "../../services/auditoriaEntrada.service";
import type { EdicionEntrada, EditarEntradaAuditadaRequest } from "../../interfaces/auditoria/EdicionEntrada";
import AuditoriaEntradaForm from "../../components/auditoria/AuditoriaEntradaForm";
import EdicionesEntradaTable from "../../components/auditoria/EdicionesEntradaTable";

function AuditoriaEntradasView() {
    const [entradas, setEntradas] = useState<EntradaResumen[]>([]);
    const [registros, setRegistros] = useState<EdicionEntrada[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [colapsado, setColapsado] = useState(false);

    const { mostrarToast } = useToastContext();

    useEffect(() => {
        cargar();
    }, []);

    async function cargar() {
        try {
            // Lista ligera: el formulario pide el detalle de la entrada elegida
            // cuando hace falta, en vez de bajar los lotes de todas.
            const [datosEntradas, bitacora] = await Promise.all([obtenerResumenEntradas(), obtenerEdicionesEntrada()]);
            setEntradas(datosEntradas);
            setRegistros(bitacora.registros);
            setError(null);
        } catch (error) {
            const mensaje = obtenerMensajeError(error);
            setError(mensaje);
            mostrarToast("Error al cargar", mensaje, "danger");
        } finally {
            setLoading(false);
        }
    }

    async function guardarCorreccion(entradaId: number, payload: EditarEntradaAuditadaRequest) {
        try {
            const respuesta = await editarEntradaAuditada(entradaId, payload);
            mostrarToast(
                "Corrección registrada",
                `Se guardaron ${respuesta.cambios.length} cambio(s) en la bitácora.`,
                "success"
            );
            await cargar();
        } catch (error) {
            mostrarToast("No se pudo guardar", obtenerMensajeError(error), "danger");
            throw error;
        }
    }

    return (
        <>
            <PageHeader
                title="Auditoría de entradas"
                subtitle="Bitácora de correcciones y edición restringida de entradas con salidas"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Administrador" },
                    { label: "Auditoría de entradas" }
                ]}
            />

            <div className="container-fluid">
                {loading ? (
                    <SkeletonTable columnas={8} filas={5} />
                ) : error ? (
                    <div className="alert alert-danger" role="alert">{error}</div>
                ) : (
                    <>
                        <div className="card card-outline card-warning mb-3">
                            <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                                <h3 className="card-title mb-0 me-auto">Corregir una entrada</h3>
                                <CardCollapseButton collapsed={colapsado} onToggle={() => setColapsado((c) => !c)} />
                            </div>
                            {!colapsado && (
                                <AuditoriaEntradaForm entradas={entradas} onGuardar={guardarCorreccion} />
                            )}
                        </div>

                        <div className="card card-outline card-primary">
                            <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                                <h3 className="card-title mb-0 me-auto">
                                    Registro de movimientos
                                    <span className="badge text-bg-secondary ms-2">{registros.length}</span>
                                </h3>
                                <button
                                    className="btn btn-outline-secondary btn-sm"
                                    type="button"
                                    onClick={cargar}
                                    title="Actualizar"
                                >
                                    <i className="bi bi-arrow-clockwise" aria-hidden="true"></i>
                                </button>
                            </div>
                            <div className="card-body p-0">
                                <EdicionesEntradaTable registros={registros} />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

export default AuditoriaEntradasView;
