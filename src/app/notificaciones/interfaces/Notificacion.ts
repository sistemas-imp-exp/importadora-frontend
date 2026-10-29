export interface AreaBreve {
    id: number;
    codigo: string;
    nombre: string;
}

export interface AutorNotificacion {
    id: number;
    username: string;
    nombre: string;
}

/** Aviso automático (lo genera el sistema) o mensaje escrito por alguien. */
export type TipoNotificacion = "aviso" | "mensaje";

export interface Notificacion {
    id: number;
    /** Id de la primera notificación de la conversación. */
    hilo: number;
    tipo: TipoNotificacion;
    evento: string;
    area_origen: AreaBreve;
    area_destino: AreaBreve;
    titulo: string;
    mensaje: string;
    /** Ruta del sistema relacionada (salida, cliente...). */
    enlace: string;
    creada_por: AutorNotificacion | null;
    creado: string;
    leida: boolean;
}

/** Fila del listado: la primera notificación de cada conversación. */
export interface HiloNotificacion extends Notificacion {
    respuestas: number;
    ultima_actividad: string;
    no_leidas: number;
}

export interface DetalleHilo {
    id: number;
    titulo: string;
    areas: AreaBreve[];
    mensajes: Notificacion[];
    /** Áreas desde las que el usuario puede responder (vacío: solo lectura). */
    responder_como: AreaBreve[];
}

export interface ResumenNotificaciones {
    no_leidas: number;
    recientes: Notificacion[];
    /** Trabajo pendiente por ruta del menú: { "/cartera/clientes": 3 }. */
    puntos: Record<string, number>;
}

export interface CanalDisponible {
    origen: AreaBreve;
    destino: AreaBreve;
}

export interface NuevoMensajeRequest {
    area_origen: string;
    area_destino: string;
    titulo: string;
    mensaje: string;
    enlace?: string;
}
