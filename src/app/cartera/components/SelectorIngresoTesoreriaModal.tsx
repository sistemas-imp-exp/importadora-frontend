import { useEffect, useState } from "react";
import Modal from "../../../shared/components/Modal";
import BuscadorTabla from "../../../shared/components/BuscadorTabla";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import type { IngresoTesoreria } from "../interfaces/Cartera";
import { obtenerIngresosTesoreria } from "../services/cartera.service";
import { dinero, fecha } from "../utils/cartera";

interface Props {
    show: boolean;
    /** Al editar, el ingreso del propio pago sigue disponible. */
    pagoId?: number;
    onElegir: (ingreso: IngresoTesoreria) => void;
    onClose: () => void;
}

/**
 * Ingresos de caja de Tesorería en pesos que aún no están en ningún pago de
 * Cartera: el efectivo se toma de ahí en lugar de recapturarlo.
 */
function SelectorIngresoTesoreriaModal({ show, pagoId, onElegir, onClose }: Props) {
    // El Modal no monta su contenido cerrado: cada apertura consulta de nuevo.
    return (
        <Modal title="Tomar ingreso de Tesorería" show={show} size="modal-lg" onClose={onClose}>
            <Lista pagoId={pagoId} onElegir={onElegir} />
        </Modal>
    );
}

function Lista({ pagoId, onElegir }: Pick<Props, "pagoId" | "onElegir">) {
    const [busqueda, setBusqueda] = useState("");
    const [ingresos, setIngresos] = useState<IngresoTesoreria[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let vigente = true;
        const temporizador = setTimeout(() => {
            obtenerIngresosTesoreria({ q: busqueda.trim() || undefined, pago: pagoId })
                .then((datos) => vigente && setIngresos(datos))
                .catch((err) => vigente && setError(obtenerMensajeError(err)))
                .finally(() => vigente && setCargando(false));
        }, 250);
        return () => {
            vigente = false;
            clearTimeout(temporizador);
        };
    }, [busqueda, pagoId]);

    return (
        <>
            <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
                <BuscadorTabla valor={busqueda} onChange={setBusqueda} placeholder="Buscar por folio, beneficiario o concepto..." />
                <span className="small text-body-secondary">Ingresos en pesos sin pago de Cartera (últimos 200)</span>
            </div>
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <div className="table-responsive" style={{ maxHeight: "55vh" }}>
                <table className="table table-sm table-hover align-middle mb-0">
                    <thead className="sticky-top bg-body">
                        <tr className="small text-uppercase text-body-secondary">
                            <th>Folio</th>
                            <th>Fecha</th>
                            <th>Beneficiario</th>
                            <th>Concepto</th>
                            <th className="text-end">Monto</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cargando ? (
                            <tr><td colSpan={5} className="text-center text-muted py-4">Cargando...</td></tr>
                        ) : ingresos.length === 0 ? (
                            <tr><td colSpan={5} className="text-center text-muted py-4">No hay ingresos disponibles.</td></tr>
                        ) : (
                            ingresos.map((ingreso) => (
                                <tr key={ingreso.id} style={{ cursor: "pointer" }} onClick={() => onElegir(ingreso)}>
                                    <td className="fw-semibold">{ingreso.folio}</td>
                                    <td className="text-nowrap">{fecha(ingreso.fecha)}</td>
                                    <td>{ingreso.beneficiario}</td>
                                    <td className="small">{ingreso.concepto}</td>
                                    <td className="text-end fw-bold text-nowrap">{dinero(ingreso.monto)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}

export default SelectorIngresoTesoreriaModal;
