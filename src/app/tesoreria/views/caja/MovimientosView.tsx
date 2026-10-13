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
import {
    actualizarMovimiento,
    crearMovimiento,
    obtenerMovimientos,
    obtenerRangoMovimientos,
    type RangoFechas,
} from "../../services/movimientos.service";
import { obtenerCajaDia } from "../../services/caja.service";
import SkeletonCards from "../../../../shared/components/SkeletonCards";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import CardCollapseButton from "../../../../shared/components/CardCollapseButton";
import type { Divisa } from "../../interfaces/divisas/Divisa";
import { obtenerDivisas } from "../../services/divisa.service";
import { formatearFechaNumerica, hoyISO } from "../../../../shared/utils/fechas";
import dayjs from "dayjs";

// sessionStorage: el rango sobrevive al ir al detalle y regresar (o recargar),
// pero cada pestaña nueva arranca con todo el periodo en vez de un filtro viejo.
const CLAVE_RANGO = "tesoreria:movimientos:rango";

function leerRangoGuardado(): RangoFechas | null {
    try {
        const guardado = JSON.parse(sessionStorage.getItem(CLAVE_RANGO) ?? "null");
        if (guardado?.desde && guardado?.hasta) return guardado;
    } catch {
        // Sin almacenamiento disponible se usa el rango completo.
    }
    return null;
}

function guardarRango(rango: RangoFechas) {
    try {
        sessionStorage.setItem(CLAVE_RANGO, JSON.stringify(rango));
    } catch {
        // Sin almacenamiento el rango solo dura mientras la pantalla está abierta.
    }
}

function Movimientos() {
    const { mostrarToast } = useToastContext();
    const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
    const [cajaHoy, setCajaHoy] = useState<CajaDiaApi | null>(null);
    const [divisas, setDivisas] = useState<Divisa[]>([]);
    // Periodo listado: el guardado en la pestaña o, la primera vez, todo lo registrado.
    const [rango, setRango] = useState<RangoFechas | null>(leerRangoGuardado);
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
        if (rango) {
            cargar(rango);
            return;
        }
        obtenerRangoMovimientos()
            .then(cambiarRango)
            .catch((err) => {
                setError(obtenerMensajeError(err));
                setLoading(false);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rango]);

    function cambiarRango(nuevo: RangoFechas) {
        guardarRango(nuevo);
        setRango(nuevo);
    }

    async function cargar({ desde, hasta }: RangoFechas) {
        try {
            const [datos, datosCaja, datosDivisas] = await Promise.all([
                obtenerMovimientos({ desde, hasta }),
                obtenerCajaDia(),
                obtenerDivisas(),
            ]);
            setMovimientos(mapMovimientosApiToMovimientos(datos));
            setCajaHoy(datosCaja);
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
            // Si el movimiento quedó fuera del periodo (hoja atrasada o de hoy), el periodo se amplía para incluirlo.
            if (rango && (datosMovimiento.fecha < rango.desde || datosMovimiento.fecha > rango.hasta)) {
                cambiarRango({
                    desde: datosMovimiento.fecha < rango.desde ? datosMovimiento.fecha : rango.desde,
                    hasta: datosMovimiento.fecha > rango.hasta ? datosMovimiento.fecha : rango.hasta,
                });
            } else if (rango) {
                await cargar(rango);
            }
        } catch (err) {
            mostrarToast("Error al guardar", obtenerMensajeError(err), "danger");
            throw err;
        }
    }

    async function verTodoElPeriodo() {
        try {
            cambiarRango(await obtenerRangoMovimientos());
        } catch (err) {
            mostrarToast("Error al cargar", obtenerMensajeError(err), "danger");
        }
    }

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
                        {cajaHoy && <SaldosDelDia caja={cajaHoy} titulo="Saldo de hoy" />}
                        <div ref={formularioRef}>
                            <MovimientoForm
                                divisas={divisas}
                                movimiento={movimientoEnEdicion}
                                onGuardar={handleGuardarMovimiento}
                                onCancelar={() => setMovimientoEnEdicion(null)}
                            />
                        </div>

                        <div className="card card-outline card-primary">
                            <div className="card-header d-flex flex-wrap gap-2 align-items-center bg-body-tertiary">
                                <h3 className="card-title d-flex flex-wrap align-items-center gap-2 me-auto mb-0">
                                    Movimientos del
                                    <input
                                        type="date"
                                        className="form-control form-control-sm d-inline-block"
                                        style={{ width: "auto" }}
                                        value={rango?.desde ?? ""}
                                        max={rango?.hasta}
                                        onChange={(e) => rango && e.target.value && e.target.value <= rango.hasta && cambiarRango({ ...rango, desde: e.target.value })}
                                        aria-label="Desde"
                                    />
                                    al
                                    <input
                                        type="date"
                                        className="form-control form-control-sm d-inline-block"
                                        style={{ width: "auto" }}
                                        value={rango?.hasta ?? ""}
                                        min={rango?.desde}
                                        max={hoyISO()}
                                        onChange={(e) => rango && e.target.value && e.target.value >= rango.desde && cambiarRango({ ...rango, hasta: e.target.value })}
                                        aria-label="Hasta"
                                    />
                                    <button type="button" className="btn btn-link btn-sm p-0" onClick={verTodoElPeriodo} title="Desde el primer movimiento hasta el último">
                                        Todo el periodo
                                    </button>
                                    <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle">
                                        <i className="bi bi-arrow-up-circle me-1"></i>Ingresos: {cantidadIngresos}
                                    </span>
                                    <span className="badge bg-danger-subtle text-danger-emphasis border border-danger-subtle">
                                        <i className="bi bi-arrow-down-circle me-1"></i>Egresos: {cantidadEgresos}
                                    </span>
                                </h3>
                                {rango && (
                                    <Link className="btn btn-outline-secondary btn-sm" to={`/tesoreria/caja/diaria?fecha=${rango.hasta}`}>
                                        <i className="bi bi-calendar3 me-1"></i>Caja del {formatearFechaNumerica(dayjs(rango.hasta).toDate())}
                                    </Link>
                                )}
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
                    if (rango) cargar(rango);
                    mostrarToast("Movimiento cancelado", "El movimiento fue cancelado y el saldo se actualizó.", "success");
                }}
            />

            <AdjuntosMovimientoModal
                movimiento={movimientoDeArchivos}
                show={mostrarArchivos}
                onClose={() => setMostrarArchivos(false)}
                onCambio={() => rango && cargar(rango)}
            />
        </>
    );
}

export default Movimientos;
