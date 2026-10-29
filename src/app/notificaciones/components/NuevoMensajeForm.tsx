import { useState, type FormEvent } from "react";
import type { CanalDisponible, NuevoMensajeRequest } from "../interfaces/Notificacion";

interface Props {
    canales: CanalDisponible[];
    onEnviar: (datos: NuevoMensajeRequest) => Promise<void>;
    onCancelar: () => void;
}

const clave = (c: CanalDisponible) => `${c.origen.codigo}>${c.destino.codigo}`;

export default function NuevoMensajeForm({ canales, onEnviar, onCancelar }: Props) {
    const [canal, setCanal] = useState(canales[0] ? clave(canales[0]) : "");
    const [titulo, setTitulo] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [enviando, setEnviando] = useState(false);

    async function enviar(e: FormEvent) {
        e.preventDefault();
        const elegido = canales.find((c) => clave(c) === canal);
        if (!elegido) return;
        setEnviando(true);
        try {
            await onEnviar({
                area_origen: elegido.origen.codigo,
                area_destino: elegido.destino.codigo,
                titulo: titulo.trim(),
                mensaje: mensaje.trim(),
            });
        } catch {
            // El error ya se mostró; se queda el formulario para corregir.
        } finally {
            setEnviando(false);
        }
    }

    return (
        <form onSubmit={enviar}>
            <div className="modal-body">
                <div className="mb-3">
                    <label className="form-label" htmlFor="mensaje-canal">De → Para</label>
                    <select id="mensaje-canal" className="form-select" value={canal} onChange={(e) => setCanal(e.target.value)}>
                        {canales.map((c) => (
                            <option key={clave(c)} value={clave(c)}>
                                {c.origen.nombre} → {c.destino.nombre}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="mb-3">
                    <label className="form-label" htmlFor="mensaje-titulo">Asunto</label>
                    <input id="mensaje-titulo" className="form-control" maxLength={150} required value={titulo}
                        placeholder="Ej. Nota 512 de Cabeza de Toro" onChange={(e) => setTitulo(e.target.value)} />
                </div>
                <div>
                    <label className="form-label" htmlFor="mensaje-texto">Mensaje</label>
                    <textarea id="mensaje-texto" className="form-control" rows={5} maxLength={4000} required value={mensaje}
                        onChange={(e) => setMensaje(e.target.value)} />
                </div>
            </div>
            <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={onCancelar}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={enviando || !titulo.trim() || !mensaje.trim()}>
                    {enviando ? <span className="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                        : <i className="bi bi-send me-1" aria-hidden="true"></i>}
                    Enviar
                </button>
            </div>
        </form>
    );
}
