import { useEffect, useRef, useState } from "react";
import LoadingButton from "../../../../shared/components/LoadingButton";
import type { Empleado, EmpleadoRequest } from "../../interfaces/nomina/Empleado";
import type { Rancho } from "../../interfaces/nomina/Rancho";
import type { Puesto } from "../../interfaces/nomina/Puesto";
import type { Banco } from "../../interfaces/nomina/Banco";

interface EmpleadoFormProps {
    onGuardar: (empleado: EmpleadoRequest) => Promise<void>;
    onCancelar: () => void;
    empleado: Empleado | null;
    ranchos: Rancho[];
    puestos: Puesto[];
    bancos: Banco[];
}

function EmpleadoForm({ onGuardar, onCancelar, empleado, ranchos, puestos, bancos }: EmpleadoFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    const [form, setForm] = useState<EmpleadoRequest>({
        id: 0,
        rancho_id: ranchos[0]?.id ?? 0,
        puesto_id: puestos[0]?.id ?? 0,
        nombre: "",
        salario_diario: "",
        numero_cuenta: "",
        banco_id: null,
        nombre_cuenta: "",
        activo: true
    });
    const nombreInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (empleado) {
            setForm({
                id: empleado.id,
                rancho_id: empleado.rancho.id,
                puesto_id: empleado.puesto.id,
                nombre: empleado.nombre,
                salario_diario: empleado.salario_diario,
                numero_cuenta: empleado.numero_cuenta,
                banco_id: empleado.banco?.id ?? null,
                nombre_cuenta: empleado.nombre_cuenta,
                activo: empleado.activo
            });
        } else {
            setForm({
                id: 0,
                rancho_id: ranchos[0]?.id ?? 0,
                puesto_id: puestos[0]?.id ?? 0,
                nombre: "",
                salario_diario: "",
                numero_cuenta: "",
                banco_id: null,
                nombre_cuenta: "",
                activo: true
            });
        }

        if (!empleado && nombreInputRef.current) {
            nombreInputRef.current.focus();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [empleado]);

    async function guardar(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);

        try {
            await onGuardar(form);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={guardar}>
            <div className="row g-3">
                <div className="col-md-6 col-sm-12">
                    <label className="form-label">Nombre</label>
                    <input
                        ref={nombreInputRef}
                        className="form-control"
                        value={form.nombre}
                        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    />
                </div>

                <div className="col-md-3 col-sm-12">
                    <label className="form-label">Rancho</label>
                    <select
                        className="form-select"
                        value={form.rancho_id}
                        onChange={(e) => setForm({ ...form, rancho_id: Number(e.target.value) })}
                    >
                        {ranchos.map((rancho) => (
                            <option key={rancho.id} value={rancho.id}>
                                {rancho.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="col-md-3 col-sm-12">
                    <label className="form-label">Puesto</label>
                    <select
                        className="form-select"
                        value={form.puesto_id}
                        onChange={(e) => setForm({ ...form, puesto_id: Number(e.target.value) })}
                    >
                        {puestos.map((puesto) => (
                            <option key={puesto.id} value={puesto.id}>
                                {puesto.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="col-md-4 col-sm-12">
                    <label className="form-label">Salario diario</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-control"
                        value={form.salario_diario}
                        onChange={(e) => setForm({ ...form, salario_diario: e.target.value })}
                    />
                </div>

                <div className="col-md-3 col-sm-12">
                    <label className="form-label">Número de cuenta</label>
                    <input
                        className="form-control"
                        value={form.numero_cuenta}
                        onChange={(e) => setForm({ ...form, numero_cuenta: e.target.value })}
                    />
                </div>

                <div className="col-md-3 col-sm-12">
                    <label className="form-label">Banco</label>
                    <select
                        className="form-select"
                        value={form.banco_id ?? ""}
                        onChange={(e) => setForm({ ...form, banco_id: e.target.value ? Number(e.target.value) : null })}
                    >
                        <option value="">Sin banco</option>
                        {bancos.map((banco) => (
                            <option key={banco.id} value={banco.id}>
                                {banco.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="col-md-4 col-sm-12">
                    <label className="form-label">Nombre de la cuenta</label>
                    <input
                        className="form-control"
                        value={form.nombre_cuenta}
                        onChange={(e) => setForm({ ...form, nombre_cuenta: e.target.value })}
                    />
                </div>

                <div className="col-md-2 d-flex align-items-end">
                    <div className="form-check mt-3">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            checked={form.activo}
                            onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                        />
                        <label className="form-check-label">Activo</label>
                    </div>
                </div>
            </div>
            <div className="row mt-4">
                <div className="col-12 d-flex justify-content-between">
                    <button type="button" className="btn btn-outline-secondary" onClick={onCancelar}>
                        Cancelar
                    </button>
                    {isLoading ? (
                        <LoadingButton isLoading={isLoading} text="Guardar" onClick={() => { }} />
                    ) : (
                        <button type="submit" className="btn btn-primary">
                            <i className="bi bi-plus-lg me-1"></i>
                            {form.id === 0 ? "Registrar empleado" : "Guardar cambios"}
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
}

export default EmpleadoForm;
