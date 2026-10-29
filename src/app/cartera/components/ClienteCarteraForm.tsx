import { useState } from "react";
import BotonGuardar from "./BotonGuardar";
import type { ClienteCartera, ClienteCarteraRequest } from "../interfaces/Cartera";

interface Props {
    /** Estado inicial desde props: la vista le pone `key` para cambiar de registro. */
    cliente: ClienteCartera | null;
    onGuardar: (datos: ClienteCarteraRequest) => Promise<void>;
    onCancelar: () => void;
}

function ClienteCarteraForm({ cliente, onGuardar, onCancelar }: Props) {
    const [form, setForm] = useState<ClienteCarteraRequest>({
        nombre: cliente?.nombre ?? "",
        activo: cliente?.activo ?? true,
        celular: cliente?.celular ?? "",
        pagare: cliente?.pagare ?? false,
        notas: cliente?.notas ?? "",
    });
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function guardar(e: React.FormEvent) {
        e.preventDefault();
        if (!form.nombre.trim()) {
            setError("El nombre es obligatorio.");
            return;
        }
        setError(null);
        setGuardando(true);
        try {
            await onGuardar({ ...form, nombre: form.nombre.trim(), celular: form.celular.trim() });
        } catch {
            // El toast con el mensaje del servidor lo muestra la vista.
        } finally {
            setGuardando(false);
        }
    }

    return (
        <form onSubmit={guardar}>
            <div className="row g-3">
                <div className="col-12">
                    <label className="form-label" htmlFor="cliente-nombre">Nombre <span className="text-danger">*</span></label>
                    <input
                        id="cliente-nombre"
                        className="form-control text-uppercase"
                        value={form.nombre}
                        autoFocus
                        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    />
                    <div className="form-text">Es el mismo catálogo de clientes de Inventario.</div>
                </div>
                <div className="col-md-8">
                    <label className="form-label" htmlFor="cliente-celular">Celular</label>
                    <input
                        id="cliente-celular"
                        className="form-control"
                        value={form.celular}
                        placeholder="Uno o varios números"
                        onChange={(e) => setForm({ ...form, celular: e.target.value })}
                    />
                </div>
                <div className="col-md-4 d-flex flex-column justify-content-end gap-1">
                    <div className="form-check">
                        <input
                            id="cliente-pagare"
                            type="checkbox"
                            className="form-check-input"
                            checked={form.pagare}
                            onChange={(e) => setForm({ ...form, pagare: e.target.checked })}
                        />
                        <label className="form-check-label" htmlFor="cliente-pagare">Firmó pagaré</label>
                    </div>
                    <div className="form-check">
                        <input
                            id="cliente-activo"
                            type="checkbox"
                            className="form-check-input"
                            checked={form.activo}
                            onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                        />
                        <label className="form-check-label" htmlFor="cliente-activo">Activo</label>
                    </div>
                </div>
                <div className="col-12">
                    <label className="form-label" htmlFor="cliente-notas">Notas</label>
                    <textarea
                        id="cliente-notas"
                        className="form-control"
                        rows={3}
                        value={form.notas}
                        onChange={(e) => setForm({ ...form, notas: e.target.value })}
                    />
                </div>
            </div>
            {error && <div className="alert alert-danger py-2 mt-3 mb-0">{error}</div>}
            <div className="d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-outline-secondary" onClick={onCancelar} disabled={guardando}>
                    Cancelar
                </button>
                <BotonGuardar guardando={guardando} texto={cliente ? "Guardar cambios" : "Registrar cliente"} />
            </div>
        </form>
    );
}

export default ClienteCarteraForm;
