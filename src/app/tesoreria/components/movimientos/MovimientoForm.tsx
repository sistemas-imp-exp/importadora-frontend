import { useState, useEffect, useRef } from "react";
import LoadingButton from "../../../../shared/components/LoadingButton";
import AutocompleteInput from "../../../../shared/components/AutocompleteInput";
import type { Divisa } from "../../interfaces/divisas/Divisa";
import type {
    Movimiento,
    CrearMovimientoRequest,
} from "../../interfaces/movimientos/Movimiento";
import { obtenerSiguienteFolio, obtenerSugerencias } from "../../services/movimientos.service";
import { fechaISO, hoyISO } from "../../../../shared/utils/fechas";
import SeleccionarDeudaModal, { type DeudaElegida } from "../deudas/SeleccionarDeudaModal";
import type { Deuda } from "../../interfaces/deudas/Deuda";
import { obtenerDeuda } from "../../services/deudas.service";
import { formatearDineroDivisa } from "../../utils/deudas";

interface MovimientoFormProps {
    divisas: Divisa[];
    movimiento?: Movimiento | null;
    onGuardar: (movimiento: CrearMovimientoRequest) => Promise<void>;
    onCancelar?: () => void;
}

interface MovimientoDivisaForm {
    divisa: number;
    cantidad: string;
}

/**
 * Deuda ligada al movimiento. Existente: `id` y su divisa (fija); `saldo` es lo
 * que debe, y en un abono también el tope. Nueva (solo egresos): sin `id` ni
 * divisa, se crea al guardar con la divisa del egreso.
 */
interface DeudaLigada {
    id: number | null;
    deudorId: number;
    deudor: string;
    concepto: string;
    divisa: Divisa | null;
    saldo: number | null;
}

function ligadaDe(deuda: Deuda, extra = 0): DeudaLigada {
    return {
        id: deuda.id,
        deudorId: deuda.deudor.id,
        deudor: deuda.deudor.nombre,
        concepto: deuda.concepto,
        divisa: deuda.divisa,
        saldo: Number(deuda.saldo) + extra,
    };
}

