import { useState } from "react";
import SearchableSelect from "../../../shared/components/SearchableSelect";
import { hoyISO } from "../../../shared/utils/fechas";
import {
    TIPOS_PAGO, type ClienteCartera, type EmpresaCartera, type IngresoTesoreria, type PagoCliente,
    type PagoClienteRequest, type TipoPago,
} from "../interfaces/Cartera";
import { dinero, fecha } from "../utils/cartera";
import BotonGuardar from "./BotonGuardar";
import SelectorIngresoTesoreriaModal from "./SelectorIngresoTesoreriaModal";

interface Props {
    /** Estado inicial desde props: la vista le pone `key` para cambiar de registro. */
    pago: PagoCliente | null;
    clientes: ClienteCartera[];
    empresas: EmpresaCartera[];
    clienteInicial?: number;
    onGuardar: (datos: PagoClienteRequest) => Promise<void>;
    onCancelar: () => void;
}

// Efectivo que pudo pasar por caja: se sugiere tomarlo de Tesorería.
const SUGERIR_TESORERIA: TipoPago[] = ["AA", "E"];
// Efectivo a Tesorería: ya está registrado allá, solo se toma de su ingreso.
const SOLO_TESORERIA: TipoPago = "A";

function PagoForm({ pago, clientes, empresas, clienteInicial, onGuardar, onCancelar }: Props) {
    const [clienteId, setClienteId] = useState<number | "">(pago?.cliente?.id ?? clienteInicial ?? "");
    const [porIdentificar, setPorIdentificar] = useState(pago ? pago.por_identificar : false);
    const [empresaId, setEmpresaId] = useState<number | "">(pago?.empresa.id ?? empresas[0]?.id ?? "");
    const [tipo, setTipo] = useState<TipoPago>(pago?.tipo ?? "T");
    const [ingreso, setIngreso] = useState<IngresoTesoreria | null>(
        pago?.ingreso_tesoreria ? { ...pago.ingreso_tesoreria, monto: pago.monto } : null,
    );
    const [fechaPago, setFechaPago] = useState(pago?.fecha ?? hoyISO());
    const [monto, setMonto] = useState(pago ? String(Number(pago.monto)) : "");
    const [referencia, setReferencia] = useState(pago?.referencia ?? "");
    const [notas, setNotas] = useState(pago?.notas ?? "");
    const [mostrarIngresos, setMostrarIngresos] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function guardar(e: React.FormEvent) {
        e.preventDefault();
        if (!clienteId && !porIdentificar) return setError("Elige el cliente o marca \"Cliente por identificar\".");
        if (!empresaId) return setError("Elige la empresa.");
        if (!ingreso && tipo === SOLO_TESORERIA) {
            return setError("Un pago en efectivo a Tesorería se toma de su ingreso: usa \"Tomar de Tesorería\".");
        }
        if (!ingreso) {
            if (!fechaPago) return setError("La fecha es obligatoria.");
            if (fechaPago > hoyISO()) return setError("La fecha no puede ser futura.");
            if (!(Number(monto) > 0)) return setError("El monto debe ser mayor que cero.");
        }
        setError(null);
        setGuardando(true);
        try {
            await onGuardar({
                cliente_id: porIdentificar ? null : (clienteId as number),
                empresa_id: empresaId,
                tipo,
                referencia: referencia.trim(),
                notas: notas.trim(),
                ingreso_tesoreria_id: ingreso?.id ?? null,
                ...(ingreso ? {} : { fecha: fechaPago, monto: Number(monto) }),
            });
        } catch {
            // El toast con el mensaje del servidor lo muestra la vista.
        } finally {
            setGuardando(false);
        }
    }

    // El selector va fuera del <form>: Enter en su buscador no debe enviar el pago.
    return (
        <>
        <form onSubmit={guardar}>
            <div className="row g-3">
                <div className="col-md-8">
                    <label className="form-label" htmlFor="pago-cliente">Cliente <span className="text-danger">*</span></label>
                    {porIdentificar ? (
                        <input id="pago-cliente" className="form-control" disabled value="Por identificar" />
                    ) : (
                        <SearchableSelect
                            id="pago-cliente"
                            options={clientes.map((c) => ({ value: c.id, label: c.nombre, disabled: !c.activo }))}
                            value={clienteId}
                            onChange={setClienteId}
                            placeholder="Buscar cliente..."
                        />
                    )}
                    {!clienteInicial && (
                        <div className="form-check mt-1">
                            <input id="pago-por-identificar" type="checkbox" className="form-check-input" checked={porIdentificar}
                                onChange={(e) => setPorIdentificar(e.target.checked)} />
                            <label className="form-check-label small" htmlFor="pago-por-identificar">
                                Cliente por identificar <span className="text-body-secondary">(no baja ningún saldo hasta asignarlo)</span>
                            </label>
                        </div>
                    )}
                </div>
                <div className="col-md-4">
                    <label className="form-label" htmlFor="pago-empresa">Empresa <span className="text-danger">*</span></label>
                    <select
                        id="pago-empresa"
                        className="form-select"
                        value={empresaId}
                        onChange={(e) => setEmpresaId(e.target.value ? Number(e.target.value) : "")}
                    >
                        {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                    </select>
                </div>

                <div className="col-12">
                    <span className="form-label d-block">Tipo de pago</span>
                    <div className="btn-group flex-wrap" role="group" aria-label="Tipo de pago">
                        {TIPOS_PAGO.map((t) => (
                            <button
                                key={t.value}
                                type="button"
                                className={`btn btn-sm ${tipo === t.value ? "btn-primary" : "btn-outline-primary"}`}
                                onClick={() => setTipo(t.value)}
                                aria-pressed={tipo === t.value}
                            >
                                <span className="fw-bold me-1">{t.corto}</span>{t.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="col-12">
                    {ingreso ? (
                        <div className="alert alert-info d-flex flex-wrap align-items-center gap-3 py-2 mb-0">
                            <i className="bi bi-safe2 fs-5" aria-hidden="true"></i>
                            <div className="me-auto">
                                <div className="small text-body-secondary">Ingreso de Tesorería</div>
                                <div className="fw-semibold">
                                    Folio {ingreso.folio} · {fecha(ingreso.fecha)} · {ingreso.beneficiario}
                                </div>
                                <div className="small">{ingreso.concepto}</div>
                            </div>
                            <div className="fs-5 fw-bold">{dinero(ingreso.monto)}</div>
                            <div className="d-flex gap-2">
                                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setMostrarIngresos(true)}>
                                    Cambiar
                                </button>
                                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setIngreso(null)}>
                                    Quitar
                                </button>
                            </div>
                        </div>
                    ) : tipo === SOLO_TESORERIA ? (
                        <div className="alert alert-light border d-flex flex-wrap align-items-center gap-3 py-2 mb-0">
                            <i className="bi bi-safe2 fs-5 text-primary" aria-hidden="true"></i>
                            <div className="me-auto small">
                                El efectivo a Tesorería ya está registrado como ingreso de caja: elige ese ingreso y de ahí
                                se toman la fecha y el monto.
                            </div>
                            <button type="button" className="btn btn-primary btn-sm" onClick={() => setMostrarIngresos(true)}>
                                <i className="bi bi-safe2 me-1" aria-hidden="true"></i>Tomar de Tesorería
                            </button>
                        </div>
                    ) : (
                        <div className="row g-3 align-items-end">
                            <div className="col-md-4">
                                <label className="form-label" htmlFor="pago-fecha">Fecha <span className="text-danger">*</span></label>
                                <input
                                    id="pago-fecha"
                                    type="date"
                                    className="form-control"
                                    max={hoyISO()}
                                    value={fechaPago}
                                    onChange={(e) => setFechaPago(e.target.value)}
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label" htmlFor="pago-monto">Monto <span className="text-danger">*</span></label>
                                <div className="input-group">
                                    <span className="input-group-text">$</span>
                                    <input
                                        id="pago-monto"
                                        type="number"
                                        className="form-control"
                                        min="0"
                                        step="0.01"
                                        value={monto}
                                        onChange={(e) => setMonto(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="col-md-4">
                                <button
                                    type="button"
                                    className={`btn w-100 ${SUGERIR_TESORERIA.includes(tipo) ? "btn-outline-primary" : "btn-link"}`}
                                    onClick={() => setMostrarIngresos(true)}
                                >
                                    <i className="bi bi-safe2 me-1" aria-hidden="true"></i>Tomar de Tesorería
                                </button>
                            </div>
                            {SUGERIR_TESORERIA.includes(tipo) && (
                                <div className="col-12 form-text mt-1">
                                    Si el efectivo ya entró a la caja de Tesorería, tómalo de ahí para no capturarlo dos veces.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="col-md-6">
                    <label className="form-label" htmlFor="pago-referencia">Referencia</label>
                    <input
                        id="pago-referencia"
                        className="form-control"
                        placeholder="Banco, número de operación…"
                        value={referencia}
                        onChange={(e) => setReferencia(e.target.value)}
                    />
                </div>
                <div className="col-md-6">
                    <label className="form-label" htmlFor="pago-notas">Notas</label>
                    <input id="pago-notas" className="form-control" value={notas} onChange={(e) => setNotas(e.target.value)} />
                </div>
            </div>

            {error && <div className="alert alert-danger py-2 mt-3 mb-0">{error}</div>}
            <div className="d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-outline-secondary" onClick={onCancelar} disabled={guardando}>
                    Cancelar
                </button>
                <BotonGuardar guardando={guardando} texto={pago ? "Guardar cambios" : "Registrar pago"} />
            </div>
        </form>

            <SelectorIngresoTesoreriaModal
                show={mostrarIngresos}
                pagoId={pago?.id}
                onClose={() => setMostrarIngresos(false)}
                onElegir={(elegido) => {
                    setIngreso(elegido);
                    setMostrarIngresos(false);
                }}
            />
        </>
    );
}

export default PagoForm;
