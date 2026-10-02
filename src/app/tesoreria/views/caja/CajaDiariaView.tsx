import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import PageHeader from "../../../../layouts/components/PageHeader";
import SkeletonCards from "../../../../shared/components/SkeletonCards";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import TablaResponsive from "../../../../shared/components/TablaResponsive";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { useToastContext } from "../../../../shared/context/ToastProvider";
import { fechaHaceNDiasISO, formatearFechaNumerica, hoyISO } from "../../../../shared/utils/fechas";
import SaldosDelDia from "../../components/caja/SaldosDelDia";
import MovimientosTable from "../../components/movimientos/MovimientosTable";
import type { CajaDiaApi, DiaHistorialApi } from "../../interfaces/caja/Caja";
import { mapMovimientosApiToMovimientos } from "../../interfaces/movimientos/Movimiento";
import { obtenerCajaDia, obtenerHistorialCaja } from "../../services/caja.service";

const DIAS_HISTORIAL = 30;

function fechaLarga(iso: string): string {
    return formatearFechaNumerica(dayjs(iso).toDate());
}

function dinero(simbolo: string, valor: string): string {
    const numero = Number(valor);
    return `${numero < 0 ? "−" : ""}${simbolo}${Math.abs(numero).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
}

/**
 * Caja por día. Reemplaza al corte abierto/cerrado: cualquier día se consulta
 * con su saldo calculado (todos los movimientos hasta ese día), así
 * que una hoja capturada con fecha atrasada se refleja sola en los días siguientes.
 */
function CajaDiariaView() {
    const { mostrarToast } = useToastContext();
    const [parametros, setParametros] = useSearchParams();
    const fecha = parametros.get("fecha") || hoyISO();
    const [caja, setCaja] = useState<CajaDiaApi | null>(null);
    const [historial, setHistorial] = useState<DiaHistorialApi[]>([]);
    const [desde, setDesde] = useState(fechaHaceNDiasISO(DIAS_HISTORIAL));
    // Cargando = los datos en pantalla no son de la fecha/rango pedidos (se deriva
    // en vez de encender una bandera dentro del efecto).
    const clave = `${fecha}|${desde}`;
    const [claveCargada, setClaveCargada] = useState<string | null>(null);
    const cargando = claveCargada !== clave;

    useEffect(() => {
        Promise.all([obtenerCajaDia(fecha), obtenerHistorialCaja(desde, hoyISO())])
            .then(([datosCaja, datosHistorial]) => {
                setCaja(datosCaja);
                setHistorial(datosHistorial);
            })
            .catch((err) => mostrarToast("Error al cargar", obtenerMensajeError(err), "danger"))
            .finally(() => setClaveCargada(clave));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fecha, desde]);

    function irA(nueva: string) {
        if (nueva > hoyISO()) return;
        setParametros(nueva === hoyISO() ? {} : { fecha: nueva });
    }

    const esHoy = fecha === hoyISO();

    return (
        <>
            <PageHeader
                title="Caja diaria"
                subtitle="Saldo por día calculado desde los saldos iniciales y los movimientos capturados"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Tesorería", to: "/tesoreria" },
                    { label: "Caja diaria" },
                ]}
            />

            <div className="container-fluid">
                <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                    <div className="btn-group btn-group-sm" role="group" aria-label="Cambiar de día">
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => irA(dayjs(fecha).subtract(1, "day").format("YYYY-MM-DD"))}
                            title="Día anterior"
                        >
                            <i className="bi bi-chevron-left" aria-hidden="true"></i>
                            <span className="visually-hidden">Día anterior</span>
                        </button>
                        <input
                            type="date"
                            className="form-control form-control-sm rounded-0"
                            style={{ width: "auto" }}
                            value={fecha}
                            max={hoyISO()}
                            onChange={(e) => e.target.value && irA(e.target.value)}
                            aria-label="Día"
                        />
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => irA(dayjs(fecha).add(1, "day").format("YYYY-MM-DD"))}
                            disabled={esHoy}
                            title="Día siguiente"
                        >
                            <i className="bi bi-chevron-right" aria-hidden="true"></i>
                            <span className="visually-hidden">Día siguiente</span>
                        </button>
                    </div>
                    {!esHoy && (
                        <button type="button" className="btn btn-link btn-sm" onClick={() => irA(hoyISO())}>Ir a hoy</button>
                    )}
                    <h2 className="fs-5 mb-0 ms-2">{esHoy ? "Hoy, " : ""}{fechaLarga(fecha)}</h2>
                    <div className="ms-auto d-flex gap-2">
                        <Link className="btn btn-outline-primary btn-sm" to="/tesoreria/caja/movimientos">
                            <i className="bi bi-plus-lg me-1"></i>Registrar movimientos
                        </Link>
                        <Link className="btn btn-outline-secondary btn-sm" to="/tesoreria/caja/arqueo">
                            <i className="bi bi-cash-stack me-1"></i>Arqueo
                        </Link>
                    </div>
                </div>

                {cargando || !caja ? (
                    <SkeletonCards cantidad={3} />
                ) : (
                    <>
                        <SaldosDelDia caja={caja} detalle />

                        <div className="card card-outline card-primary">
                            <div className="card-header">
                                <h3 className="card-title fs-6 fw-bold mb-0">Movimientos del día ({caja.movimientos.length})</h3>
                            </div>
                            <div className="card-body p-0">
                                <MovimientosTable movimientos={mapMovimientosApiToMovimientos(caja.movimientos)} />
                            </div>
                        </div>
                    </>
                )}

                <div className="card card-outline card-secondary">
                    <div className="card-header d-flex flex-wrap align-items-center gap-2">
                        <h3 className="card-title fs-6 fw-bold mb-0 me-auto">Historial por día</h3>
                        <label className="small text-body-secondary" htmlFor="historial-desde">Desde</label>
                        <input
                            id="historial-desde"
                            type="date"
                            className="form-control form-control-sm"
                            style={{ width: "auto" }}
                            value={desde}
                            max={hoyISO()}
                            onChange={(e) => e.target.value && setDesde(e.target.value)}
                        />
                    </div>
                    <div className="card-body p-0">
                        {cargando ? (
                            <SkeletonTable columnas={4} filas={5} />
                        ) : (
                            <TablaResponsive alturaMaxima="60vh">
                                <table className="table tabla-datos">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th className="num">Movimientos</th>
                                            <th>Saldo al cierre</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historial.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="text-center text-body-secondary py-5">
                                                    Sin actividad en este periodo.
                                                </td>
                                            </tr>
                                        ) : (
                                            historial.map((dia) => (
                                                <tr
                                                    key={dia.fecha}
                                                    className={`fila-principal ${dia.fecha === fecha ? "expandida" : ""}`}
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => irA(dia.fecha)}
                                                    title="Ver este día"
                                                >
                                                    <td className="text-nowrap fw-semibold">{fechaLarga(dia.fecha)}</td>
                                                    <td className="num">{dia.movimientos}</td>
                                                    <td className="font-tabular-nums">
                                                        {dia.saldos.map((s) => (
                                                            <span
                                                                key={s.divisa.id}
                                                                className={`me-3 text-nowrap ${Number(s.saldo_final) < 0 ? "text-danger fw-semibold" : ""}`}
                                                            >
                                                                <span className="text-body-secondary small me-1">{s.divisa.codigo}</span>
                                                                {dinero(s.divisa.simbolo, s.saldo_final)}
                                                            </span>
                                                        ))}
                                                    </td>
                                                    <td>
                                                        <div className="d-flex flex-wrap gap-1">
                                                            {dia.negativo && (
                                                                <span className="badge bg-danger-subtle text-danger-emphasis border border-danger-subtle">
                                                                    <i className="bi bi-exclamation-triangle me-1" aria-hidden="true"></i>Negativo
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </TablaResponsive>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default CajaDiariaView;
