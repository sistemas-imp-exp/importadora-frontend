import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import PageHeader from "../../../../layouts/components/PageHeader";
import SkeletonCards from "../../../../shared/components/SkeletonCards";
import TablaResponsive from "../../../../shared/components/TablaResponsive";
import BotonAccionFila from "../../../../shared/components/tabla/BotonAccionFila";
import { useToastContext } from "../../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { formatearFechaNumerica, hoyISO } from "../../../../shared/utils/fechas";
import { getFullName } from "../../../../shared/utils/userUtils";
import ArqueoForm from "../../components/arqueo/ArqueoForm";
import type { ArqueoCaja, CrearArqueoRequest, Denominacion, EstadoArqueoDivisa } from "../../interfaces/arqueo/Arqueo";
import type { CajaDiaApi } from "../../interfaces/caja/Caja";
import type { Divisa } from "../../interfaces/divisas/Divisa";
import {
    actualizarArqueo,
    crearArqueo,
    descargarArqueoExcel,
    descargarArqueoPdf,
    obtenerArqueos,
    obtenerDenominaciones,
} from "../../services/arqueo.service";
import { obtenerCajaDia } from "../../services/caja.service";
import { obtenerDivisas } from "../../services/divisa.service";

const CLASE_ESTADO: Record<EstadoArqueoDivisa, string> = {
    EXACTO: "bg-success-subtle text-success-emphasis border border-success-subtle",
    SOBRANTE: "bg-info-subtle text-info-emphasis border border-info-subtle",
    FALTANTE: "bg-danger-subtle text-danger-emphasis border border-danger-subtle",
};

