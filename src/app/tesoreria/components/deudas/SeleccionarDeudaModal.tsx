import { useEffect, useMemo, useState } from "react";
import Modal from "../../../../shared/components/Modal";
import BuscadorTabla from "../../../../shared/components/BuscadorTabla";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { TIPOS_DEUDOR, type Deuda, type Deudor, type TipoDeudor } from "../../interfaces/deudas/Deuda";
import { crearDeudor, obtenerDeudas, obtenerDeudores } from "../../services/deudas.service";
import { fechaDeISO, formatearDineroDivisa } from "../../utils/deudas";

/** "abono": un ingreso que paga una deuda; "cargo": un egreso que la aumenta o la crea. */
export type ModoDeuda = "abono" | "cargo";

export type DeudaElegida =
    | { tipo: "existente"; deuda: Deuda }
    | { tipo: "nueva"; deudor: Deudor; concepto: string };

interface Props {
    show: boolean;
    modo: ModoDeuda;
    onClose: () => void;
    onSeleccionar: (eleccion: DeudaElegida) => void;
}

/**
 * Paso 1: buscar a la persona. En abono, solo quien tiene deudas abiertas; en
 * cargo, cualquier deudor activo, o darlo de alta ahí mismo.
 * Paso 2: elegir una de sus deudas abiertas o, en cargo, abrir una nueva.
 */
function SeleccionarDeudaModal({ show, modo, onClose, onSeleccionar }: Props) {
    // El Modal no monta su contenido cerrado: cada apertura empieza de cero.
    return (
        <Modal title={modo === "abono" ? "Abono a deuda" : "Cargo a deuda"} show={show} size="modal-lg" onClose={onClose}>
            <Selector modo={modo} onSeleccionar={onSeleccionar} />
        </Modal>
    );
}

