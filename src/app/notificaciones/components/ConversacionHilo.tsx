import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import dayjs from "../../../shared/config/dayjsConfig";
import { useAuth } from "../../../shared/hooks/useAuth";
import { formatearFechaNumerica } from "../../../shared/utils/fechas";
import type { DetalleHilo } from "../interfaces/Notificacion";
import { iconoNotificacion } from "../utils";

interface Props {
    hilo: DetalleHilo;
    onResponder: (mensaje: string, areaOrigen?: string) => Promise<void>;
}

/** Mensajes de una conversación entre dos áreas, del más antiguo al más reciente, y la respuesta. */
export default function ConversacionHilo({ hilo, onResponder }: Props) {
    const { user } = useAuth();
    const [texto, setTexto] = useState("");
    const [area, setArea] = useState(hilo.responder_como[0]?.codigo ?? "");
    const [enviando, setEnviando] = useState(false);
    // Solo rutas internas (el backend ya lo valida; aquí por si acaso).
    const enlaceCrudo = hilo.mensajes.find((m) => m.enlace)?.enlace;
    const enlace = enlaceCrudo && /^\/(?![/\\])/.test(enlaceCrudo) ? enlaceCrudo : null;

    async function responder(e: FormEvent) {
        e.preventDefault();
        setEnviando(true);
        try {
            await onResponder(texto.trim(), hilo.responder_como.length > 1 ? area : undefined);
            setTexto("");
        } catch {
            // El error ya se mostró.
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div className="card card-outline card-primary h-100">
            <div className="card-header">
                <h3 className="card-title mb-0">{hilo.titulo}</h3>
                <div className="small text-body-secondary mt-1">
                    {hilo.areas.map((a) => a.nombre).join(" ↔ ")}
                </div>
            </div>
            <div className="card-body d-flex flex-column gap-3" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                {enlace && (
                    <Link to={enlace} className="btn btn-sm btn-outline-primary align-self-start">
                        <i className="bi bi-box-arrow-up-right me-1" aria-hidden="true"></i>Ir al registro
                    </Link>
                )}
                {hilo.mensajes.map((m) => {
                    const propio = m.creada_por?.id === user?.id;
                    return (
                        <div key={m.id} className={`d-flex ${propio ? "justify-content-end" : ""}`}>
                            <div
                                className={`rounded-3 p-2 px-3 border ${propio ? "bg-primary-subtle border-primary-subtle" : "bg-body-tertiary"}`}
                                style={{ maxWidth: "85%" }}
                            >
                                <div className="small text-body-secondary mb-1 d-flex flex-wrap gap-2 align-items-center">
                                    <i className={`bi ${iconoNotificacion(m)}`} aria-hidden="true"></i>
                                    <span className="fw-semibold text-body">
                                        {m.tipo === "aviso" ? "Aviso automático" : m.creada_por?.nombre || m.creada_por?.username}
                                    </span>
                                    <span>{m.area_origen.nombre} → {m.area_destino.nombre}</span>
                                    {!m.leida && <span className="badge text-bg-danger">Nuevo</span>}
                                </div>
                                {m.mensaje && <div className="hilo-mensaje">{m.mensaje}</div>}
                                <div className="small text-body-secondary mt-1"
                                    title={formatearFechaNumerica(new Date(m.creado), "numerico-hora")}>
                                    {dayjs(m.creado).fromNow()}
                                    {m.tipo === "aviso" && m.creada_por && ` · por ${m.creada_por.username}`}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="card-footer">
                {hilo.responder_como.length === 0 ? (
                    <div className="small text-body-secondary">
                        <i className="bi bi-eye me-1" aria-hidden="true"></i>
                        Solo lectura: no tienes permiso de escritura en estas áreas.
                    </div>
                ) : (
                    <form onSubmit={responder} className="d-flex flex-column gap-2">
                        {hilo.responder_como.length > 1 && (
                            <select className="form-select form-select-sm" value={area} onChange={(e) => setArea(e.target.value)}
                                aria-label="Responder como">
                                {hilo.responder_como.map((a) => (
                                    <option key={a.codigo} value={a.codigo}>Responder como {a.nombre}</option>
                                ))}
                            </select>
                        )}
                        <textarea className="form-control" rows={2} maxLength={4000} placeholder="Escribe una respuesta..."
                            value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Respuesta" />
                        <button type="submit" className="btn btn-primary btn-sm align-self-end" disabled={enviando || !texto.trim()}>
                            <i className="bi bi-reply me-1" aria-hidden="true"></i>Responder
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