function hora(iso: string): string {
    return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Arqueos de caja por día. Se pueden hacer en cualquier momento y varios el
 * mismo día; el esperado de cada uno es el saldo calculado del día al contar.
 */
function ArqueoCajaView() {
    const { mostrarToast } = useToastContext();
    const [fecha, setFecha] = useState(hoyISO());
    const [caja, setCaja] = useState<CajaDiaApi | null>(null);
    const [arqueos, setArqueos] = useState<ArqueoCaja[]>([]);
    const [divisas, setDivisas] = useState<Divisa[]>([]);
    const [denominaciones, setDenominaciones] = useState<Denominacion[]>([]);
    // Cargando = lo que hay en pantalla no es del día pedido (derivado, sin bandera en el efecto).
    const [fechaCargada, setFechaCargada] = useState<string | null>(null);
    const cargando = fechaCargada !== fecha;
    // Arqueo abierto en el formulario (null = uno nuevo) y "sesión" del formulario:
    // la key solo cambia al elegir otro arqueo o empezar uno nuevo, no al autoguardar,
    // para no reiniciar el conteo que se está capturando.
    const [enFormulario, setEnFormulario] = useState<ArqueoCaja | null>(null);
    const [sesion, setSesion] = useState(0);

    useEffect(() => {
        Promise.all([obtenerDivisas(), obtenerDenominaciones()])
            .then(([datosDivisas, datosDenominaciones]) => {
                setDivisas(datosDivisas.filter((d) => d.activa));
                setDenominaciones(datosDenominaciones);
            })
            .catch((err) => mostrarToast("Error al cargar", obtenerMensajeError(err), "danger"));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        Promise.all([obtenerCajaDia(fecha), obtenerArqueos(fecha)])
            .then(([datosCaja, datosArqueos]) => {
                setCaja(datosCaja);
                setArqueos(datosArqueos);
            })
            .catch((err) => mostrarToast("Error al cargar", obtenerMensajeError(err), "danger"))
            .finally(() => setFechaCargada(fecha));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fecha]);

    function abrir(arqueo: ArqueoCaja | null) {
        setEnFormulario(arqueo);
        setSesion((n) => n + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function cambiarFecha(nueva: string) {
        if (!nueva || nueva > hoyISO()) return;
        setFecha(nueva);
        setEnFormulario(null);
        setSesion((n) => n + 1);
    }

    async function manejarAutoguardar(payload: CrearArqueoRequest, idExistente: number | null): Promise<ArqueoCaja> {
        const resultado = idExistente ? await actualizarArqueo(idExistente, payload) : await crearArqueo(payload);
        try {
            setArqueos(await obtenerArqueos(fecha));
        } catch {
            // Que falle solo el refresco de la lista no debe interrumpir el autoguardado.
        }
        return resultado;
    }

    async function descargar(arqueo: ArqueoCaja, formato: "excel" | "pdf") {
        try {
            await (formato === "excel" ? descargarArqueoExcel(arqueo.id) : descargarArqueoPdf(arqueo.id));
        } catch (err) {
            mostrarToast("Error al descargar", obtenerMensajeError(err), "danger");
        }
    }

    const sinApertura = caja !== null && !caja.apertura;

    return (
        <>
            <PageHeader
                title="Arqueo de Caja"
                subtitle="Conteo de efectivo por denominación contra el saldo calculado del día"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Tesorería", to: "/tesoreria" },
                    { label: "Arqueo de Caja" },
                ]}
            />

            <div className="container-fluid">
                <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                    <label className="small fw-semibold text-body-secondary" htmlFor="arqueo-fecha">Día a arquear</label>
                    <input
                        id="arqueo-fecha"
                        type="date"
                        className="form-control form-control-sm"
                        style={{ width: "auto" }}
                        value={fecha}
                        max={hoyISO()}
                        onChange={(e) => cambiarFecha(e.target.value)}
                    />
                    {fecha !== hoyISO() && (
                        <button type="button" className="btn btn-link btn-sm" onClick={() => cambiarFecha(hoyISO())}>Ir a hoy</button>
                    )}
                    {enFormulario && (
                        <button type="button" className="btn btn-outline-primary btn-sm ms-auto" onClick={() => abrir(null)}>
                            <i className="bi bi-plus-lg me-1"></i>Nuevo arqueo
                        </button>
                    )}
                </div>

                {cargando ? (
                    <SkeletonCards cantidad={2} columnas="col-md-6 col-sm-12" />
                ) : sinApertura ? (
                    <div className="callout callout-info mb-3">
                        <p className="mb-1"><b>No hay saldos iniciales para esta fecha</b></p>
                        <p className="mb-0">
                            El arqueo se compara contra el saldo calculado del día.{" "}
                            <Link to="/tesoreria/caja/saldos-iniciales">Capturar saldos iniciales <i className="bi bi-box-arrow-up-right"></i></Link>
                        </p>
                    </div>
                ) : (
                    caja && (
                        <ArqueoForm
                            key={`${fecha}-${sesion}`}
                            divisasActivas={divisas}
                            denominaciones={denominaciones}
                            fecha={fecha}
                            saldos={caja.saldos}
                            arqueo={enFormulario}
                            onAutoguardar={manejarAutoguardar}
                        />
                    )
                )}

                {!cargando && (
                    <div className="card card-outline card-secondary mt-3">
                        <div className="card-header">
                            <h3 className="card-title fs-6 fw-bold m-0">
                                Arqueos del {formatearFechaNumerica(dayjs(fecha).toDate())} ({arqueos.length})
                            </h3>
                        </div>
                        <div className="card-body p-0">
                            <TablaResponsive>
                                <table className="table tabla-datos">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Horario</th>
                                            <th>Realizó</th>
                                            <th>Resultado</th>
                                            <th className="text-end">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {arqueos.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center text-body-secondary py-4">
                                                    Aún no hay arqueos este día.
                                                </td>
                                            </tr>
                                        ) : (
                                            arqueos.map((arqueo) => (
                                                <tr key={arqueo.id} className={`fila-principal ${enFormulario?.id === arqueo.id ? "expandida" : ""}`}>
                                                    <td className="fw-semibold">#{arqueo.id}</td>
                                                    <td className="text-nowrap">{hora(arqueo.hora_inicio)} – {hora(arqueo.hora_termino)}</td>
                                                    <td className="small text-nowrap">
                                                        {getFullName(arqueo.usuario)}
                                                        {arqueo.editado_por && (
                                                            <div className="text-body-secondary">Editó: {getFullName(arqueo.editado_por)}</div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="d-flex flex-wrap gap-1">
                                                            {arqueo.divisas.map((linea) => (
                                                                <span
                                                                    key={linea.id}
                                                                    className={`badge ${CLASE_ESTADO[linea.estado]}`}
                                                                    title={`Esperado ${linea.resultado_esperado} · Contado ${linea.total_contado} · Diferencia ${linea.diferencia}`}
                                                                >
                                                                    {linea.divisa.codigo}: {linea.estado.toLowerCase()}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="text-end text-nowrap">
                                                        <BotonAccionFila icono="bi-pencil" etiqueta={`Abrir arqueo #${arqueo.id}`} onClick={() => abrir(arqueo)} />{" "}
                                                        <BotonAccionFila icono="bi-file-earmark-excel" etiqueta="Descargar Excel" onClick={() => descargar(arqueo, "excel")} />{" "}
                                                        <BotonAccionFila icono="bi-file-earmark-pdf" etiqueta="Descargar PDF" onClick={() => descargar(arqueo, "pdf")} />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </TablaResponsive>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default ArqueoCajaView;
