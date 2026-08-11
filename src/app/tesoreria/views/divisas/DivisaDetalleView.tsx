import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PageHeader from "../../../../layouts/components/PageHeader";
import SkeletonCallout from "../../../../shared/components/SkeletonCallout";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import ConfirmModal from "../../../../shared/components/ConfirmModal";
import { useToastContext } from "../../../../shared/context/ToastProvider";
import { useAuth } from "../../../../shared/hooks/useAuth";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import type { Divisa } from "../../interfaces/divisas/Divisa";
import type { Denominacion } from "../../interfaces/denominaciones/Denominacion";
import { obtenerDivisa } from "../../services/divisa.service";
import {
    actualizarDenominacion,
    eliminarDenominacion,
    obtenerDenominacionesPorDivisa,
} from "../../services/denominacion.service";
import DenominacionesTable from "../../components/denominaciones/DenominacionesTable";
import NuevasDenominacionesForm from "../../components/denominaciones/NuevasDenominacionesForm";

function DivisaDetalleView() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const esSuperusuario = !!user?.is_superuser;
    const { mostrarToast } = useToastContext();

    const [divisa, setDivisa] = useState<Divisa | null>(null);
    const [denominaciones, setDenominaciones] = useState<Denominacion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [denominacionEliminar, setDenominacionEliminar] = useState<Denominacion | null>(null);
    const [eliminando, setEliminando] = useState(false);

    async function cargar(idObjetivo: string, estaVigente: () => boolean) {
        setLoading(true);
        try {
            const divisaId = Number(idObjetivo);
            const [divisaDatos, denominacionesDatos] = await Promise.all([
                obtenerDivisa(divisaId),
                obtenerDenominacionesPorDivisa(divisaId),
            ]);
            if (!estaVigente()) return;
            setDivisa(divisaDatos);
            setDenominaciones(denominacionesDatos);
            setError(null);
        } catch (err) {
            if (!estaVigente()) return;
            const mensaje = obtenerMensajeError(err);
            setError(mensaje);
            mostrarToast("Error al cargar", mensaje, "danger");
        } finally {
            if (estaVigente()) setLoading(false);
        }
    }

    useEffect(() => {
        if (!id) return;
        let vigente = true;
        const temporizador = setTimeout(() => cargar(id, () => vigente), 0);
        return () => {
            vigente = false;
            clearTimeout(temporizador);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    async function recargarDenominaciones() {
        if (!divisa) return;
        try {
            const datos = await obtenerDenominacionesPorDivisa(divisa.id);
            setDenominaciones(datos);
        } catch (err) {
            mostrarToast("Error al recargar", obtenerMensajeError(err), "danger");
        }
    }

    async function manejarNuevasGuardadas() {
        await recargarDenominaciones();
        mostrarToast("Denominaciones guardadas", "Se agregaron correctamente.", "success");
    }

    async function manejarToggleActiva(denominacion: Denominacion) {
        try {
            await actualizarDenominacion({ ...denominacion, activa: !denominacion.activa });
            await recargarDenominaciones();
        } catch (err) {
            mostrarToast("Error del servidor", obtenerMensajeError(err), "danger");
        }
    }

    async function confirmarEliminar() {
        if (!denominacionEliminar) return;
        setEliminando(true);
        try {
            await eliminarDenominacion(denominacionEliminar.id);
            await recargarDenominaciones();
            setDenominacionEliminar(null);
            mostrarToast("Denominación eliminada", "Se eliminó correctamente.", "success");
        } catch (err) {
            mostrarToast("Error del servidor", obtenerMensajeError(err), "danger");
        } finally {
            setEliminando(false);
        }
    }

    return (
        <>
            <PageHeader
                title={divisa ? `${divisa.codigo} — ${divisa.nombre}` : "Divisa"}
                subtitle="Billetes y monedas registrados para esta divisa"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Tesorería", to: "/tesoreria" },
                    { label: "Divisas", to: "/tesoreria/divisas" },
                    { label: divisa?.codigo ?? "Detalle" },
                ]}
            />

            <div className="container-fluid">
                <Link to="/tesoreria/divisas" className="btn btn-sm btn-outline-secondary mb-3">
                    <i className="bi bi-arrow-left me-1"></i>Volver a divisas
                </Link>

                {error && (
                    <div className="callout callout-warning mb-3">
                        <p><b>Error al cargar:</b></p>
                        <p>{error}</p>
                    </div>
                )}

                {loading && (
                    <>
                        <SkeletonCallout />
                        <SkeletonTable columnas={4} filas={4} />
                    </>
                )}

                {!loading && !error && divisa && (
                    <div className="card card-outline card-primary">
                        <div className="card-header">
                            <h3 className="card-title">Denominaciones</h3>
                        </div>
                        <div className="card-body">
                            <DenominacionesTable
                                denominaciones={denominaciones}
                                simbolo={divisa.simbolo}
                                onToggleActiva={manejarToggleActiva}
                                onEliminar={(denominacion) => setDenominacionEliminar(denominacion)}
                            />

                            {esSuperusuario && (
                                <NuevasDenominacionesForm divisaId={divisa.id} onGuardado={manejarNuevasGuardadas} />
                            )}
                        </div>
                    </div>
                )}
            </div>

            <ConfirmModal
                show={!!denominacionEliminar}
                isLoading={eliminando}
                onCancel={() => setDenominacionEliminar(null)}
                onConfirm={confirmarEliminar}
            >
                <div className="text-center">
                    <i className="bi bi-exclamation-triangle-fill text-warning fs-1"></i>
                    <h3 className="text-slate-900 text-base font-semibold dark:text-slate-50">
                        ¿Eliminar esta denominación?
                    </h3>
                    <p className="text-slate-600 text-sm mt-2 leading-relaxed dark:text-slate-400">
                        Esta acción no se puede deshacer.
                    </p>
                </div>
            </ConfirmModal>
        </>
    );
}

export default DivisaDetalleView;
