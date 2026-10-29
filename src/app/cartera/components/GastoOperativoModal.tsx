import { useEffect, useState } from "react";
import Modal from "../../../shared/components/Modal";
import CampoNumero from "../../../shared/components/CampoNumero";
import LoadingButton from "../../../shared/components/LoadingButton";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import { crearGastoOperativo, obtenerGastosOperativos, type GastoOperativo } from "../services/cartera.service";
import { fecha } from "../utils/cartera";

interface Props {
    editable: boolean;
    onCerrar: () => void;
    /** Se agregó una vigencia: hay que recalcular la utilidad. */
    onCambio: () => void;
}

/**
 * Gasto operativo por kilo vendido (hoy $4/kg). Un cambio vale desde su fecha:
 * los meses anteriores conservan el gasto con el que se calcularon.
 */
function GastoOperativoModal({ editable, onCerrar, onCambio }: Props) {
    const [vigencias, setVigencias] = useState<GastoOperativo[] | null>(null);
    const [porKilo, setPorKilo] = useState("");
    const [desde, setDesde] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        let vigente = true;
        obtenerGastosOperativos()
            .then((datos) => vigente && setVigencias(datos))
            .catch((e) => vigente && setError(obtenerMensajeError(e)));
        return () => { vigente = false; };
    }, []);

    async function guardar() {
        if (!(Number(porKilo) >= 0) || porKilo === "") return setError("Captura el gasto por kilo.");
        if (!desde) return setError("Indica desde qué fecha aplica.");
        setGuardando(true);
        try {
            const nuevo = await crearGastoOperativo({ por_kilo: Number(porKilo), vigente_desde: desde });
            setVigencias((a) => [nuevo, ...(a ?? [])].sort((x, y) => y.vigente_desde.localeCompare(x.vigente_desde)));
            setPorKilo("");
            setDesde("");
            setError(null);
            onCambio();
        } catch (e) {
            setError(obtenerMensajeError(e));
        } finally {
            setGuardando(false);
        }
    }

    return (
        <Modal show onClose={onCerrar} title="Gasto operativo por kilo">
            <p className="small text-body-secondary">
                Se resta a la utilidad bruta: kilos vendidos × gasto vigente en la fecha de la venta.
            </p>
            <table className="table table-sm mb-3">
                <thead>
                    <tr className="small text-uppercase text-body-secondary">
                        <th>Vigente desde</th>
                        <th className="text-end">$/kg</th>
                        <th>Registró</th>
                    </tr>
                </thead>
                <tbody>
                    {(vigencias ?? []).map((g) => (
                        <tr key={g.id}>
                            <td>{fecha(g.vigente_desde)}</td>
                            <td className="text-end fw-semibold">${Number(g.por_kilo).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                            <td className="small">{g.usuario ?? "—"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {editable && (
                <div className="border-top pt-3">
                    <div className="small fw-semibold text-uppercase text-body-secondary mb-2">Cambiar a partir de una fecha</div>
                    <div className="row g-2 align-items-end">
                        <div className="col-6">
                            <label className="form-label small mb-1" htmlFor="gasto-kilo">$/kg</label>
                            <CampoNumero id="gasto-kilo" decimales={4} className="form-control form-control-sm text-end"
                                value={porKilo} onChange={setPorKilo} />
                        </div>
                        <div className="col-6">
                            <label className="form-label small mb-1" htmlFor="gasto-desde">Desde</label>
                            <input id="gasto-desde" type="date" className="form-control form-control-sm" value={desde}
                                onChange={(e) => setDesde(e.target.value)} />
                        </div>
                    </div>
                    <div className="d-flex justify-content-end mt-3">
                        {guardando ? (
                            <LoadingButton isLoading text="Guardando..." onClick={() => Promise.resolve()} />
                        ) : (
                            <button type="button" className="btn btn-primary btn-sm" onClick={guardar}>Guardar</button>
                        )}
                    </div>
                </div>
            )}
            {error && <div className="text-danger small fw-semibold mt-2">{error}</div>}
        </Modal>
    );
}

export default GastoOperativoModal;
