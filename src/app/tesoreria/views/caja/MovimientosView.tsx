import { useEffect, useState, useMemo, useRef } from "react";
import PageHeader from "../../../../layouts/components/PageHeader";
import MovimientosTable from "../../components/movimientos/MovimientosTable";
import MovimientoForm from "../../components/movimientos/MovimientoForm";
import CancelarMovimientoModal from "../../components/movimientos/CancelarMovimientoModal";
import AdjuntosMovimientoModal from "../../components/movimientos/AdjuntosMovimientoModal";
import CorteEstadoCallout from "../../components/caja/CorteEstadoCallout";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { useToastContext } from "../../../../shared/context/ToastProvider";
import type { Movimiento } from "../../interfaces/movimientos/Movimiento";
import { mapMovimientosApiToMovimientos } from "../../interfaces/movimientos/Movimiento";
import type { CorteCaja } from '../../interfaces/movimientos/CorteCaja'
import { obtenerMovimientos, crearMovimiento, actualizarMovimiento } from "../../services/movimientos.service";
import { obtenerCorteAbierto } from "../../services/corteCaja.service";
import SkeletonCallout from "../../../../shared/components/SkeletonCallout";
import SkeletonCards from "../../../../shared/components/SkeletonCards";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import CardCollapseButton from "../../../../shared/components/CardCollapseButton";
import type { Divisa } from "../../interfaces/divisas/Divisa";
import { obtenerDivisas } from "../../services/divisa.service";
import type {
    CrearMovimientoRequest,
} from "../../interfaces/movimientos/Movimiento";
import { Link } from "react-router";

