import type { Denominacion } from "../../interfaces/arqueo/Arqueo";
import type { Divisa } from "../../interfaces/divisas/Divisa";

interface ArqueoDivisaFormProps {
    divisa: Divisa;
    denominaciones: Denominacion[];
    piezas: Record<number, number>;
    onCambiarPiezas: (denominacionId: number, piezas: number) => void;
    saldoInicial: number;
    resultadoEsperado: number;
}

function formatearMonto(valor: number, simbolo: string): string {
    return `${simbolo}${valor.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function ArqueoDivisaForm({
    divisa,
    denominaciones,
    piezas,
    onCambiarPiezas,
    saldoInicial,
    resultadoEsperado,
}: ArqueoDivisaFormProps) {
    const ordenadas = [...denominaciones].sort((a, b) => {
        if (a.tipo !== b.tipo) return a.tipo === "B" ? -1 : 1;
        return Number(b.valor) - Number(a.valor);
    });

    const totalContado = denominaciones.reduce(
        (acumulado, d) => acumulado + (piezas[d.id] ?? 0) * Number(d.valor),
        0
    );
    const diferencia = totalContado - resultadoEsperado;
    const estado = diferencia > 0 ? "SOBRANTE" : diferencia < 0 ? "FALTANTE" : "EXACTO";

    const colorBorde = estado === "SOBRANTE" ? "border-success" : estado === "FALTANTE" ? "border-danger" : "border-secondary-subtle";
    const pill =
        estado === "SOBRANTE" ? (
            <span className="badge rounded-pill bg-success-subtle text-success">Sobrante</span>
        ) : estado === "FALTANTE" ? (
            <span className="badge rounded-pill bg-danger-subtle text-danger">Faltante</span>
        ) : (
            <span className="badge rounded-pill bg-secondary-subtle text-secondary">Exacto</span>
        );

    return (
        <div className="card card-outline card-primary">
            <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                    <h3 className="card-title fs-6 fw-bold m-0">
                        {divisa.codigo} — {divisa.nombre}
                    </h3>
                    {denominaciones.length > 0 ? pill : (
                        <span className="badge bg-warning text-dark">Sin denominaciones</span>
                    )}
                </div>
            </div>

            {denominaciones.length === 0 ? (
                <div className="card-body text-muted small mb-0">
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    Esta divisa no tiene billetes/monedas registrados todavía. Agrégalos desde el administrador
                    antes de poder contarla.
                </div>
            ) : (
                <>
                    <div className="card-body p-0">
                        <table className="table table-sm table-striped align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Denominación</th>
                                    <th style={{ width: 100 }}>Piezas</th>
                                    <th className="text-end">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ordenadas.map((d) => (
                                    <tr key={d.id}>
                                        <td>
                                            {formatearMonto(Number(d.valor), divisa.simbolo)}{" "}
                                            <span className="text-muted" style={{ fontSize: "0.7rem" }}>
                                                {d.tipo === "B" ? "billete" : "moneda"}
                                            </span>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                className="form-control form-control-sm"
                                                value={piezas[d.id] ?? 0}
                                                onChange={(e) => onCambiarPiezas(d.id, Math.max(0, Number(e.target.value) || 0))}
                                            />
                                        </td>
                                        <td className="text-end">
                                            {formatearMonto((piezas[d.id] ?? 0) * Number(d.valor), divisa.simbolo)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className={`card-body d-flex flex-wrap gap-3 pt-2 border-top border-3 ${colorBorde}`} style={{ fontSize: "0.85rem" }}>
                        <div>
                            <span className="text-muted me-1">Inicial</span>
                            <span className="fw-semibold">{formatearMonto(saldoInicial, divisa.simbolo)}</span>
                        </div>
                        <div>
                            <span className="text-muted me-1">Esperado</span>
                            <span className="fw-semibold">{formatearMonto(resultadoEsperado, divisa.simbolo)}</span>
                        </div>
                        <div>
                            <span className="text-muted me-1">Contado</span>
                            <span className="fw-semibold">{formatearMonto(totalContado, divisa.simbolo)}</span>
                        </div>
                        <div>
                            <span className="text-muted me-1">Diferencia</span>
                            <span
                                className={`fw-bold ${estado === "SOBRANTE" ? "text-success" : estado === "FALTANTE" ? "text-danger" : ""
                                    }`}
                            >
                                {formatearMonto(diferencia, divisa.simbolo)}
                            </span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default ArqueoDivisaForm;
