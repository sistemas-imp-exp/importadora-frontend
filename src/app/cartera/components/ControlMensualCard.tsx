import { useEffect, useState } from "react";
import TablaResponsive from "../../../shared/components/TablaResponsive";
import { useToastContext } from "../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import { hoyISO } from "../../../shared/utils/fechas";
import { descargarControlMensual, obtenerControlMensual, type ControlMensual } from "../services/cartera.service";
import { claseSaldo, dinero } from "../utils/cartera";

/**
 * Control del mes por empresa, como las hojas "<EMPRESA> <MES> <AÑO>" del
 * área: aquí los totales por empresa; el Excel trae una hoja por empresa con
 * cada cliente y las listas de pagos y ventas del mes.
 */
function ControlMensualCard() {
    const { mostrarToast } = useToastContext();
    const [mes, setMes] = useState(hoyISO().slice(0, 7));
    const [control, setControl] = useState<ControlMensual | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [descargando, setDescargando] = useState(false);

    useEffect(() => {
        if (!mes) return;
        let vigente = true;
        obtenerControlMensual(mes)
            .then((datos) => {
                if (!vigente) return;
                setControl(datos);
                setError(null);
            })
            .catch((err) => {
                if (!vigente) return;
                setControl(null);
                setError(obtenerMensajeError(err));
            });
        return () => { vigente = false; };
    }, [mes]);

    async function descargar() {
        setDescargando(true);
        try {
            await descargarControlMensual(mes);
        } catch (err) {
            mostrarToast("Error al descargar", obtenerMensajeError(err), "danger");
        } finally {
            setDescargando(false);
        }
    }

    return (
        <div className="card card-outline card-primary mb-3">
            <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                <h3 className="card-title fs-6 fw-bold mb-0 me-auto">
                    <i className="bi bi-calendar3 me-2 text-body-secondary" aria-hidden="true"></i>
                    Control mensual por empresa
                </h3>
                <label className="visually-hidden" htmlFor="control-mes">Mes</label>
                <input id="control-mes" type="month" className="form-control form-control-sm" style={{ width: "auto" }}
                    value={mes} max={hoyISO().slice(0, 7)} onChange={(e) => setMes(e.target.value)} />
                <button type="button" className="btn btn-sm btn-outline-success" onClick={descargar}
                    disabled={descargando || !control}>
                    {descargando ? (
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    ) : (
                        <i className="bi bi-file-earmark-excel me-1" aria-hidden="true"></i>
                    )}
                    Excel (una hoja por empresa)
                </button>
            </div>
            <div className="card-body p-0">
                {error ? (
                    <div className="alert alert-warning m-3 mb-3" role="alert">{error}</div>
                ) : !control ? (
                    <p className="text-body-secondary small m-3">Cargando…</p>
                ) : (
                    <TablaResponsive>
                        <table className="table tabla-datos mb-0">
                            <thead>
                                <tr>
                                    <th>Empresa</th>
                                    <th className="num">Clientes</th>
                                    <th className="num">Saldo al cierre anterior</th>
                                    <th className="num">Ventas</th>
                                    <th className="num">Pagos</th>
                                    <th className="num">Ajustes</th>
                                    <th className="num">Saldo final</th>
                                </tr>
                            </thead>
                            <tbody>
                                {control.empresas.map((e) => (
                                    <tr key={e.empresa.id}>
                                        <td className="fw-semibold">{e.empresa.nombre}</td>
                                        <td className="num">{e.filas.length}</td>
                                        <td className="num">{dinero(e.totales.anterior)}</td>
                                        <td className="num">{dinero(e.totales.ventas)}</td>
                                        <td className="num">{dinero(e.totales.pagos)}</td>
                                        <td className="num">{dinero(e.totales.ajustes)}</td>
                                        <td className={`num fw-bold ${claseSaldo(Number(e.totales.actual))}`}>{dinero(e.totales.actual)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </TablaResponsive>
                )}
            </div>
            <div className="card-footer small text-body-secondary">
                <i className="bi bi-info-circle me-1" aria-hidden="true"></i>
                Saldo final = saldo al cierre del mes anterior + ventas − pagos + ajustes (cargos − abonos, incluidos traspasos).
                Cuadra con el estado de cuenta de cada cliente al último día del mes.
            </div>
        </div>
    );
}

export default ControlMensualCard;
