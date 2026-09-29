import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import PageHeader from "../../../../layouts/components/PageHeader";
import MovimientosTable from "../../components/movimientos/MovimientosTable";
import MovimientoForm from "../../components/movimientos/MovimientoForm";
import CancelarMovimientoModal from "../../components/movimientos/CancelarMovimientoModal";
import AdjuntosMovimientoModal from "../../components/movimientos/AdjuntosMovimientoModal";
import SaldosDelDia from "../../components/caja/SaldosDelDia";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { useToastContext } from "../../../../shared/context/ToastProvider";
import type { CrearMovimientoRequest, Movimiento } from "../../interfaces/movimientos/Movimiento";
import { mapMovimientosApiToMovimientos } from "../../interfaces/movimientos/Movimiento";
import type { CajaDiaApi } from "../../interfaces/caja/Caja";
import { actualizarMovimiento, crearMovimiento, obtenerMovimientos } from "../../services/movimientos.service";
import { obtenerAperturas, obtenerCajaDia } from "../../services/caja.service";
import SkeletonCards from "../../../../shared/components/SkeletonCards";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import CardCollapseButton from "../../../../shared/components/CardCollapseButton";
import type { Divisa } from "../../interfaces/divisas/Divisa";
import { obtenerDivisas } from "../../services/divisa.service";
import { formatearFechaNumerica, hoyISO } from "../../../../shared/utils/fechas";
import dayjs from "dayjs";

