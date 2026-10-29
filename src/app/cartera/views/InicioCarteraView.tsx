import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../../layouts/components/PageHeader";
import SkeletonCards from "../../../shared/components/SkeletonCards";
import { useToastContext } from "../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import type { ResumenCartera } from "../interfaces/Cartera";
import { obtenerResumen } from "../services/cartera.service";
import { dinero, fecha, rutaClienteCartera } from "../utils/cartera";

function InicioCarteraView() {
    const { mostrarToast } = useToastContext();
    const [resumen, setResumen] = useState<ResumenCartera | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        obtenerResumen()
            .then(setResumen)
            .catch((err) => {
                const mensaje = obtenerMensajeError(err);
                setError(mensaje);
                mostrarToast("Error al cargar", mensaje, "danger");
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const totalPorCobrar = resumen?.empresas.reduce((acc, e) => acc + Number(e.por_cobrar), 0) ?? 0;
    const totalCobrado = resumen?.empresas.reduce((acc, e) => acc + Number(e.cobrado_mes), 0) ?? 0;
    const maximo = Number(resumen?.mayores_saldos[0]?.saldo_conjunto ?? 0);

    return (
        <>
            <PageHeader
                title="Cartera de clientes"
                subtitle={resumen?.fecha_corte ? `Saldos iniciales al ${fecha(resumen.fecha_corte)}` : "Lo que deben los clientes a cada empresa"}
                breadcrumbs={[{ label: "Inicio", to: "/" }, { label: "Cartera" }]}
            />
            <div className="container-fluid">
                {error && <div className="alert alert-danger">{error}</div>}
                {!resumen && !error && <SkeletonCards />}
                {resumen && (
                    <>
                        <div className="row g-3 mb-3">
                            <div className="col-md-6 col-xl-3">
                                <div className="card card-outline card-danger h-100 mb-0">
                                    <div className="card-body py-2">
                                        <div className="small text-body-secondary">Por cobrar (conjunto)</div>
                                        <div className="fs-4 fw-bold">{dinero(totalPorCobrar)}</div>
                                        <div className="small text-body-secondary">{resumen.clientes_con_saldo} clientes con saldo</div>
                                    </div>
                                </div>
                            </div>
                            {resumen.empresas.map((e) => (
                                <div className="col-md-6 col-xl-3" key={e.id}>
                                    <div className="card card-outline card-warning h-100 mb-0">
                                        <div className="card-body py-2">
                                            <div className="small text-body-secondary">Por cobrar · {e.nombre}</div>
                                            <div className="fs-4 fw-bold">{dinero(e.por_cobrar)}</div>
                                            {Number(e.a_favor) > 0 && (
                                                <div className="small text-success-emphasis">Saldos a favor {dinero(e.a_favor)}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="col-md-6 col-xl-3">
                                <div className="card card-outline card-success h-100 mb-0">
                                    <div className="card-body py-2">
                                        <div className="small text-body-secondary">Cobrado este mes</div>
                                        <div className="fs-4 fw-bold">{dinero(totalCobrado)}</div>
                                        <div className="small text-body-secondary">
                                            {resumen.empresas.map((e) => `${e.nombre}: ${dinero(e.cobrado_mes)}`).join(" · ")}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row g-3">
                            <div className="col-lg-7">
                                <div className="card card-outline card-primary h-100">
                                    <div className="card-header d-flex align-items-center">
                                        <h3 className="card-title mb-0 me-auto">Mayores saldos</h3>
                                        <Link to="/cartera/clientes" className="btn btn-link btn-sm">Ver todos</Link>
                                    </div>
                                    <ul className="list-group list-group-flush">
                                        {resumen.mayores_saldos.length === 0 && (
                                            <li className="list-group-item text-body-secondary">Ningún cliente con saldo.</li>
                                        )}
                                        {resumen.mayores_saldos.map((c) => {
                                            const proporcion = maximo > 0 ? (Number(c.saldo_conjunto) / maximo) * 100 : 0;
                                            return (
                                                <li className="list-group-item" key={c.id}>
                                                    <div className="d-flex justify-content-between gap-2">
                                                        <Link to={rutaClienteCartera(c.id)} className="fw-semibold text-truncate">{c.nombre}</Link>
                                                        <span className="fw-bold text-nowrap">{dinero(c.saldo_conjunto)}</span>
                                                    </div>
                                                    <div className="progress mt-1" style={{ height: 4 }} aria-hidden="true">
                                                        <div className="progress-bar bg-danger" style={{ width: `${proporcion}%` }}></div>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </div>
                            <div className="col-lg-5 d-flex flex-column gap-3">
                                {resumen.por_identificar.length > 0 && (
                                    <div className="card card-outline card-danger mb-0">
                                        <div className="card-header"><h3 className="card-title mb-0">Pagos por identificar</h3></div>
                                        <div className="card-body py-2">
                                            {resumen.por_identificar.map((p) => (
                                                <div key={p.empresa_id} className="d-flex justify-content-between py-1">
                                                    <span>{resumen.empresas.find((e) => e.id === p.empresa_id)?.nombre ?? "—"} · {p.cantidad} pago(s)</span>
                                                    <span className="fw-bold">{dinero(p.monto)}</span>
                                                </div>
                                            ))}
                                            <Link to="/cartera/pagos?pestana=por_identificar" className="btn btn-sm btn-outline-danger w-100 mt-2">
                                                Identificar pagos
                                            </Link>
                                        </div>
                                    </div>
                                )}
                                <div className="card card-outline card-warning mb-0">
                                    <div className="card-header"><h3 className="card-title mb-0">Ventas contra nota</h3></div>
                                    <div className="card-body py-2">
                                        <div className="d-flex justify-content-between py-1">
                                            <span>Por verificar</span><span className="fw-bold">{resumen.ventas.pendientes}</span>
                                        </div>
                                        <div className="d-flex justify-content-between py-1 border-top">
                                            <span>Con diferencia (en Inventario)</span><span className="fw-bold text-danger-emphasis">{resumen.ventas.diferencia}</span>
                                        </div>
                                        <div className="d-flex justify-content-between py-1 border-top">
                                            <span>Sin precio (en Inventario)</span><span className="fw-bold">{resumen.ventas.sin_precio}</span>
                                        </div>
                                        <div className="d-flex justify-content-between py-1 border-top">
                                            <span>Verificadas</span><span className="fw-bold text-success-emphasis">{resumen.ventas.verificadas}</span>
                                        </div>
                                        <Link to="/cartera/clientes" className="btn btn-sm btn-outline-warning w-100 mt-2">Ver clientes con ventas por verificar</Link>
                                    </div>
                                </div>
                                <div className="card card-outline card-secondary mb-0">
                                    <div className="card-header"><h3 className="card-title mb-0">Accesos</h3></div>
                                    <div className="list-group list-group-flush">
                                        <Link to="/cartera/pagos?nuevo=1" className="list-group-item list-group-item-action">
                                            <i className="bi bi-cash-coin me-2" aria-hidden="true"></i>Registrar pago
                                        </Link>
                                        <Link to="/cartera/ajustes?nuevo=1" className="list-group-item list-group-item-action">
                                            <i className="bi bi-sliders me-2" aria-hidden="true"></i>Registrar ajuste o traspaso
                                        </Link>
                                        <Link to="/cartera/reportes/saldos" className="list-group-item list-group-item-action">
                                            <i className="bi bi-table me-2" aria-hidden="true"></i>Reporte de saldos de clientes
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

export default InicioCarteraView;
