import { useState } from "react";
import SearchableSelect from "../../../shared/components/SearchableSelect";
import { hoyISO } from "../../../shared/utils/fechas";
import type {
    AjusteCliente, AjusteClienteRequest, ClienteCartera, EmpresaCartera, Naturaleza, TraspasoRequest,
} from "../interfaces/Cartera";
import BotonGuardar from "./BotonGuardar";

export type GuardarAjuste =
    | { modo: "ajuste"; datos: AjusteClienteRequest }
    | { modo: "traspaso"; datos: TraspasoRequest };

interface Props {
    /** Estado inicial desde props: la vista le pone `key` para cambiar de registro. */
    ajuste: AjusteCliente | null;
    clientes: ClienteCartera[];
    empresas: EmpresaCartera[];
    clienteInicial?: number;
    onGuardar: (guardar: GuardarAjuste) => Promise<void>;
    onCancelar: () => void;
}

/**
 * Ajuste libre (cargo sube el saldo, abono lo baja) o traspaso de saldo entre
 * empresas (abono en el origen y cargo en el destino, en un solo paso).
 */
function AjusteForm({ ajuste, clientes, empresas, clienteInicial, onGuardar, onCancelar }: Props) {
    const [modo, setModo] = useState<"ajuste" | "traspaso">("ajuste");
    const [clienteId, setClienteId] = useState<number | "">(ajuste?.cliente.id ?? clienteInicial ?? "");
    const [empresaId, setEmpresaId] = useState<number | "">(ajuste?.empresa.id ?? empresas[0]?.id ?? "");
    const [destinoId, setDestinoId] = useState<number | "">(empresas[1]?.id ?? "");
    const [naturaleza, setNaturaleza] = useState<Naturaleza>(ajuste?.naturaleza ?? "C");
    const [concepto, setConcepto] = useState(ajuste?.concepto ?? "");
    const [fechaAjuste, setFechaAjuste] = useState(ajuste?.fecha ?? hoyISO());
    const [monto, setMonto] = useState(ajuste ? String(Number(ajuste.monto)) : "");
    const [notas, setNotas] = useState(ajuste?.notas ?? "");
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const traspaso = modo === "traspaso";

    async function guardar(e: React.FormEvent) {
        e.preventDefault();
        if (!clienteId) return setError("Elige el cliente.");
        if (!empresaId) return setError(traspaso ? "Elige la empresa de origen." : "Elige la empresa.");
        if (traspaso && (!destinoId || destinoId === empresaId)) return setError("El destino debe ser otra empresa.");
        if (!concepto.trim()) return setError("El concepto es obligatorio.");
        if (!fechaAjuste) return setError("La fecha es obligatoria.");
        if (fechaAjuste > hoyISO()) return setError("La fecha no puede ser futura.");
        if (!(Number(monto) > 0)) return setError("El monto debe ser mayor que cero.");
        setError(null);
        setGuardando(true);
        const comunes = { cliente_id: clienteId, concepto: concepto.trim(), fecha: fechaAjuste, monto: Number(monto), notas: notas.trim() };
        try {
            await onGuardar(traspaso
                ? { modo: "traspaso", datos: { ...comunes, origen_id: empresaId, destino_id: destinoId as number } }
                : { modo: "ajuste", datos: { ...comunes, empresa_id: empresaId, naturaleza } });
        } catch {
            // El toast con el mensaje del servidor lo muestra la vista.
        } finally {
            setGuardando(false);
        }
    }

    return (
        <form onSubmit={guardar}>
            {!ajuste && (
                <div className="btn-group w-100 mb-3" role="group" aria-label="Tipo de movimiento">
                    <button
                        type="button"
                        className={`btn btn-sm ${!traspaso ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setModo("ajuste")}
                        aria-pressed={!traspaso}
                    >
                        <i className="bi bi-sliders me-1" aria-hidden="true"></i>Ajuste
                    </button>
                    <button
                        type="button"
                        className={`btn btn-sm ${traspaso ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setModo("traspaso")}
                        aria-pressed={traspaso}
                    >
                        <i className="bi bi-arrow-left-right me-1" aria-hidden="true"></i>Traspaso entre empresas
                    </button>
                </div>
            )}
            <div className="row g-3">
                <div className="col-12">
                    <label className="form-label" htmlFor="ajuste-cliente">Cliente <span className="text-danger">*</span></label>
                    <SearchableSelect
                        id="ajuste-cliente"
                        options={clientes.map((c) => ({ value: c.id, label: c.nombre, disabled: !c.activo }))}
                        value={clienteId}
                        onChange={setClienteId}
                        placeholder="Buscar cliente..."
                    />
                </div>
                <div className="col-md-6">
                    <label className="form-label" htmlFor="ajuste-empresa">
                        {traspaso ? "Sale de (abono)" : "Empresa"} <span className="text-danger">*</span>
                    </label>
                    <select
                        id="ajuste-empresa"
                        className="form-select"
                        value={empresaId}
                        onChange={(e) => setEmpresaId(e.target.value ? Number(e.target.value) : "")}
                    >
                        {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                    </select>
                </div>
                {traspaso ? (
                    <div className="col-md-6">
                        <label className="form-label" htmlFor="ajuste-destino">Pasa a (cargo) <span className="text-danger">*</span></label>
                        <select
                            id="ajuste-destino"
                            className="form-select"
                            value={destinoId}
                            onChange={(e) => setDestinoId(e.target.value ? Number(e.target.value) : "")}
                        >
                            {empresas.map((e) => <option key={e.id} value={e.id} disabled={e.id === empresaId}>{e.nombre}</option>)}
                        </select>
                    </div>
                ) : (
                    <div className="col-md-6">
                        <span className="form-label d-block">Efecto en el saldo</span>
                        <div className="btn-group w-100" role="group" aria-label="Cargo o abono">
                            <button
                                type="button"
                                className={`btn btn-sm ${naturaleza === "C" ? "btn-danger" : "btn-outline-danger"}`}
                                onClick={() => setNaturaleza("C")}
                                aria-pressed={naturaleza === "C"}
                            >
                                <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>Cargo (sube)
                            </button>
                            <button
                                type="button"
                                className={`btn btn-sm ${naturaleza === "A" ? "btn-success" : "btn-outline-success"}`}
                                onClick={() => setNaturaleza("A")}
                                aria-pressed={naturaleza === "A"}
                            >
                                <i className="bi bi-dash-lg me-1" aria-hidden="true"></i>Abono (baja)
                            </button>
                        </div>
                    </div>
                )}
                <div className="col-12">
                    <label className="form-label" htmlFor="ajuste-concepto">Concepto <span className="text-danger">*</span></label>
                    <input
                        id="ajuste-concepto"
                        className="form-control"
                        placeholder={traspaso ? "Ej. Ajuste Selectos" : "Ej. Cargo por horas extras, modificación de precios…"}
                        value={concepto}
                        onChange={(e) => setConcepto(e.target.value)}
                    />
                </div>
                <div className="col-md-6">
                    <label className="form-label" htmlFor="ajuste-fecha">Fecha <span className="text-danger">*</span></label>
                    <input
                        id="ajuste-fecha"
                        type="date"
                        className="form-control"
                        max={hoyISO()}
                        value={fechaAjuste}
                        onChange={(e) => setFechaAjuste(e.target.value)}
                    />
                </div>
                <div className="col-md-6">
                    <label className="form-label" htmlFor="ajuste-monto">Monto <span className="text-danger">*</span></label>
                    <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                            id="ajuste-monto"
                            type="number"
                            className="form-control"
                            min="0"
                            step="0.01"
                            value={monto}
                            onChange={(e) => setMonto(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-12">
                    <label className="form-label" htmlFor="ajuste-notas">Notas</label>
                    <input id="ajuste-notas" className="form-control" value={notas} onChange={(e) => setNotas(e.target.value)} />
                </div>
            </div>
            {error && <div className="alert alert-danger py-2 mt-3 mb-0">{error}</div>}
            <div className="d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-outline-secondary" onClick={onCancelar} disabled={guardando}>
                    Cancelar
                </button>
                <BotonGuardar
                    guardando={guardando}
                    texto={ajuste ? "Guardar cambios" : traspaso ? "Registrar traspaso" : "Registrar ajuste"}
                />
            </div>
        </form>
    );
}

export default AjusteForm;
