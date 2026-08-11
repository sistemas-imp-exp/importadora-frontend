import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../../../../layouts/components/PageHeader";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import LoadingButton from "../../../../shared/components/LoadingButton";
import ConfirmModal from "../../../../shared/components/ConfirmModal";
import { useToastContext } from "../../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import NominaRanchoGroup, { type ValorFila } from "../../components/nomina/NominaRanchoGroup";
import type { Empleado } from "../../interfaces/nomina/Empleado";
import type { NominaSemanal } from "../../interfaces/nomina/NominaSemanal";
import { obtenerEmpleados } from "../../services/nomina/empleado.service";
import {
    actualizarNomina,
    cerrarNomina,
    obtenerNomina,
} from "../../services/nomina/nominaSemanal.service";

function formatearFecha(fechaISO: string): string {
    const [anio, mes, dia] = fechaISO.split("-");
    return `${dia}/${mes}/${anio}`;
}

function formatearMonto(valor: number): string {
    return `$${valor.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function NominaSemanalDetalleView() {
    const { id } = useParams();
    const nominaId = Number(id);
    const { mostrarToast } = useToastContext();

    const [nomina, setNomina] = useState<NominaSemanal | null>(null);
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [valores, setValores] = useState<Record<number, ValorFila>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);
    const [mostrarConfirmCierre, setMostrarConfirmCierre] = useState(false);
    const [cerrando, setCerrando] = useState(false);

    useEffect(() => {
        cargar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nominaId]);

    function inicializarValores(nominaActual: NominaSemanal, empleadosActivos: Empleado[]) {
        const porEmpleado = new Map(nominaActual.detalles.map((detalle) => [detalle.empleado.id, detalle]));
        const iniciales: Record<number, ValorFila> = {};
        for (const empleado of empleadosActivos) {
            const detalle = porEmpleado.get(empleado.id);
            iniciales[empleado.id] = {
                dias_trabajados: detalle?.dias_trabajados ?? "0",
                salario_diario: detalle?.salario_diario ?? empleado.salario_diario,
                descuento: detalle?.descuento ?? "0",
            };
        }
        setValores(iniciales);
    }

    async function cargar() {
        try {
            const [nominaActual, empleadosActivos] = await Promise.all([
                obtenerNomina(nominaId),
                obtenerEmpleados(),
            ]);
            const activos = empleadosActivos.filter((e) => e.activo);
            setNomina(nominaActual);
            setEmpleados(activos);
            inicializarValores(nominaActual, activos);
            setError(null);
        } catch (err) {
            const mensaje = obtenerMensajeError(err);
            setError(mensaje);
            mostrarToast("Error al cargar", mensaje, "danger");
        } finally {
            setLoading(false);
        }
    }

    const empleadosPorRancho = useMemo(() => {
        const grupos = new Map<number, { nombre: string; empleados: Empleado[] }>();
        for (const empleado of empleados) {
            const existente = grupos.get(empleado.rancho.id);
            if (existente) {
                existente.empleados.push(empleado);
            } else {
                grupos.set(empleado.rancho.id, { nombre: empleado.rancho.nombre, empleados: [empleado] });
            }
        }
        return Array.from(grupos.values());
    }, [empleados]);

    const totalesGenerales = useMemo(() => {
        return empleados.reduce(
            (acumulado, empleado) => {
                const valor = valores[empleado.id];
                const dias = Number(valor?.dias_trabajados ?? 0);
                const salarioDiario = Number(valor?.salario_diario ?? 0);
                const descuento = Number(valor?.descuento ?? 0);
                const bruto = dias * salarioDiario;
                return {
                    bruto: acumulado.bruto + bruto,
                    neto: acumulado.neto + (bruto - descuento),
                };
            },
            { bruto: 0, neto: 0 }
        );
    }, [empleados, valores]);

    function manejarCambio(empleadoId: number, campo: keyof ValorFila, valor: string) {
        setValores((actual) => ({
            ...actual,
            [empleadoId]: {
                ...actual[empleadoId],
                [campo]: valor,
            },
        }));
    }

    async function guardarDetalles() {
        if (!nomina) return null;
        const actualizada = await actualizarNomina(nomina.id, {
            fecha_inicio: nomina.fecha_inicio,
            fecha_fin: nomina.fecha_fin,
            observaciones: nomina.observaciones,
            detalles: empleados.map((empleado) => ({
                empleado_id: empleado.id,
                dias_trabajados: valores[empleado.id]?.dias_trabajados ?? "0",
                salario_diario: valores[empleado.id]?.salario_diario ?? empleado.salario_diario,
                descuento: valores[empleado.id]?.descuento ?? "0",
            })),
        });
        setNomina(actualizada);
        inicializarValores(actualizada, empleados);
        return actualizada;
    }

    async function guardar() {
        setGuardando(true);
        try {
            await guardarDetalles();
            mostrarToast("Nómina guardada", "Los cambios se guardaron correctamente.", "success");
        } catch (err) {
            mostrarToast("Error al guardar", obtenerMensajeError(err), "danger");
        } finally {
            setGuardando(false);
        }
    }

    async function cerrar() {
        if (!nomina) return;
        setCerrando(true);
        try {
            // Se guarda el detalle actual antes de cerrar: cerrar no debe poder
            // perder captura sin guardar, ya una nómina cerrada no se puede editar.
            await guardarDetalles();
            const actualizada = await cerrarNomina(nomina.id);
            setNomina(actualizada);
            setMostrarConfirmCierre(false);
            mostrarToast("Nómina cerrada", "Los cambios se guardaron y la nómina quedó cerrada.", "success");
        } catch (err) {
            mostrarToast("No se pudo cerrar", obtenerMensajeError(err), "danger");
        } finally {
            setCerrando(false);
        }
    }

    return (
        <>
            <PageHeader
                title="Nómina semanal"
                subtitle={nomina ? `${formatearFecha(nomina.fecha_inicio)} - ${formatearFecha(nomina.fecha_fin)}` : undefined}
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Tesorería", to: "/tesoreria" },
                    { label: "Nómina semanal", to: "/tesoreria/nomina/semanal" },
                    { label: "Detalle" },
                ]}
            />

            <div className="container-fluid">
                {error && (
                    <div className="callout callout-warning mb-3">
                        <p><b>Error al cargar:</b></p>
                        <p>{error}</p>
                    </div>
                )}

                {loading && <SkeletonTable columnas={8} filas={6} />}

                {!loading && !error && nomina && (
                    <>
                        <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
                            <span className={`badge ${nomina.cerrada ? "bg-secondary" : "bg-success"} fs-6`}>
                                {nomina.cerrada ? "Cerrada" : "Abierta"}
                            </span>
                            <div className="d-flex gap-2">
                                <Link to="/tesoreria/nomina/semanal" className="btn btn-outline-secondary">
                                    <i className="bi bi-arrow-left me-1"></i>
                                    Volver
                                </Link>
                                {!nomina.cerrada && (
                                    <>
                                        {guardando ? (
                                            <LoadingButton isLoading text="Guardando..." onClick={() => { }} />
                                        ) : (
                                            <button className="btn btn-primary" onClick={guardar}>
                                                <i className="bi bi-save me-1"></i>
                                                Guardar
                                            </button>
                                        )}
                                        <button className="btn btn-danger" onClick={() => setMostrarConfirmCierre(true)}>
                                            <i className="bi bi-lock-fill me-1"></i>
                                            Cerrar nómina
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {empleadosPorRancho.length === 0 ? (
                            <div className="callout callout-warning">
                                <p>
                                    No hay empleados activos registrados. Regístralos desde{" "}
                                    <Link to="/tesoreria/nomina/empleados">Empleados</Link>.
                                </p>
                            </div>
                        ) : (
                            empleadosPorRancho.map((grupo) => (
                                <NominaRanchoGroup
                                    key={grupo.nombre}
                                    ranchoNombre={grupo.nombre}
                                    empleados={grupo.empleados}
                                    valores={valores}
                                    onCambiar={manejarCambio}
                                    disabled={nomina.cerrada || guardando}
                                />
                            ))
                        )}

                        {empleadosPorRancho.length > 0 && (
                            <div className="card border-primary">
                                <div className="card-body d-flex flex-wrap gap-4 justify-content-end">
                                    <div>
                                        <span className="text-muted me-1">Total bruto general</span>
                                        <span className="fw-bold">{formatearMonto(totalesGenerales.bruto)}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted me-1">Total neto general</span>
                                        <span className="fw-bold fs-5">{formatearMonto(totalesGenerales.neto)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <ConfirmModal
                show={mostrarConfirmCierre}
                isLoading={cerrando}
                onCancel={() => setMostrarConfirmCierre(false)}
                onConfirm={cerrar}
                confirmText="Sí, cerrar nómina"
                confirmVariant="danger"
            >
                <div className="text-center">
                    <i className="bi bi-exclamation-triangle-fill text-warning fs-1"></i>
                    <h3 className="text-base font-semibold">¿Cerrar esta nómina?</h3>
                    <p className="text-sm mt-2">
                        Se guardará lo capturado hasta ahora y luego se cerrará. Una vez cerrada, ya no podrás
                        modificar los días trabajados, el salario ni los descuentos.
                    </p>
                </div>
            </ConfirmModal>
        </>
    );
}

export default NominaSemanalDetalleView;
