import { useEffect, useMemo, useRef, useState } from "react";
import ArqueoDivisaForm from "./ArqueoDivisaForm";
import type { ArqueoCaja, CrearArqueoRequest, Denominacion } from "../../interfaces/arqueo/Arqueo";
import type { Divisa } from "../../interfaces/divisas/Divisa";
import type { SaldoCajaApiResponse } from "../../interfaces/movimientos/CorteCaja";
import { descargarArqueoExcel, descargarArqueoPdf } from "../../services/arqueo.service";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";

interface ArqueoFormProps {
    divisasActivas: Divisa[];
    denominaciones: Denominacion[];
    saldos: SaldoCajaApiResponse[];
    arqueo?: ArqueoCaja | null;
    onAutoguardar: (payload: CrearArqueoRequest, idExistente: number | null) => Promise<ArqueoCaja>;
    onCancelar?: () => void;
}

type PiezasPorDivisa = Record<number, Record<number, number>>;
type EstadoGuardado = "idle" | "editando" | "guardando" | "guardado" | "error";

const RETRASO_AUTOGUARDADO_MS = 900;

function construirPiezasIniciales(arqueo: ArqueoCaja | null | undefined): PiezasPorDivisa {
    if (!arqueo) return {};
    const resultado: PiezasPorDivisa = {};
    for (const linea of arqueo.divisas) {
        resultado[linea.divisa.id] = {};
        for (const conteo of linea.conteos) {
            resultado[linea.divisa.id][conteo.denominacion.id] = conteo.piezas;
        }
    }
    return resultado;
}

