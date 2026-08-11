import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../../../layouts/components/PageHeader";
import SkeletonCards from "../../../../shared/components/SkeletonCards";
import { useToastContext } from "../../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import ArqueoForm from "../../components/arqueo/ArqueoForm";
import type { ArqueoCaja, CrearArqueoRequest, Denominacion } from "../../interfaces/arqueo/Arqueo";
import type { CorteCaja } from "../../interfaces/movimientos/CorteCaja";
import type { Divisa } from "../../interfaces/divisas/Divisa";
import { actualizarArqueo, crearArqueo, descargarArqueoExcel, descargarArqueoPdf, obtenerArqueos, obtenerDenominaciones } from "../../services/arqueo.service";
import { obtenerCorteAbierto } from "../../services/corteCaja.service";
import { obtenerDivisas } from "../../services/divisa.service";

function ordenarArqueosPorReciente(arqueos: ArqueoCaja[]): ArqueoCaja[] {
    return [...arqueos].sort((a, b) => {
        const fechaA = new Date(a.hora_termino).getTime();
        const fechaB = new Date(b.hora_termino).getTime();
        return fechaB - fechaA;
    });
}

function ArqueoCajaView() {
    const { mostrarToast } = useToastContext();

    const [corte, setCorte] = useState<CorteCaja | null>(null);
    const [divisas, setDivisas] = useState<Divisa[]>([]);
    const [denominaciones, setDenominaciones] = useState<Denominacion[]>([]);
    // Un corte tiene a lo más un arqueo (ligado a su ciclo de vida): no es un historial.
    const [arqueoActual, setArqueoActual] = useState<ArqueoCaja | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [descargando, setDescargando] = useState<"excel" | "pdf" | null>(null);
    const [errorDescarga, setErrorDescarga] = useState<string | null>(null);

    useEffect(() => {
        cargar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function cargar() {
        try {
            const corteActual = await obtenerCorteAbierto();
            const [datosDivisas, datosDenominaciones, datosArqueos] = await Promise.all([
                obtenerDivisas(),
                obtenerDenominaciones(),
                corteActual ? obtenerArqueos(corteActual.id) : obtenerArqueos(),
            ]);
            const arqueosOrdenados = ordenarArqueosPorReciente(datosArqueos);
            setCorte(corteActual);
            setDivisas(datosDivisas.filter((d) => d.activa));
            setDenominaciones(datosDenominaciones);
            setArqueoActual(arqueosOrdenados[0] ?? null);
            setError(null);
        } catch (err) {
            const mensaje = obtenerMensajeError(err);
            setError(mensaje);
            mostrarToast("Error al cargar", mensaje, "danger");
        } finally {
            setLoading(false);
        }
    }

    async function recargarArqueo() {
        if (!corte) return;
        try {
            const datosArqueos = await obtenerArqueos(corte.id);
            const arqueosOrdenados = ordenarArqueosPorReciente(datosArqueos);
            setArqueoActual(arqueosOrdenados[0] ?? null);
        } catch {
            // Silencioso: que falle solo el refresco no debe interrumpir el autoguardado.
        }
    }

    async function descargarReporte(formato: "excel" | "pdf") {
        if (!arqueoActual?.id) return;
        setDescargando(formato);
        setErrorDescarga(null);
        try {
            await (formato === "excel" ? descargarArqueoExcel(arqueoActual.id) : descargarArqueoPdf(arqueoActual.id));
        } catch (err) {
            setErrorDescarga(obtenerMensajeError(err));
        } finally {
            setDescargando(null);
        }
    }

    async function manejarAutoguardar(payload: CrearArqueoRequest, idExistente: number | null): Promise<ArqueoCaja> {
        const resultado = idExistente
            ? await actualizarArqueo(idExistente, payload)
            : await crearArqueo(payload);
        await recargarArqueo();
        return resultado;
    }

    return (
        <>
            <PageHeader
                title="Arqueo de Caja"
                subtitle="Conteo de efectivo por denominación"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Tesorería", to: "/tesoreria" },
                    { label: "Arqueo de Caja" },
                ]}
            />

            <div className="container-fluid">
                {error && (
                    <div className="callout callout-warning mb-3">
                        <p>
                            <b>Error al cargar:</b>
                        </p>
                        <p>{error}</p>
                    </div>
                )}

                {loading && (
                    <>
                        <div className="card mb-3 placeholder-glow">
                            <div className="card-body">
                                <span className="placeholder col-6 rounded" style={{ height: "1rem" }}></span>
                            </div>
                        </div>
                        <SkeletonCards cantidad={2} columnas="col-md-6 col-sm-12" />
                    </>
                )}

                {!loading && !error && !corte && (
                    <div className="callout callout-warning mb-3">
                        <p>
                            <b>No hay un corte de caja abierto.</b>
                        </p>
                        {arqueoActual ? (
                            <>
                                <p>
                                    Puedes descargar el último arqueo cerrado del corte #{arqueoActual.corte.id} para consulta o envío.
                                </p>
                                <div className="d-flex flex-wrap align-items-center gap-2 mt-3">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm"
                                        disabled={descargando !== null}
                                        onClick={() => descargarReporte("excel")}
                                    >
                                        {descargando === "excel" ? (
                                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                        ) : (
                                            <><i className="bi bi-file-earmark-excel me-1"></i>Excel</>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm"
                                        disabled={descargando !== null}
                                        onClick={() => descargarReporte("pdf")}
                                    >
                                        {descargando === "pdf" ? (
                                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                        ) : (
                                            <><i className="bi bi-file-earmark-pdf me-1"></i>PDF</>
                                        )}
                                    </button>
                                    <Link to={`/tesoreria/caja/corte/${arqueoActual.corte.id}`} className="btn btn-outline-primary btn-sm">
                                        Ver historial del corte <i className="bi bi-box-arrow-up-right ms-1"></i>
                                    </Link>
                                </div>
                                {errorDescarga && <div className="text-danger small mt-2">{errorDescarga}</div>}
                            </>
                        ) : (
                            <p>
                                Para hacer un arqueo, primero abre un corte{" "}
                                <Link to="/tesoreria/caja/corte">aquí <i className="bi bi-box-arrow-up-right"></i></Link>.
                            </p>
                        )}
                    </div>
                )}

                {!loading && !error && corte && (
                    <ArqueoForm
                        divisasActivas={divisas}
                        denominaciones={denominaciones}
                        saldos={corte.saldos}
                        arqueo={arqueoActual}
                        onAutoguardar={manejarAutoguardar}
                    />
                )}
            </div>
        </>
    );
}

export default ArqueoCajaView;