function Movimientos() {
    const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
    const { mostrarToast } = useToastContext();
    const [error, setError] = useState<string | null>(null)
    const [corte, setCorte] = useState<CorteCaja | null>(null);
    const [loading, setLoading] = useState(true)
    const [divisas, setDivisas] = useState<Divisa[]>([]);
    const [movimientoEnEdicion, setMovimientoEnEdicion] = useState<Movimiento | null>(null);
    const [movimientoACancelar, setMovimientoACancelar] = useState<Movimiento | null>(null);
    const [mostrarCancelar, setMostrarCancelar] = useState(false);
    const [movimientoDeArchivos, setMovimientoDeArchivos] = useState<Movimiento | null>(null);
    const [mostrarArchivos, setMostrarArchivos] = useState(false);
    const [colapsado, setColapsado] = useState(false);
    const formularioRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        cargar();
    }, []);

    async function cargar() {
        try {
            // Solo nos interesan los movimientos del corte que sigue abierto:
            // los de cortes anteriores ya se consultan en el detalle del historial.
            const corteActual = await obtenerCorteAbierto();
            
            const [datos, datosDivisas] = await Promise.all([
                corteActual ? obtenerMovimientos(corteActual.id) : Promise.resolve([]),
                obtenerDivisas(),
            ]);
            setMovimientos(mapMovimientosApiToMovimientos(datos))
            setCorte(corteActual);
            setDivisas(datosDivisas)
            setError(null)
        } catch (error) {
            console.log(error);
            const mensaje = obtenerMensajeError(error);
            setError(mensaje)
            mostrarToast(
                "Error al cargar",
                mensaje,
                "danger"
            );
        } finally {
            setLoading(false)
        }
    }
    const { cantidadIngresos, cantidadEgresos } = useMemo(() => {
        const ingresos = movimientos.filter(mov => mov.tipo === 'I').length;
        const egresos = movimientos.filter(mov => mov.tipo === 'E').length;

        return { cantidadIngresos: ingresos, cantidadEgresos: egresos };
    }, [movimientos]);

    // Neto (ingresos - egresos) por divisa, excluyendo movimientos cancelados:
    // es la cifra que realmente responde "¿cómo se movió la caja hoy?".
    const netoPorDivisa = useMemo(() => {
        const acumulado = new Map<number, { divisa: Divisa; neto: number }>();
        for (const mov of movimientos) {
            if (mov.cancelado) continue;
            const signo = mov.tipo === "I" ? 1 : -1;
            for (const item of mov.divisas) {
                const actual = acumulado.get(item.divisa.id) ?? { divisa: item.divisa, neto: 0 };
                actual.neto += signo * item.cantidad;
                acumulado.set(item.divisa.id, actual);
            }
        }
        return Array.from(acumulado.values());
    }, [movimientos]);
    function manejarEditar(movimiento: Movimiento) {
        setMovimientoEnEdicion(movimiento);
        mostrarToast(
            "Editando movimiento",
            `Estás editando el folio ${movimiento.folio}. Al guardar, reemplaza los datos actuales.`,
            "info"
        );
        formularioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    async function handleGuardarMovimiento(datosMovimiento: CrearMovimientoRequest) {
        try {
            if (movimientoEnEdicion) {
                await actualizarMovimiento(movimientoEnEdicion.id, datosMovimiento);
                mostrarToast(
                    "Movimiento actualizado",
                    "Los cambios se guardaron correctamente.",
                    "success"
                );
                setMovimientoEnEdicion(null);
            } else {
                await crearMovimiento(datosMovimiento);
                mostrarToast(
                    "Guardado exitoso",
                    "El movimiento ha sido registrado correctamente.",
                    "success"
                );
            }

            // Recargar los datos para actualizar la tabla y los saldos
            await cargar();
        } catch (error) {
            console.error(error);
            const mensaje = obtenerMensajeError(error);
            mostrarToast(
                "Error al guardar",
                mensaje,
                "danger"
            );
            throw error;
        }
    }

    return (
        <>
            <PageHeader
                title="Movimientos"
                subtitle="Ingreso y egreso de efectivo"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Tesorería", to: "/tesoreria" },
                    { label: "Movimientos" }
                ]}
            />

            <div className="container-fluid">
                {/* 1. Validación de Error */}
                {error && (
                    <div className="callout callout-warning mb-3">
                        <p><b>Error al cargar:</b></p>
                        <p>{error}</p>
                    </div>
                )}

                {/* 2. Validación de Carga (Loading) */}
                {loading && (
                    <>
                        <SkeletonCallout />
                        <SkeletonCards cantidad={3} />
                        <div className="card">
                            <div className="card-header placeholder-glow">
                                <span className="placeholder col-3 rounded" style={{ height: "1rem" }}></span>
                            </div>
                            <div className="card-body p-0">
                                <SkeletonTable columnas={8} filas={6} />
                            </div>
                        </div>
                    </>
                )}

                {/* 3. Contenido Principal (Se muestra solo si NO hay error y NO está cargando) */}
                {!error && !loading && (
                    <>
                        <CorteEstadoCallout
                            corte={corte}
                            acciones={
                                <Link className="btn btn-danger" to={"/tesoreria/caja/corte"}>
                                    <i className="bi bi-box-arrow-up-left me-1"></i>
                                    Cerrar caja
                                </Link>
                            }
                            sinCorte={
                                <>
                                    <p className="mb-1"><b>No hay una caja abierta</b></p>
                                    <p className="mb-0">
                                        Para registrar movimientos, primero abre el corte de caja de hoy.{" "}
                                        <Link to={"/tesoreria/caja/corte"}>Abrir caja <i className="bi bi-box-arrow-up-right"></i></Link>
                                    </p>
                                </>
                            }
                        />

                        {/* --- Tarjetas de Saldos --- */}
                        <div className="row g-2 mb-3">
                            {corte?.saldos?.map((saldo) => {
                                const neto = netoPorDivisa.find((n) => n.divisa.id === saldo.divisa.id)?.neto ?? 0;
                                return (
                                    <div className="col-xl-2 col-lg-3 col-md-4 col-sm-6" key={saldo.id}>
                                        <div className="info-box">
                                            <span className="info-box-icon text-bg-primary shadow-sm">
                                                {saldo.divisa.codigo}
                                            </span>

                                            <div className="info-box-content">
                                                <span className="info-box-text">{saldo.divisa.nombre}</span>
                                                <span className="info-box-number font-tabular-nums">{saldo.divisa.simbolo} {Number(saldo.saldo_final).toLocaleString("es-US")}</span>
                                                {neto !== 0 && (
                                                    <span
                                                        className={`d-block text-truncate small fw-semibold font-tabular-nums ${neto > 0 ? "text-success" : "text-danger"}`}
                                                        title={`${neto > 0 ? "+" : "−"}${saldo.divisa.simbolo}${Math.abs(neto).toLocaleString("es-US", { minimumFractionDigits: 2 })} hoy`}
                                                    >
                                                        <i className={`bi ${neto > 0 ? "bi-arrow-up-short" : "bi-arrow-down-short"}`}></i>
                                                        {neto > 0 ? "+" : "−"}{saldo.divisa.simbolo}{Math.abs(neto).toLocaleString("es-US", { minimumFractionDigits: 2 })} hoy
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* 4. Tabla de Movimientos (Protegida para que no se muestre si está cargando) */}
                {!loading && !error && (
                    <>
                        {corte && (
                            <div ref={formularioRef}>
                                <MovimientoForm
                                    divisas={divisas}
                                    movimiento={movimientoEnEdicion}
                                    onGuardar={handleGuardarMovimiento}
                                    onCancelar={() => setMovimientoEnEdicion(null)}
                                />
                            </div>
                        )}
                        <div className="card card-outline card-primary">
                            <div className="card-header d-flex align-items-center bg-body-tertiary">
                                <h3 className="card-title d-flex flex-wrap gap-2 me-auto">
                                    <span className="badge bg-success p-2">
                                        <i className="bi bi-arrow-up-circle me-1"></i>
                                        Ingresos: {cantidadIngresos}
                                    </span>
                                    <span className="badge bg-danger p-2">
                                        <i className="bi bi-arrow-down-circle me-1"></i>
                                        Egresos: {cantidadEgresos}
                                    </span>
                                </h3>
                                <div className="card-tools">
                                    <CardCollapseButton collapsed={colapsado} onToggle={() => setColapsado((c) => !c)} />
                                </div>
                            </div>
                            {!colapsado && (
                                <div className="card-body p-0">
                                    <MovimientosTable
                                        movimientos={movimientos}
                                        onEditar={manejarEditar}
                                        onCancelar={(movimiento) => {
                                            setMovimientoACancelar(movimiento);
                                            setMostrarCancelar(true);
                                        }}
                                        onVerArchivos={(movimiento) => {
                                            setMovimientoDeArchivos(movimiento);
                                            setMostrarArchivos(true);
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            <CancelarMovimientoModal
                movimiento={movimientoACancelar}
                show={mostrarCancelar}
                onClose={() => setMostrarCancelar(false)}
                onCancelado={() => {
                    setMostrarCancelar(false);
                    setMovimientoACancelar(null);
                    cargar();
                    mostrarToast(
                        "Movimiento cancelado",
                        "El movimiento fue cancelado y el saldo se actualizó.",
                        "success"
                    );
                }}
            />

            <AdjuntosMovimientoModal
                movimiento={movimientoDeArchivos}
                show={mostrarArchivos}
                onClose={() => setMostrarArchivos(false)}
                onCambio={cargar}
            />
        </>
    );
}


export default Movimientos;