function Movimientos() {
    const { mostrarToast } = useToastContext();
    const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
    const [cajaHoy, setCajaHoy] = useState<CajaDiaApi | null>(null);
    const [primeraApertura, setPrimeraApertura] = useState<string | null>(null);
    const [divisas, setDivisas] = useState<Divisa[]>([]);
    // Día cuyos movimientos se listan (no necesariamente hoy: se capturan hojas atrasadas).
    const [fechaLista, setFechaLista] = useState(hoyISO());
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [movimientoEnEdicion, setMovimientoEnEdicion] = useState<Movimiento | null>(null);
    const [movimientoACancelar, setMovimientoACancelar] = useState<Movimiento | null>(null);
    const [mostrarCancelar, setMostrarCancelar] = useState(false);
    const [movimientoDeArchivos, setMovimientoDeArchivos] = useState<Movimiento | null>(null);
    const [mostrarArchivos, setMostrarArchivos] = useState(false);
    const [colapsado, setColapsado] = useState(false);
    const formularioRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        cargar(fechaLista);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fechaLista]);

    async function cargar(fecha: string) {
        try {
            const [datos, datosCaja, aperturas, datosDivisas] = await Promise.all([
                obtenerMovimientos({ fecha }),
                obtenerCajaDia(),
                obtenerAperturas(),
                obtenerDivisas(),
            ]);
            setMovimientos(mapMovimientosApiToMovimientos(datos));
            setCajaHoy(datosCaja);
            setPrimeraApertura(aperturas.length ? aperturas.map((a) => a.fecha).sort()[0] : null);
            setDivisas(datosDivisas);
            setError(null);
        } catch (err) {
            const mensaje = obtenerMensajeError(err);
            setError(mensaje);
            mostrarToast("Error al cargar", mensaje, "danger");
        } finally {
            setLoading(false);
        }
    }

    const { cantidadIngresos, cantidadEgresos } = useMemo(() => ({
        cantidadIngresos: movimientos.filter((m) => m.tipo === "I").length,
        cantidadEgresos: movimientos.filter((m) => m.tipo === "E").length,
    }), [movimientos]);

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
                mostrarToast("Movimiento actualizado", "Los cambios se guardaron correctamente.", "success");
                setMovimientoEnEdicion(null);
            } else {
                await crearMovimiento(datosMovimiento);
                mostrarToast("Guardado exitoso", "El movimiento ha sido registrado correctamente.", "success");
            }
            // Se muestra el día del movimiento recién guardado (puede ser una hoja atrasada).
            if (datosMovimiento.fecha !== fechaLista) setFechaLista(datosMovimiento.fecha);
            else await cargar(fechaLista);
        } catch (err) {
            mostrarToast("Error al guardar", obtenerMensajeError(err), "danger");
            throw err;
        }
    }

    const esHoy = fechaLista === hoyISO();

    return (
        <>
            <PageHeader
                title="Movimientos"
                subtitle="Ingreso y egreso de efectivo, con la fecha de su hoja física"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Tesorería", to: "/tesoreria" },
                    { label: "Movimientos" },
                ]}
            />

            <div className="container-fluid">
                {error && (
                    <div className="callout callout-warning mb-3">
                        <p><b>Error al cargar:</b></p>
                        <p>{error}</p>
                    </div>
                )}

                {loading && (
                    <>
                        <SkeletonCards cantidad={3} />
                        <div className="card"><div className="card-body p-0"><SkeletonTable columnas={8} filas={6} /></div></div>
                    </>
                )}

                {!error && !loading && (
                    <>
                        {!primeraApertura ? (
                            <div className="callout callout-info mb-3">
                                <p className="mb-1"><b>Primero captura los saldos iniciales de caja</b></p>
                                <p className="mb-0">
                                    Los movimientos parten de un saldo inicial por divisa a una fecha.{" "}
                                    <Link to="/tesoreria/caja/saldos-iniciales">
                                        Capturar saldos iniciales <i className="bi bi-box-arrow-up-right"></i>
                                    </Link>
                                </p>
                            </div>
                        ) : (
                            <>
                                {cajaHoy && <SaldosDelDia caja={cajaHoy} titulo="Saldo de hoy" />}
                                <div ref={formularioRef}>
                                    <MovimientoForm
                                        divisas={divisas}
                                        movimiento={movimientoEnEdicion}
                                        onGuardar={handleGuardarMovimiento}
                                        onCancelar={() => setMovimientoEnEdicion(null)}
                                        fechaMinima={primeraApertura}
                                    />
                                </div>
                            </>
                        )}

                        <div className="card card-outline card-primary">
                            <div className="card-header d-flex flex-wrap gap-2 align-items-center bg-body-tertiary">
                                <h3 className="card-title d-flex flex-wrap align-items-center gap-2 me-auto mb-0">
                                    Movimientos del
                                    <input
                                        type="date"
                                        className="form-control form-control-sm d-inline-block"
                                        style={{ width: "auto" }}
                                        value={fechaLista}
                                        max={hoyISO()}
                                        onChange={(e) => e.target.value && setFechaLista(e.target.value)}
                                        aria-label="Día a mostrar"
                                    />
                                    {!esHoy && (
                                        <button type="button" className="btn btn-link btn-sm p-0" onClick={() => setFechaLista(hoyISO())}>
                                            Ir a hoy
                                        </button>
                                    )}
                                    <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle">
                                        <i className="bi bi-arrow-up-circle me-1"></i>Ingresos: {cantidadIngresos}
                                    </span>
                                    <span className="badge bg-danger-subtle text-danger-emphasis border border-danger-subtle">
                                        <i className="bi bi-arrow-down-circle me-1"></i>Egresos: {cantidadEgresos}
                                    </span>
                                </h3>
                                <Link className="btn btn-outline-secondary btn-sm" to={`/tesoreria/caja/diaria?fecha=${fechaLista}`}>
                                    <i className="bi bi-calendar3 me-1"></i>Caja del {formatearFechaNumerica(dayjs(fechaLista).toDate())}
                                </Link>
                                <CardCollapseButton collapsed={colapsado} onToggle={() => setColapsado((c) => !c)} />
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
                    cargar(fechaLista);
                    mostrarToast("Movimiento cancelado", "El movimiento fue cancelado y el saldo se actualizó.", "success");
                }}
            />

            <AdjuntosMovimientoModal
                movimiento={movimientoDeArchivos}
                show={mostrarArchivos}
                onClose={() => setMostrarArchivos(false)}
                onCambio={() => cargar(fechaLista)}
            />
        </>
    );
}

export default Movimientos;
