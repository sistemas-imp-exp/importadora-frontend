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
    const [error, setError] = useState<string | null>(null);

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

    function validarFormulario(): string | null {
        if (!form.nombre.trim()) return "El nombre es obligatorio.";
        if (!form.rancho_id) return "Selecciona un rancho.";
        if (!form.puesto_id) return "Selecciona un puesto.";
        // El salario base es opcional: se puede dejar en 0 o vacío y definirse
        // después, por semana, en Nómina semanal.
        if (form.salario_diario.trim()) {
            const salario = Number(form.salario_diario);
            if (Number.isNaN(salario) || salario < 0) {
                return "El salario diario no puede ser negativo.";
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

        setIsLoading(true);
        try {
            // salario_diario es un DecimalField obligatorio en el backend (sin
            // default): acepta 0, pero no una cadena vacía. Si se deja en
            // blanco, se manda "0" explícito para que la API no lo rechace.
            await onGuardar({
                ...form,
                salario_diario: form.salario_diario.trim() || "0",
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={guardar}>
            <div className="d-flex align-items-baseline justify-content-between">
                <div className="form-section-label">Datos del empleado</div>
                <p className="text-muted small mb-2">* Campos obligatorios</p>
            </div>
            <div className="row g-3 mb-4">
                <div className="col-md-6 col-sm-12">
                    <label className="form-label">Nombre <span className="text-danger">*</span></label>
                    <input
                        ref={nombreInputRef}
                        className="form-control"
                        value={form.nombre}
                        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    />
                </div>

                <div className="col-md-3 col-sm-12">
                    <label className="form-label">Rancho <span className="text-danger">*</span></label>
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
                    <label className="form-label">Puesto <span className="text-danger">*</span></label>
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
            </div>

            <div className="form-section-label">Datos bancarios</div>
            <div className="row g-3 mb-4">
                <div className="col-md-4 col-sm-12">
                    <label className="form-label">Número de cuenta</label>
                    <input
                        className="form-control"
                        value={form.numero_cuenta}
                        onChange={(e) => setForm({ ...form, numero_cuenta: e.target.value })}
                    />
                </div>

                <div className="col-md-4 col-sm-12">
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
            </div>

            {error && (
                <div className="alert alert-danger py-2 small mb-3" role="alert">
                    <i className="bi bi-exclamation-circle-fill me-1"></i>
                    {error}
                </div>
            )}

            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 pt-3 border-top">
                <div className="form-check">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        id="empleado-activo"
                        checked={form.activo}
                        onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="empleado-activo">Activo</label>
                </div>

                <div className="d-flex gap-2">
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