function MovimientoForm({
    divisas,
    movimiento,
    onGuardar,
    onCancelar,
}: MovimientoFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


    // ESTADO PARA CONTROLAR EL COLAPSO (Con memoria en localStorage)
    const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
        const guardado = localStorage.getItem("movimientoFormCollapsed");
        return guardado ? JSON.parse(guardado) : false;
    });

    const [form, setForm] = useState<{
        fecha: string;
        folio: string;
        tipo: "I" | "E";
        autorizo: string;
        beneficiario: string;
        concepto: string;
        divisas: MovimientoDivisaForm[];
    }>({
        fecha: hoyISO(),
        folio: "",
        tipo: "I",
        autorizo: "",
        beneficiario: "",
        concepto: "",
        divisas: [{ divisa: divisas[0]?.id ?? 0, cantidad: "" }],
    });

    const folioInputRef = useRef<HTMLInputElement | null>(null);
    const [deuda, setDeuda] = useState<DeudaLigada | null>(null);
    const [mostrarDeudas, setMostrarDeudas] = useState(false);

    // Guardar el estado en localStorage cada vez que cambie
    useEffect(() => {
        localStorage.setItem("movimientoFormCollapsed", JSON.stringify(isCollapsed));
    }, [isCollapsed]);

    useEffect(() => {
        if (movimiento) {
            setForm({
                fecha: fechaISO(movimiento.fecha),
                folio: movimiento.folio,
                tipo: movimiento.tipo,
                autorizo: movimiento.autorizo,
                beneficiario: movimiento.beneficiario,
                concepto: movimiento.concepto,
                divisas: movimiento.divisas.map((item) => ({
                    divisa: item.divisa.id,
                    cantidad: String(item.cantidad),
                })),
            });
            setIsCollapsed(false);
            setDeuda(null);
            if (movimiento.deuda) {
                // Al editar un abono, el tope es el saldo actual más lo que ya abonó este mismo ingreso.
                const propio = movimiento.cancelado || movimiento.tipo !== "I"
                    ? 0 : movimiento.divisas.reduce((acc, d) => acc + d.cantidad, 0);
                obtenerDeuda(movimiento.deuda.id)
                    .then((d) => setDeuda(ligadaDe(d, propio)))
                    .catch(() => {
                        // Sin el saldo, el backend sigue validando el tope al guardar.
                    });
            }
        } else {
            setDeuda(null);
            setForm((actual) => ({
                fecha: actual.fecha || hoyISO(),
                folio: "",
                tipo: "I",
                autorizo: "",
                beneficiario: "",
                concepto: "",
                divisas: [{ divisa: divisas[0]?.id ?? 0, cantidad: "" }],
            }));
        }
    }, [movimiento, divisas]);

    useEffect(() => {
        if (!movimiento && folioInputRef.current && !isCollapsed) {
            folioInputRef.current.focus();
        }
    }, [movimiento, isCollapsed]);

    // Sugiere el siguiente folio consecutivo según el tipo (ingreso/egreso),
    // pero el campo sigue siendo editable por si el folio físico no coincide.
    // Se aplica solo si el tipo sigue siendo el mismo cuando responde el servidor
    // (evita pisar el folio si el usuario ya cambió de tipo mientras tanto).
    function sugerirFolio(tipo: "I" | "E") {
        obtenerSiguienteFolio(tipo)
            .then((folio) => {
                setForm((current) => (current.tipo === tipo ? { ...current, folio } : current));
            })
            .catch(() => {
                // Si falla la sugerencia, se deja el folio en blanco para captura manual.
            });
    }

    useEffect(() => {
        if (movimiento) return;
        sugerirFolio(form.tipo);
    }, [form.tipo, movimiento]);

    function actualizarDivisa(index: number, field: keyof MovimientoDivisaForm, value: string) {
        setForm((current) => {
            const nuevasDivisas = [...current.divisas];
            nuevasDivisas[index] = {
                ...nuevasDivisas[index],
                [field]: field === "divisa" ? Number(value) : value,
            };
            return { ...current, divisas: nuevasDivisas };
        });
    }

    // function agregarDivisa() {
    //     setForm((current) => ({
    //         ...current,
    //         divisas: [...current.divisas, { divisa: divisas[0]?.id ?? 0, cantidad: "" }],
    //     }));
    // }

    // function eliminarDivisa(index: number) {
    //     setForm((current) => {
    //         if (current.divisas.length === 1) return current;
    //         return {
    //             ...current,
    //             divisas: current.divisas.filter((_, i) => i !== index),
    //         };
    //     });
    // }

    function seleccionarDeuda(eleccion: DeudaElegida) {
        const ligada: DeudaLigada = eleccion.tipo === "existente"
            ? ligadaDe(eleccion.deuda)
            : { id: null, deudorId: eleccion.deudor.id, deudor: eleccion.deudor.nombre, concepto: eleccion.concepto, divisa: null, saldo: null };
        setDeuda(ligada);
        // La información base de la deuda llena el movimiento; la cantidad la captura el usuario.
        setForm((actual) => ({
            ...actual,
            beneficiario: ligada.deudor,
            concepto: actual.tipo === "I" ? `Abono: ${ligada.concepto}` : ligada.concepto,
            divisas: [{ divisa: ligada.divisa?.id ?? actual.divisas[0]?.divisa ?? 0, cantidad: actual.divisas[0]?.cantidad ?? "" }],
        }));
        setMostrarDeudas(false);
    }

    function validarFormulario(): string | null {
        if (!form.fecha) return "La fecha es obligatoria.";
        if (form.fecha > hoyISO()) return "La fecha no puede ser futura.";
        if (!form.folio.trim()) return "El folio es obligatorio.";
        if (!form.autorizo.trim()) return "El nombre de quien autoriza es obligatorio.";
        if (!form.beneficiario.trim()) return "El beneficiario es obligatorio.";
        if (!form.concepto.trim()) return "El concepto es obligatorio.";
        if (form.divisas.length === 0) return "Debe agregar al menos una divisa.";

        for (const item of form.divisas) {
            if (!item.divisa || item.divisa === 0) return "Seleccione una divisa válida.";
            const cantidad = Number(item.cantidad);
            if (Number.isNaN(cantidad) || cantidad <= 0) return "Ingrese una cantidad válida mayor que cero.";
        }
        if (deuda && form.tipo === "I" && deuda.divisa && deuda.saldo !== null) {
            if (Number(form.divisas[0]?.cantidad) > deuda.saldo + 0.001) {
                return `El abono excede el saldo pendiente de la deuda (${formatearDineroDivisa(deuda.divisa.simbolo, deuda.saldo)}).`;
            }
        }
        return null;
    }

    async function guardar(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const mensajeError = validarFormulario();
        if (mensajeError) {
            setError(mensajeError);
            return;
        }

        const payload: CrearMovimientoRequest = {
            fecha: form.fecha,
            folio: form.folio.trim(),
            tipo: form.tipo,
            autorizo: form.autorizo.trim(),
            beneficiario: form.beneficiario.trim(),
            concepto: form.concepto.trim(),
            divisas: form.divisas.map((item) => ({
                divisa_id: item.divisa,
                cantidad: Number(item.cantidad),
            })),
            deuda_id: deuda?.id ?? null,
            ...(deuda && deuda.id === null ? { nueva_deuda: { deudor_id: deuda.deudorId, concepto: deuda.concepto } } : {}),
        };

        setIsLoading(true);
        try {
            await onGuardar(payload);
            limpiarFormulario();
        } catch {

        } finally {
            setIsLoading(false);
        }
    }
    function limpiarFormulario() {
        // La fecha se conserva: al pasar hojas atrasadas se capturan varias del mismo día.
        setForm((actual) => ({
            fecha: actual.fecha,
            folio: "",
            tipo: "I", // Valor por defecto
            autorizo: "",
            beneficiario: "",
            concepto: "",
            divisas: [{ divisa: divisas[0]?.id ?? 0, cantidad: "" }],
        }));
        setDeuda(null);
        setError(null);
        // El tipo siempre vuelve a "I": si ya estaba en "I" (ingresos consecutivos),
        // el useEffect que depende de form.tipo no se dispara de nuevo (mismo valor),
        // así que se pide la sugerencia explícitamente aquí para no dejar el folio vacío.
        sugerirFolio("I");
    }
    function manejarCancelacion() {
        limpiarFormulario(); // 1. Limpiamos nuestros campos
        if (onCancelar) {
            onCancelar();        // 2. Le avisamos al padre (por si el padre quiere hacer algo extra)
        }
    }
    return (
        <div className={`card card-outline card-primary mb-3 shadow-sm ${movimiento ? 'border-warning border-2' : ''} ${isCollapsed ? 'collapsed-card' : ''}`}>

            <div className={`card-header ${movimiento ? 'bg-warning-subtle' : 'bg-body-tertiary'}`}>
                <h3 className="card-title fs-6 fw-bold m-0 text-secondary">
                    <i className={`bi ${movimiento ? 'bi-pencil-square' : 'bi-journal-text'} me-2`}></i>
                    {movimiento ? (
                        <>Editando movimiento <span className="text-decoration-underline">{movimiento.folio}</span></>
                    ) : "Registrar movimiento"}
                </h3>
                <div className="card-tools">
                    <button
                        type="button"
                        className="btn btn-tool text-secondary"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        title={isCollapsed ? "Expandir" : "Colapsar"}
                    >
                        <i className={`bi fw-bold ${isCollapsed ? 'bi-plus-lg' : 'bi-dash-lg'}`}></i>
                    </button>
                </div>
            </div>

            {!isCollapsed && (
                <form onSubmit={guardar}>
                    <div className="card-body p-3 pt-0">
                        <div className="row g-2 mb-3 align-items-end">
                            <div className="col-xl-2 col-lg-2 col-md-3 col-sm-4">
                                <label className="form-label small text-muted mb-1 fw-bold" htmlFor="movimiento-fecha">
                                    Fecha
                                    {form.fecha !== hoyISO() && (
                                        <span
                                            className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle ms-1"
                                            title="Se registra con la fecha de la hoja física, no con la de hoy"
                                        >
                                            Atrasada
                                        </span>
                                    )}
                                </label>
                                <input
                                    id="movimiento-fecha"
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={form.fecha}
                                    max={hoyISO()}
                                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="col-xl-2 col-lg-2 col-md-3 col-sm-4">
                                <label className="form-label small text-muted mb-1 fw-bold">Folio</label>
                                <input
                                    ref={folioInputRef}
                                    className="form-control form-control-sm"
                                    placeholder="Ej. 001"
                                    value={form.folio}
                                    onChange={(e) => setForm({ ...form, folio: e.target.value })}
                                />
                            </div>

                            <div className="col-xl-2 col-lg-3 col-md-4 col-sm-8">
                                <label className="form-label small text-muted mb-1 fw-bold">Tipo</label>
                                <div className="btn-group w-100" role="group">
                                    <input type="radio" className="btn-check" id="btn-ingreso" autoComplete="off"
                                        checked={form.tipo === "I"} onChange={() => { setForm({ ...form, tipo: "I" }); setDeuda(null); }} />
                                    <label className="btn btn-sm btn-outline-success text-nowrap" htmlFor="btn-ingreso">
                                        <i className="bi bi-arrow-up-circle me-1"></i> Ingreso
                                    </label>

                                    <input type="radio" className="btn-check" id="btn-egreso" autoComplete="off"
                                        checked={form.tipo === "E"} onChange={() => { setForm({ ...form, tipo: "E" }); setDeuda(null); }} />
                                    <label className="btn btn-sm btn-outline-danger text-nowrap" htmlFor="btn-egreso">
                                        <i className="bi bi-arrow-down-circle me-1"></i> Egreso
                                    </label>
                                </div>
                            </div>

                            <div className="col-xl-3 col-lg-3 col-md-5 col-sm-12">
                                <label className="form-label small text-muted mb-1 fw-bold">Beneficiario</label>
                                <AutocompleteInput
                                    placeholder="Nombre del beneficiario"
                                    value={form.beneficiario}
                                    onChange={(valor) => setForm({ ...form, beneficiario: valor })}
                                    obtenerSugerencias={(q) => obtenerSugerencias("beneficiario", q)}
                                />
                            </div>

                            <div className="col-xl-2 col-lg-2 col-md-6 col-sm-12">
                                <label className="form-label small text-muted mb-1 fw-bold">Autorizó</label>
                                <AutocompleteInput
                                    placeholder="Quien autoriza"
                                    value={form.autorizo}
                                    onChange={(valor) => setForm({ ...form, autorizo: valor })}
                                    obtenerSugerencias={(q) => obtenerSugerencias("autorizo", q)}
                                />
                            </div>

                            <div className="col-xl-3 col-lg-2 col-md-6 col-sm-12">
                                <label className="form-label small text-muted mb-1 fw-bold">Concepto</label>
                                <AutocompleteInput
                                    placeholder="Motivo del movimiento"
                                    value={form.concepto}
                                    onChange={(valor) => setForm({ ...form, concepto: valor })}
                                    obtenerSugerencias={(q) => obtenerSugerencias("concepto", q)}
                                />
                            </div>
                        </div>

                        <div className="mb-3">
                            {deuda ? (
                                <div className="alert alert-info d-flex flex-wrap align-items-center gap-3 py-2 mb-0">
                                    <i className="bi bi-person-lines-fill fs-5" aria-hidden="true"></i>
                                    <div>
                                        <div className="small text-body-secondary">
                                            {form.tipo === "I" ? "Abono a deuda" : deuda.id === null ? "Cargo a nueva deuda" : "Cargo a deuda"}
                                        </div>
                                        <div className="fw-semibold">{deuda.deudor} — {deuda.concepto}</div>
                                    </div>
                                    {deuda.divisa && deuda.saldo !== null && (
                                        <div>
                                            <div className="small text-body-secondary">{form.tipo === "I" ? "Saldo pendiente" : "Debe actualmente"}</div>
                                            <div className="fw-bold">
                                                {formatearDineroDivisa(deuda.divisa.simbolo, deuda.saldo)} {deuda.divisa.codigo}
                                            </div>
                                        </div>
                                    )}
                                    <div className="ms-auto d-flex gap-2">
                                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setMostrarDeudas(true)}>
                                            Cambiar
                                        </button>
                                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setDeuda(null)}>
                                            Quitar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setMostrarDeudas(true)}>
                                    <i className="bi bi-person-lines-fill me-1" aria-hidden="true"></i>
                                    {form.tipo === "I" ? "Abono a deuda" : "Cargo a deuda"}
                                </button>
                            )}
                        </div>

                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 pt-2 border-top">
                            <div className="flex-grow-1">
                                {divisas.length === 0 ? (
                                    <div className="text-warning small mb-0">
                                        <i className="bi bi-exclamation-triangle me-1"></i> No hay divisas registradas.
                                    </div>
                                ) : (
                                    <div className="d-flex flex-column gap-2">
                                        {form.divisas.map((item, index) => (
                                            <div className="row g-2 align-items-center" key={index}>
                                                <div className="col-auto">
                                                    <select
                                                        className="form-select form-select-sm"
                                                        value={item.divisa}
                                                        disabled={!!deuda?.divisa}
                                                        title={deuda?.divisa ? "El movimiento va en la divisa de la deuda" : undefined}
                                                        onChange={(e) => actualizarDivisa(index, "divisa", e.target.value)}
                                                        style={{ minWidth: "180px" }}
                                                    >
                                                        <option value={0}>Selecciona divisa...</option>
                                                        {divisas.map((divisa) => (
                                                            <option key={divisa.id} value={divisa.id} disabled={!divisa.activa}>
                                                                {divisa.nombre} ({divisa.codigo})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-auto">
                                                    <div className="input-group input-group-sm" style={{ width: "150px" }}>
                                                        <span className="input-group-text">$</span>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            min="0"
                                                            max={deuda && form.tipo === "I" && deuda.saldo !== null ? deuda.saldo : undefined}
                                                            step="0.01"
                                                            placeholder="0.00"
                                                            value={item.cantidad}
                                                            onChange={(e) => actualizarDivisa(index, "cantidad", e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                {/* <div className="col-auto">
                                                    {index === form.divisas.length - 1 ? (
                                                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={agregarDivisa} title="Agregar otra divisa">
                                                            <i className="bi bi-plus-lg"></i>
                                                        </button>
                                                    ) : (
                                                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => eliminarDivisa(index)} title="Eliminar divisa">
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    )}
                                                </div> */}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ELIMINAMOS EL MENSAJE DE ERROR DE ESTA ZONA */}
                            <div className="d-flex gap-2">
                                <button type="button" className="btn btn-sm btn-secondary" onClick={manejarCancelacion}>
                                    {movimiento ? "Cancelar edición" : "Cancelar"}
                                </button>

                                {isLoading ? (
                                    <LoadingButton isLoading={isLoading} text="Guardando..." onClick={() => Promise.resolve()} />
                                ) : (
                                    <button type="submit" className="btn btn-sm btn-primary">
                                        <i className="bi bi-save me-1"></i> {movimiento ? "Guardar" : "Registrar"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* NUEVA ZONA: CARD FOOTER DINÁMICO */}
                    {error && (
                        <div className="card-footer bg-white border-top-0 py-2 text-danger small fw-semibold">
                            <i className="bi bi-exclamation-circle-fill me-1"></i> {error}
                        </div>
                    )}
                </form>
            )}

            <SeleccionarDeudaModal
                show={mostrarDeudas}
                modo={form.tipo === "I" ? "abono" : "cargo"}
                onClose={() => setMostrarDeudas(false)}
                onSeleccionar={seleccionarDeuda}
            />
        </div>
    );
}

export default MovimientoForm;