function ArqueoForm({ divisasActivas, denominaciones, saldos, arqueo, onAutoguardar }: ArqueoFormProps) {
    const [claveAnterior, setClaveAnterior] = useState<number | "nuevo">(arqueo?.id ?? "nuevo");
    const [observaciones, setObservaciones] = useState(arqueo?.observaciones ?? "");
    const [horaInicio, setHoraInicio] = useState(() => arqueo?.hora_inicio ?? new Date().toISOString());
    const [piezasPorDivisa, setPiezasPorDivisa] = useState<PiezasPorDivisa>(() => construirPiezasIniciales(arqueo));
    const [arqueoIdActivo, setArqueoIdActivo] = useState<number | null>(arqueo?.id ?? null);
    const [estadoGuardado, setEstadoGuardado] = useState<EstadoGuardado>("idle");
    const [mensajeError, setMensajeError] = useState<string | null>(null);
    const [descargando, setDescargando] = useState<"excel" | "pdf" | null>(null);
    const [errorDescarga, setErrorDescarga] = useState<string | null>(null);

    // Refs con el valor más reciente: el guardado autodiferido se dispara desde un
    // setTimeout, así que no puede depender de closures de un render ya pasado.
    const observacionesRef = useRef(observaciones);
    const horaInicioRef = useRef(horaInicio);
    const piezasRef = useRef(piezasPorDivisa);
    const arqueoIdRef = useRef(arqueoIdActivo);
    const timerRef = useRef<number | null>(null);
    const guardandoRef = useRef(false);
    const reintentoPendienteRef = useRef(false);

    const claveActual = arqueo?.id ?? "nuevo";
    if (claveActual !== claveAnterior) {
        setClaveAnterior(claveActual);
        setObservaciones(arqueo?.observaciones ?? "");
        setHoraInicio(arqueo?.hora_inicio ?? new Date().toISOString());
        setPiezasPorDivisa(construirPiezasIniciales(arqueo));
        setArqueoIdActivo(arqueo?.id ?? null);
        setEstadoGuardado("idle");
        setMensajeError(null);
    }

    // Mantiene los refs sincronizados con el estado más reciente (no puede hacerse
    // durante el render): el guardado autodiferido se dispara desde un setTimeout,
    // que necesita leer valores frescos y no un closure de un render ya pasado.
    useEffect(() => {
        observacionesRef.current = observaciones;
        horaInicioRef.current = horaInicio;
        piezasRef.current = piezasPorDivisa;
    });

    // Al cambiar de arqueo (editar otra fila del historial, o volver a "nuevo"),
    // reinicia el seguimiento de guardado para que no se mezcle con el anterior.
    useEffect(() => {
        arqueoIdRef.current = arqueo?.id ?? null;
        guardandoRef.current = false;
        reintentoPendienteRef.current = false;
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [claveActual]);

    useEffect(() => {
        return () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
        };
    }, []);

    const denominacionesPorDivisa = useMemo(() => {
        const mapa: Record<number, Denominacion[]> = {};
        for (const denominacion of denominaciones) {
            if (!mapa[denominacion.divisa]) mapa[denominacion.divisa] = [];
            mapa[denominacion.divisa].push(denominacion);
        }
        return mapa;
    }, [denominaciones]);

    const saldosPorDivisa = useMemo(() => {
        const mapa: Record<number, SaldoCajaApiResponse> = {};
        for (const saldo of saldos) {
            mapa[saldo.divisa.id] = saldo;
        }
        return mapa;
    }, [saldos]);

    function construirPayload(): CrearArqueoRequest {
        return {
            hora_inicio: horaInicioRef.current,
            observaciones: observacionesRef.current,
            divisas: divisasActivas.map((divisa) => ({
                divisa_id: divisa.id,
                conteos: (denominacionesPorDivisa[divisa.id] ?? []).map((denominacion) => ({
                    denominacion_id: denominacion.id,
                    piezas: piezasRef.current[divisa.id]?.[denominacion.id] ?? 0,
                })),
            })),
        };
    }

    async function ejecutarGuardado() {
        if (guardandoRef.current) {
            reintentoPendienteRef.current = true;
            return;
        }
        guardandoRef.current = true;
        setEstadoGuardado("guardando");
        setMensajeError(null);
        try {
            const resultado = await onAutoguardar(construirPayload(), arqueoIdRef.current);
            arqueoIdRef.current = resultado.id;
            setArqueoIdActivo(resultado.id);
            setEstadoGuardado("guardado");
        } catch (err) {
            setEstadoGuardado("error");
            setMensajeError(err instanceof Error ? err.message : "No se pudo guardar el arqueo.");
        } finally {
            guardandoRef.current = false;
            if (reintentoPendienteRef.current) {
                reintentoPendienteRef.current = false;
                ejecutarGuardado();
            }
        }
    }

    function programarGuardado() {
        setEstadoGuardado("editando");
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => {
            timerRef.current = null;
            ejecutarGuardado();
        }, RETRASO_AUTOGUARDADO_MS);
    }

    function manejarCambioPiezas(divisaId: number, denominacionId: number, piezas: number) {
        setPiezasPorDivisa((actual) => ({
            ...actual,
            [divisaId]: {
                ...actual[divisaId],
                [denominacionId]: piezas,
            },
        }));
        programarGuardado();
    }

    function manejarCambioObservaciones(valor: string) {
        setObservaciones(valor);
        programarGuardado();
    }

    async function descargarReporte(formato: "excel" | "pdf") {
        if (!arqueoIdActivo) return;
        setDescargando(formato);
        setErrorDescarga(null);
        try {
            await (formato === "excel" ? descargarArqueoExcel(arqueoIdActivo) : descargarArqueoPdf(arqueoIdActivo));
        } catch (err) {
            setErrorDescarga(obtenerMensajeError(err));
        } finally {
            setDescargando(null);
        }
    }

    return (
        <>
            <div className={`card card-outline card-primary mb-3 shadow-sm ${arqueo ? "border-warning border-2" : ""}`}>
                <div className="card-header">
                    <div className="d-flex flex-wrap gap-2 justify-content-between">
                        {arqueoIdActivo && (
                            <>
                                <span className="badge bg-warning-subtle text-warning-emphasis align-self-center">
                                    <i className="bi bi-pencil-square me-1"></i>
                                    Editando #{arqueoIdActivo}
                                </span>
                                <span className="small text-nowrap" >
                                    {estadoGuardado === "editando" && (
                                        <span className="badge text-bg-light border d-inline-flex align-items-center fw-normal px-2 py-1">
                                            <i className="bi bi-pencil me-1"></i> Editando...
                                        </span>
                                    )}
                                    {estadoGuardado === "guardando" && (
                                        <span className="badge text-bg-primary d-inline-flex align-items-center fw-normal px-2 py-1">
                                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                            Guardando...
                                        </span>
                                    )}
                                    {estadoGuardado === "guardado" && (
                                        <span className="badge text-bg-success d-inline-flex align-items-center fw-normal px-2 py-1">
                                            <i className="bi bi-check-circle-fill me-1"></i> Guardado
                                        </span>
                                    )}
                                    {estadoGuardado === "error" && (
                                        <span className="badge text-bg-danger d-inline-flex align-items-center fw-normal px-2 py-1" title={mensajeError ?? undefined}>
                                            <i className="bi bi-exclamation-triangle-fill me-1"></i> Error al guardar
                                        </span>
                                    )}
                                </span>
                            </>
                        )}
                    </div>
                </div>
                <div className="card-body d-flex flex-wrap align-items-end gap-3">
                    <div className="flex-grow-1" style={{ minWidth: 220 }}>
                        <label className="form-label small text-muted mb-1 fw-bold">Observaciones</label>
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Notas sobre este arqueo (opcional)"
                            value={observaciones}
                            onChange={(e) => manejarCambioObservaciones(e.target.value)}
                        />
                    </div>
                    <div style={{ width: 190 }}>
                        <label className="form-label small text-muted mb-1 fw-bold">Hora de inicio</label>
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            value={new Date(horaInicio).toLocaleString("es-MX")}
                            disabled
                            readOnly
                        />
                    </div>

                    {arqueoIdActivo && (
                        <>
                            <div className="btn-group btn-group-sm align-self-end justity-content-end">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    disabled={descargando !== null}
                                    onClick={() => descargarReporte("excel")}
                                >
                                    {descargando === "excel" ? (
                                        <span className="spinner-border spinner-border-sm" role="status"></span>
                                    ) : (
                                        <><i className="bi bi-file-earmark-excel me-1"></i>Excel</>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    disabled={descargando !== null}
                                    onClick={() => descargarReporte("pdf")}
                                >
                                    {descargando === "pdf" ? (
                                        <span className="spinner-border spinner-border-sm" role="status"></span>
                                    ) : (
                                        <><i className="bi bi-file-earmark-pdf me-1"></i>PDF</>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {mensajeError && estadoGuardado === "error" && (
                    <div className="px-3 pb-2 text-danger small">{mensajeError}</div>
                )}
                {errorDescarga && (
                    <div className="px-3 pb-2 text-danger small">{errorDescarga}</div>
                )}

            </div>
            <div className="row g-3">
                {divisasActivas.map((divisa) => (
                    <div className="col-md-6 col-sm-12" key={divisa.id}>
                        <ArqueoDivisaForm
                            divisa={divisa}
                            denominaciones={denominacionesPorDivisa[divisa.id] ?? []}
                            piezas={piezasPorDivisa[divisa.id] ?? {}}
                            onCambiarPiezas={(denominacionId, piezas) => manejarCambioPiezas(divisa.id, denominacionId, piezas)}
                            saldoInicial={Number(saldosPorDivisa[divisa.id]?.saldo_inicial ?? 0)}
                            resultadoEsperado={Number(saldosPorDivisa[divisa.id]?.saldo_final ?? 0)}
                        />
                    </div>
                ))}
            </div>
        </>
    );
}

export default ArqueoForm;
