import { useState } from "react";
import LoadingButton from "../../../../shared/components/LoadingButton";
import { hoyISO } from "../../../../shared/utils/fechas";

interface NominaSemanalFormProps {
    onGuardar: (datos: { fecha_inicio: string; fecha_fin: string; observaciones: string }) => Promise<void>;
    onCancelar: () => void;
}

function sumarDias(fechaISO: string, dias: number): string {
    const fecha = new Date(`${fechaISO}T00:00:00`);
    fecha.setDate(fecha.getDate() + dias);
    return fecha.toISOString().slice(0, 10);
}

function NominaSemanalForm({ onGuardar, onCancelar }: NominaSemanalFormProps) {
    const [fechaInicio, setFechaInicio] = useState(hoyISO());
    const [fechaFin, setFechaFin] = useState(() => sumarDias(hoyISO(), 6));
    const [observaciones, setObservaciones] = useState("");
    const [guardando, setGuardando] = useState(false);

    async function guardar(e: React.FormEvent) {
        e.preventDefault();
        setGuardando(true);
        try {
            await onGuardar({ fecha_inicio: fechaInicio, fecha_fin: fechaFin, observaciones });
        } finally {
            setGuardando(false);
        }
    }

    return (
        <form onSubmit={guardar}>
            <div className="row g-3">
                <div className="col-md-6 col-sm-12">
                    <label className="form-label">Fecha de inicio</label>
                    <input
                        type="date"
                        className="form-control"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                    />
                </div>
                <div className="col-md-6 col-sm-12">
                    <label className="form-label">Fecha de fin</label>
                    <input
                        type="date"
                        className="form-control"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                    />
                </div>
                <div className="col-12">
                    <label className="form-label">Observaciones (opcional)</label>
                    <textarea
                        className="form-control"
                        rows={2}
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                    />
                </div>
            </div>
            <div className="row mt-4">
                <div className="col-12 d-flex justify-content-between">
                    <button type="button" className="btn btn-outline-secondary" onClick={onCancelar}>
                        Cancelar
                    </button>
                    {guardando ? (
                        <LoadingButton isLoading={guardando} text="Creando..." onClick={() => { }} />
                    ) : (
                        <button type="submit" className="btn btn-primary">
                            <i className="bi bi-plus-lg me-1"></i>
                            Crear nómina
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
}

export default NominaSemanalForm;
