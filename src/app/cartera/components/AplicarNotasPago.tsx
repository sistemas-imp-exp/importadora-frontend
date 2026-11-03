import { useEffect, useState } from "react";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import type { NotaPendiente } from "../interfaces/Cartera";
import { obtenerNotasPendientes } from "../services/cartera.service";
import { claveNota, dinero, fecha } from "../utils/cartera";

interface Props {
    clienteId: number;
    empresaId: number;
    /** El pago que se edita: no ocupa lo disponible de sus propias notas. */
    pagoId?: number;
    /** Fecha del pago: las notas posteriores no se pueden pagar con él. */
    fechaPago: string;
    montoPago: number;
    /** {clave de nota: monto} */
    valor: Record<string, string>;
    onChange: (valor: Record<string, string>) => void;
}

const centavos = (n: number) => Math.round(n * 100) / 100;

/**
 * Notas del cliente en la empresa del pago, para indicar de cuáles se
 * descuenta y cuánto. Lo que no se aplica va a lo más antiguo (como siempre).
 */
function AplicarNotasPago({ clienteId, empresaId, pagoId, fechaPago, montoPago, valor, onChange }: Props) {
    const [notas, setNotas] = useState<NotaPendiente[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [verTodas, setVerTodas] = useState(false);

    useEffect(() => {
        let vigente = true;
        obtenerNotasPendientes(clienteId, empresaId, { pago: pagoId, fecha: fechaPago || undefined })
            .then((lista) => {
                if (!vigente) return;
                setNotas(lista);
                setError(null);
            })
            .catch((err) => vigente && setError(obtenerMensajeError(err)));
        return () => { vigente = false; };
    }, [clienteId, empresaId, pagoId, fechaPago]);

    const aplicado = centavos(Object.values(valor).reduce((acc, v) => acc + (Number(v) || 0), 0));
    const resto = centavos(montoPago - aplicado);
    // Las ya pagadas (por pagos anteriores a lo más antiguo) se pueden ver a pedido.
    const visibles = (notas ?? []).filter(
        (n) => verTodas || Number(n.pendiente) > 0 || Number(valor[claveNota(n.salida_id)]) > 0,
    );
    const ocultas = (notas ?? []).length - visibles.length;

    function cambiar(clave: string, monto: string) {
        const siguiente = { ...valor };
        if (monto === "" || Number(monto) === 0) delete siguiente[clave];
        else siguiente[clave] = monto;
        onChange(siguiente);
    }

    function aplicarTodo(nota: NotaPendiente) {
        const clave = claveNota(nota.salida_id);
        const actual = Number(valor[clave]) || 0;
        const objetivo = Number(nota.pendiente) > 0 ? Number(nota.pendiente) : Number(nota.disponible);
        const monto = centavos(Math.max(0, Math.min(objetivo, Number(nota.disponible), resto + actual)));
        cambiar(clave, monto > 0 ? String(monto) : "");
    }

    return (
        <div className="border rounded p-3 bg-body-tertiary">
            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                <span className="fw-semibold me-auto">
                    <i className="bi bi-receipt me-1" aria-hidden="true"></i>
                    Aplicar a notas <span className="text-body-secondary fw-normal small">(opcional)</span>
                </span>
                {ocultas > 0 && (
                    <button type="button" className="btn btn-link btn-sm p-0" onClick={() => setVerTodas(true)}>
                        Ver también {ocultas} nota(s) ya cubiertas
                    </button>
                )}
            </div>
            {error ? (
                <div className="alert alert-warning py-2 mb-0">{error}</div>
            ) : notas === null ? (
                <p className="small text-body-secondary mb-0">Cargando notas…</p>
            ) : notas.length === 0 ? (
                <p className="small text-body-secondary mb-0">El cliente no tiene notas en esta empresa a la fecha del pago.</p>
            ) : (
                <div className="table-responsive" style={{ maxHeight: "40vh" }}>
                    <table className="table table-sm align-middle mb-0 tabla-datos">
                        <thead className="sticky-top">
                            <tr>
                                <th>Nota</th>
                                <th>Fecha</th>
                                <th className="num">Días</th>
                                <th className="num">Importe</th>
                                <th className="num">Pendiente</th>
                                <th className="num" style={{ width: "13rem" }}>Aplicar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibles.map((n) => {
                                const clave = claveNota(n.salida_id);
                                const monto = valor[clave] ?? "";
                                const excede = Number(monto) > Number(n.disponible) + 0.004;
                                return (
                                    <tr key={clave}>
                                        <td className="text-nowrap">
                                            {n.tipo === "inicial" ? <span className="fw-semibold">{n.nota}</span> : n.nota}
                                            {n.folio && <span className="small text-body-secondary ms-1">· {n.folio}</span>}
                                        </td>
                                        <td className="text-nowrap">{fecha(n.fecha)}</td>
                                        <td className="num">{n.dias}</td>
                                        <td className="num">{dinero(n.importe)}</td>
                                        <td className="num fw-semibold">{dinero(n.pendiente)}</td>
                                        <td>
                                            <div className="input-group input-group-sm">
                                                <span className="input-group-text">$</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className={`form-control text-end ${excede ? "is-invalid" : ""}`}
                                                    aria-label={`Monto a aplicar a ${n.nota}`}
                                                    value={monto}
                                                    onChange={(e) => cambiar(clave, e.target.value)}
                                                />
                                                <button type="button" className="btn btn-outline-secondary" onClick={() => aplicarTodo(n)}
                                                    title="Aplicar lo pendiente de la nota (hasta lo que queda del pago)">
                                                    Todo
                                                </button>
                                            </div>
                                            {excede && <div className="small text-danger">Máximo {dinero(n.disponible)}</div>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            <div className={`small mt-2 ${resto < 0 ? "text-danger fw-semibold" : "text-body-secondary"}`}>
                Aplicado {dinero(aplicado)} de {dinero(montoPago)}
                {resto < 0
                    ? ` · pasa del pago por ${dinero(-resto)}`
                    : resto > 0 && ` · ${aplicado > 0 ? "el resto, " : ""}${dinero(resto)}, se descuenta de lo más antiguo`}
            </div>
        </div>
    );
}

export default AplicarNotasPago;
