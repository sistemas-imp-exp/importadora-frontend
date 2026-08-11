import { useEffect, useState } from "react";
import Modal from "../../../../shared/components/Modal";
import ConfirmModal from "../../../../shared/components/ConfirmModal";
import LoadingButton from "../../../../shared/components/LoadingButton";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import type { CorteCaja } from "../../interfaces/movimientos/CorteCaja";
import { cerrarCorte } from "../../services/corteCaja.service";
import { obtenerArqueos } from "../../services/arqueo.service";
import type { ArqueoDivisa } from "../../interfaces/arqueo/Arqueo";
import type { User } from "../../../../shared/interfaces/auth";
import { getFullName } from "./../../../../shared/utils/userUtils";


interface Props {
    corte: CorteCaja;
    show: boolean;
    size: string;
    user: User | null;
    onClose: () => void;
    onCerrado: (corte: CorteCaja) => void;
}

function CierreCorteModal({ corte, show, onClose, onCerrado, size, user }: Props) {
    const [arqueoPorDivisa, setArqueoPorDivisa] = useState<Record<number, ArqueoDivisa>>({});
    const [hayArqueo, setHayArqueo] = useState(true);
    const [cargandoArqueo, setCargandoArqueo] = useState(false);
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!show) return;

        let vigente = true;
        cargarArqueo();

        return () => {
            vigente = false;
        };

        async function cargarArqueo() {
            setCargandoArqueo(true);
            try {
                const arqueos = await obtenerArqueos(corte.id);
                if (!vigente) return;
                const ultimo = arqueos[0]; // el backend ya ordena por hora_termino descendente
                if (ultimo) {
                    const mapa: Record<number, ArqueoDivisa> = {};
                    for (const divisa of ultimo.divisas) {
                        mapa[divisa.divisa.id] = divisa;
                    }
                    setArqueoPorDivisa(mapa);
                    setHayArqueo(true);
                } else {
                    setArqueoPorDivisa({});
                    setHayArqueo(false);
                }
            } catch {
                if (vigente) setHayArqueo(false);
            } finally {
                if (vigente) setCargandoArqueo(false);
            }
        }
    }, [show, corte.id]);

    async function confirmarCierre() {
        setError(null);
        setGuardando(true);
        try {
            const corteActualizado = await cerrarCorte(corte.id);
            setMostrarConfirmacion(false);
            onCerrado(corteActualizado);
        } catch (err) {
            setError(obtenerMensajeError(err));
            setMostrarConfirmacion(false);
        } finally {
            setGuardando(false);
        }
    }

    return (
        <Modal title="Cierre de caja" show={show} onClose={onClose} size={size} closeDisabled={guardando}>
            {error && (
                <div className="alert alert-danger py-2">{error}</div>
            )}

            {!cargandoArqueo && !hayArqueo && (
                <div className="alert alert-warning py-2">
                    No se ha realizado el arqueo de esta caja. Puedes cerrar de todos modos, pero no habrá un físico registrado por divisa.
                </div>
            )}

            <div className="form-floating mb-3">
                <input
                    type="text"
                    className="form-control"
                    disabled={true}
                    value={user ? getFullName(user) : ""}
                />
                <label className="form-label">Responsable de cierre</label>
            </div>

            <h6 className="mb-2">Resumen por divisa</h6>
            <div className="table-responsive">
                <table className="table table-bordered align-middle">
                    <thead>
                        <tr>
                            <th>Divisa</th>
                            <th>Saldo inicial</th>
                            <th>Saldo disponible</th>
                            <th>Arqueo</th>
                            <th>Diferencia</th>
                        </tr>
                    </thead>
                    <tbody>
                        {corte.saldos.map((saldo) => {
                            const arqueoDivisa = arqueoPorDivisa[saldo.divisa.id];
                            const diff = arqueoDivisa ? Number(arqueoDivisa.diferencia) : null;
                            return (
                                <tr key={saldo.id} className="font-tabular-nums">
                                    <td>{saldo.divisa.codigo}</td>
                                    <td>{saldo.divisa.simbolo}{Number(saldo.saldo_inicial).toLocaleString("es-US")}</td>
                                    <td>{saldo.divisa.simbolo}{Number(saldo.saldo_final).toLocaleString("es-US")}</td>
                                    <td>
                                        {arqueoDivisa
                                            ? `${saldo.divisa.simbolo}${Number(arqueoDivisa.total_contado).toLocaleString("es-US")}`
                                            : "-"}
                                    </td>
                                    <td className={diff !== null && diff !== 0 ? (diff > 0 ? "text-success" : "text-danger") : ""}>
                                        {diff !== null ? diff.toFixed(2) : "-"}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="d-flex justify-content-between gap-2 mt-3">
                <button className="btn btn-outline-secondary" onClick={onClose} disabled={guardando}>
                    Cancelar
                </button>
                <LoadingButton
                    icon="bi bi-lock-fill"
                    isLoading={guardando}
                    text="Cerrar caja"
                    variant="danger"
                    onClick={() => setMostrarConfirmacion(true)}
                />
            </div>

            <ConfirmModal
                show={mostrarConfirmacion}
                onCancel={() => setMostrarConfirmacion(false)}
                onConfirm={confirmarCierre}
                isLoading={guardando}
                confirmText="Sí, cerrar caja"
                confirmVariant="danger"
            >
                <p className="mb-0">
                    {hayArqueo
                        ? "¿Confirmas cerrar la caja con los datos del arqueo actual? Esta acción no se puede deshacer."
                        : "No se ha realizado el arqueo de esta caja. ¿Confirmas cerrar sin un físico registrado? Esta acción no se puede deshacer."}
                </p>
            </ConfirmModal>
        </Modal>
    );
}

export default CierreCorteModal;
