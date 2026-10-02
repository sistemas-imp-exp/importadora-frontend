import type { CajaDiaApi } from "../../interfaces/caja/Caja";

interface SaldosDelDiaProps {
    caja: CajaDiaApi;
    titulo?: string;
    /** Muestra inicial / ingresos / egresos debajo del saldo final. */
    detalle?: boolean;
}

function dinero(simbolo: string, valor: string): string {
    const numero = Number(valor);
    const texto = Math.abs(numero).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${numero < 0 ? "−" : ""}${simbolo}${texto}`;
}

/** Una tarjeta por divisa con el saldo calculado del día; en rojo si quedó negativo. */
function SaldosDelDia({ caja, titulo, detalle = false }: SaldosDelDiaProps) {
    return (
        <>
            {titulo && <h6 className="text-uppercase small fw-semibold text-body-secondary mb-2">{titulo}</h6>}
            {caja.negativo && (
                <div className="alert alert-danger py-2 small d-flex align-items-center gap-2" role="status">
                    <i className="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
                    La caja queda en negativo en alguna divisa. Revisa si falta capturar un ingreso de esta fecha o anterior.
                </div>
            )}
            <div className="row g-2 mb-3">
                {caja.saldos.map((s) => (
                    <div className="col-xl-3 col-lg-4 col-md-6" key={s.divisa.id}>
                        <div className={`info-box mb-0 ${s.negativo ? "border border-danger" : ""}`}>
                            <span className={`info-box-icon shadow-sm ${s.negativo ? "text-bg-danger" : "text-bg-primary"}`}>
                                {s.divisa.codigo}
                            </span>
                            <div className="info-box-content">
                                <span className="info-box-text">{s.divisa.nombre}</span>
                                <span className={`info-box-number font-tabular-nums ${s.negativo ? "text-danger" : ""}`}>
                                    {dinero(s.divisa.simbolo, s.saldo_final)}
                                </span>
                                {detalle ? (
                                    <span className="small text-body-secondary font-tabular-nums">
                                        Inicial {dinero(s.divisa.simbolo, s.saldo_inicial)} ·{" "}
                                        <span className="text-success">+{dinero(s.divisa.simbolo, s.ingresos)}</span> ·{" "}
                                        <span className="text-danger">−{dinero(s.divisa.simbolo, s.egresos)}</span>
                                    </span>
                                ) : (
                                    Number(s.ingresos) - Number(s.egresos) !== 0 && (
                                        <span className="small text-body-secondary font-tabular-nums">
                                            Del día: {dinero(s.divisa.simbolo, String(Number(s.ingresos) - Number(s.egresos)))}
                                        </span>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

export default SaldosDelDia;
