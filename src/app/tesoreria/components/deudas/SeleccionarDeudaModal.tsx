import { useEffect, useMemo, useState } from "react";
import Modal from "../../../../shared/components/Modal";
import BuscadorTabla from "../../../../shared/components/BuscadorTabla";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { TIPOS_DEUDOR, type Deuda, type Deudor } from "../../interfaces/deudas/Deuda";
import { obtenerDeudas, obtenerDeudores } from "../../services/deudas.service";
import { fechaDeISO, formatearDineroDivisa } from "../../utils/deudas";

interface Props {
    show: boolean;
    onClose: () => void;
    onSeleccionar: (deuda: Deuda) => void;
}

/**
 * Paso 1: buscar a la persona (solo deudores con deudas abiertas).
 * Paso 2: elegir una de sus deudas abiertas.
 */
function SeleccionarDeudaModal({ show, onClose, onSeleccionar }: Props) {
    // El Modal no monta su contenido cerrado: cada apertura empieza de cero.
    return (
        <Modal title="Abono a deuda" show={show} size="modal-lg" onClose={onClose}>
            <Selector onSeleccionar={onSeleccionar} />
        </Modal>
    );
}

function Selector({ onSeleccionar }: Pick<Props, "onSeleccionar">) {
    const [deudores, setDeudores] = useState<Deudor[]>([]);
    const [busqueda, setBusqueda] = useState("");
    const [deudor, setDeudor] = useState<Deudor | null>(null);
    const [deudas, setDeudas] = useState<Deuda[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        obtenerDeudores({ con_deuda_abierta: true })
            .then(setDeudores)
            .catch((err) => setError(obtenerMensajeError(err)))
            .finally(() => setCargando(false));
    }, []);

    async function elegirDeudor(elegido: Deudor) {
        setDeudor(elegido);
        setDeudas([]);
        setError(null);
        setCargando(true);
        try {
            setDeudas(await obtenerDeudas({ deudor: elegido.id, estado: "abierta" }));
        } catch (err) {
            setError(obtenerMensajeError(err));
        } finally {
            setCargando(false);
        }
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
                    <p className="text-body-secondary small mb-2">1. Busca a la persona que abona.</p>
                    <BuscadorTabla valor={busqueda} onChange={setBusqueda} placeholder="Nombre del deudor..." />
                    <div className="list-group mt-3" style={{ maxHeight: "50vh", overflowY: "auto" }}>
                        {cargando ? (
                            <div className="list-group-item text-body-secondary">Cargando...</div>
                        ) : filtrados.length === 0 ? (
                            <div className="list-group-item text-body-secondary">
                                {deudores.length === 0 ? "Nadie tiene deudas abiertas." : "Ningún deudor coincide con la búsqueda."}
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
                                    <span className="badge border bg-warning-subtle text-warning-emphasis border-warning-subtle">
                                        {d.deudas_abiertas} {d.deudas_abiertas === 1 ? "deuda abierta" : "deudas abiertas"}
                                    </span>
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
                        <span className="text-body-secondary small">2. Elige la deuda de <strong>{deudor.nombre}</strong>.</span>
                    </div>
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
                                    onClick={() => onSeleccionar(d)}
                                >
                                    <div className="d-flex justify-content-between gap-2">
                                        <span className="fw-semibold">{d.concepto}</span>
                                        <span className="fw-bold text-nowrap">
                                            Saldo {formatearDineroDivisa(d.divisa.simbolo, d.saldo)} {d.divisa.codigo}
                                        </span>
                                    </div>
                                    <div className="small text-body-secondary">
                                        {formatearFechaNumerica(fechaDeISO(d.fecha))} · Monto {formatearDineroDivisa(d.divisa.simbolo, d.monto)} ·
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