function Selector({ modo, onSeleccionar }: Pick<Props, "modo" | "onSeleccionar">) {
    const cargo = modo === "cargo";
    const [deudores, setDeudores] = useState<Deudor[]>([]);
    const [busqueda, setBusqueda] = useState("");
    const [deudor, setDeudor] = useState<Deudor | null>(null);
    const [deudas, setDeudas] = useState<Deuda[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [altaDeudor, setAltaDeudor] = useState<{ nombre: string; tipo: TipoDeudor } | null>(null);
    const [conceptoNueva, setConceptoNueva] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        obtenerDeudores(cargo ? { activo: true } : { con_deuda_abierta: true })
            .then(setDeudores)
            .catch((err) => setError(obtenerMensajeError(err)))
            .finally(() => setCargando(false));
    }, [cargo]);

    async function elegirDeudor(elegido: Deudor) {
        setDeudor(elegido);
        setDeudas([]);
        setError(null);
        setConceptoNueva(null);
        setCargando(true);
        try {
            const abiertas = await obtenerDeudas({ deudor: elegido.id, estado: "abierta" });
            setDeudas(abiertas);
            // Sin deudas abiertas, en cargo lo único posible es una nueva.
            if (cargo && abiertas.length === 0) setConceptoNueva("");
        } catch (err) {
            setError(obtenerMensajeError(err));
        } finally {
            setCargando(false);
        }
    }

    async function registrarDeudor() {
        if (!altaDeudor?.nombre.trim()) {
            setError("Escribe el nombre de la persona.");
            return;
        }
        setGuardando(true);
        setError(null);
        try {
            const nuevo = await crearDeudor({ nombre: altaDeudor.nombre.trim(), tipo: altaDeudor.tipo, telefono: "", notas: "", activo: true });
            setDeudores((actuales) => [...actuales, nuevo]);
            setAltaDeudor(null);
            setDeudor(nuevo);
            setDeudas([]);
            setConceptoNueva("");
        } catch (err) {
            setError(obtenerMensajeError(err));
        } finally {
            setGuardando(false);
        }
    }

    function confirmarNueva() {
        if (!deudor) return;
        if (!conceptoNueva?.trim()) {
            setError("Escribe el concepto de la nueva deuda.");
            return;
        }
        onSeleccionar({ tipo: "nueva", deudor, concepto: conceptoNueva.trim() });
    }

    const filtrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();
        return termino ? deudores.filter((d) => d.nombre.toLowerCase().includes(termino)) : deudores;
    }, [deudores, busqueda]);

    return (
        <>
            {error && <div className="alert alert-danger py-2">{error}</div>}

            {!deudor ? (
                <>
                    <p className="text-body-secondary small mb-2">
                        1. Busca a la persona {cargo ? "a la que se le entrega el dinero" : "que abona"}.
                    </p>
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                        <BuscadorTabla valor={busqueda} onChange={setBusqueda} placeholder="Nombre del deudor..." />
                        {cargo && !altaDeudor && (
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-success"
                                onClick={() => setAltaDeudor({ nombre: busqueda.trim(), tipo: "E" })}
                            >
                                <i className="bi bi-person-plus me-1" aria-hidden="true"></i>Nueva persona
                            </button>
                        )}
                    </div>

                    {altaDeudor && (
                        <div className="border rounded p-3 mt-3 bg-body-tertiary">
                            <div className="row g-2 align-items-end">
                                <div className="col-md-6">
                                    <label className="form-label small mb-1" htmlFor="alta-deudor-nombre">Nombre</label>
                                    <input
                                        id="alta-deudor-nombre"
                                        className="form-control form-control-sm"
                                        autoFocus
                                        value={altaDeudor.nombre}
                                        onChange={(e) => setAltaDeudor({ ...altaDeudor, nombre: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label small mb-1" htmlFor="alta-deudor-tipo">Tipo</label>
                                    <select
                                        id="alta-deudor-tipo"
                                        className="form-select form-select-sm"
                                        value={altaDeudor.tipo}
                                        onChange={(e) => setAltaDeudor({ ...altaDeudor, tipo: e.target.value as TipoDeudor })}
                                    >
                                        {Object.entries(TIPOS_DEUDOR).map(([valor, etiqueta]) => (
                                            <option key={valor} value={valor}>{etiqueta}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-3 d-flex gap-2">
                                    <button type="button" className="btn btn-sm btn-success flex-grow-1" onClick={registrarDeudor} disabled={guardando}>
                                        {guardando ? "Guardando..." : "Registrar"}
                                    </button>
                                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setAltaDeudor(null)} disabled={guardando}>
                                        <i className="bi bi-x-lg" aria-hidden="true"></i>
                                        <span className="visually-hidden">Cancelar alta</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="list-group mt-3" style={{ maxHeight: "50vh", overflowY: "auto" }}>
                        {cargando ? (
                            <div className="list-group-item text-body-secondary">Cargando...</div>
                        ) : filtrados.length === 0 ? (
                            <div className="list-group-item text-body-secondary">
                                {deudores.length === 0
                                    ? cargo ? "No hay deudores registrados: usa «Nueva persona»." : "Nadie tiene deudas abiertas."
                                    : "Ningún deudor coincide con la búsqueda."}
                            </div>
                        ) : (
                            filtrados.map((d) => (
                                <button
                                    key={d.id}
                                    type="button"
                                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                                    onClick={() => elegirDeudor(d)}
                                >
                                    <span>
                                        <span className="fw-semibold">{d.nombre}</span>
                                        <span className="text-body-secondary small ms-2">{TIPOS_DEUDOR[d.tipo]}</span>
                                    </span>
                                    {d.deudas_abiertas > 0 ? (
                                        <span className="badge border bg-warning-subtle text-warning-emphasis border-warning-subtle">
                                            {d.deudas_abiertas} {d.deudas_abiertas === 1 ? "deuda abierta" : "deudas abiertas"}
                                        </span>
                                    ) : (
                                        <span className="badge border bg-light text-body-secondary">Sin deudas abiertas</span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </>
            ) : (
                <>
                    <div className="d-flex align-items-center gap-2 mb-2">
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setDeudor(null)}>
                            <i className="bi bi-arrow-left me-1" aria-hidden="true"></i>Otra persona
                        </button>
                        <span className="text-body-secondary small">
                            2. {cargo ? "Aumenta una deuda de" : "Elige la deuda de"} <strong>{deudor.nombre}</strong>
                            {cargo && " o abre una nueva"}.
                        </span>
                    </div>

                    {cargo && (
                        conceptoNueva === null ? (
                            <button type="button" className="btn btn-sm btn-outline-success mb-2" onClick={() => setConceptoNueva("")}>
                                <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>Nueva deuda
                            </button>
                        ) : (
                            <div className="border rounded p-3 mb-3 bg-body-tertiary">
                                <label className="form-label small mb-1" htmlFor="concepto-nueva-deuda">Concepto de la nueva deuda</label>
                                <div className="d-flex gap-2">
                                    <input
                                        id="concepto-nueva-deuda"
                                        className="form-control form-control-sm"
                                        placeholder="Ej. Préstamo personal"
                                        autoFocus
                                        value={conceptoNueva}
                                        onChange={(e) => setConceptoNueva(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && confirmarNueva()}
                                    />
                                    <button type="button" className="btn btn-sm btn-success text-nowrap" onClick={confirmarNueva}>
                                        Usar nueva deuda
                                    </button>
                                </div>
                                <div className="form-text">La divisa y la fecha serán las del egreso.</div>
                            </div>
                        )
                    )}

                    <div className="list-group" style={{ maxHeight: "50vh", overflowY: "auto" }}>
                        {cargando ? (
                            <div className="list-group-item text-body-secondary">Cargando...</div>
                        ) : deudas.length === 0 ? (
                            <div className="list-group-item text-body-secondary">Sin deudas abiertas.</div>
                        ) : (
                            deudas.map((d) => (
                                <button
                                    key={d.id}
                                    type="button"
                                    className="list-group-item list-group-item-action"
                                    onClick={() => onSeleccionar({ tipo: "existente", deuda: d })}
                                >
                                    <div className="d-flex justify-content-between gap-2">
                                        <span className="fw-semibold">{d.concepto}</span>
                                        <span className="fw-bold text-nowrap">
                                            Saldo {formatearDineroDivisa(d.divisa.simbolo, d.saldo)} {d.divisa.codigo}
                                        </span>
                                    </div>
                                    <div className="small text-body-secondary">
                                        {formatearFechaNumerica(fechaDeISO(d.fecha))} · Total {formatearDineroDivisa(d.divisa.simbolo, d.total)} ·
                                        Abonado {formatearDineroDivisa(d.divisa.simbolo, d.abonado)}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </>
            )}
        </>
    );
}

export default SeleccionarDeudaModal;
