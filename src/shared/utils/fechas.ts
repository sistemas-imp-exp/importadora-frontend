const ZONA_HORARIA_NEGOCIO = "America/Mexico_City";

export type FormatoFecha = "numerico" | "numerico-hora" | "mes-texto" | "mes-texto-hora";

/**
 * Formatea una fecha en la zona horaria del negocio (America/Mexico_City),
 * sin importar cómo esté configurado el reloj/zona del equipo del usuario.
 *
 * Formatos disponibles:
 * - "numerico"       -> 31/07/2026            (por defecto, comportamiento actual)
 * - "numerico-hora"  -> 31/07/2026 00:00
 * - "mes-texto"      -> 31/julio/2026
 * - "mes-texto-hora" -> 31/julio/2026 00:00
 */
export function formatearFechaNumerica(
    fecha: Date | null | undefined,
    formato: FormatoFecha = "numerico"
): string {
    if (!fecha) return "";

    const conMes = formato === "mes-texto" || formato === "mes-texto-hora";
    const conHora = formato === "numerico-hora" || formato === "mes-texto-hora";

    const opciones: Intl.DateTimeFormatOptions = {
        timeZone: ZONA_HORARIA_NEGOCIO,
        day: "2-digit",
        month: conMes ? "long" : "2-digit",
        year: "numeric",
        ...(conHora ? { hour: "2-digit" as const, minute: "2-digit" as const, hour12: false } : {}),
    };

    // Se arma a mano con formatToParts() en vez de toLocaleString() para
    // controlar el separador exacto (dd/mes/yyyy) y forzar 24h sin am/pm.
    const valores = Object.fromEntries(
        new Intl.DateTimeFormat("es-MX", opciones).formatToParts(fecha).map((p) => [p.type, p.value])
    );
    const fechaTexto = `${valores.day}/${valores.month}/${valores.year}`;
    return conHora ? `${fechaTexto} ${valores.hour}:${valores.minute}` : fechaTexto;
}

/**
 * Devuelve la fecha de HOY como 'yyyy-MM-dd', fija a America/Mexico_City,
 * sin importar la zona horaria configurada en el sistema operativo del
 * usuario (antes dependía de esa configuración vía getTimezoneOffset()).
 */
export function hoyISO(): string {
    // "en-CA" da directamente el formato yyyy-MM-dd.
    return new Date().toLocaleDateString("en-CA", { timeZone: ZONA_HORARIA_NEGOCIO });
}

/**
 * 'yyyy-MM-dd' de hace N días, fija a America/Mexico_City. Útil para
 * valores por defecto de filtros de rango de fechas.
 */
export function fechaHaceNDiasISO(dias: number): string {
    const fecha = new Date();
    fecha.setUTCDate(fecha.getUTCDate() - dias);
    return fecha.toLocaleDateString("en-CA", { timeZone: ZONA_HORARIA_NEGOCIO });
}

/**
 * 'yyyy-MM-dd' de una fecha cualquiera, fija a America/Mexico_City. Útil
 * para volcar un Date (ej. la fecha de un corte) a un input type="date".
 */
export function fechaISO(fecha: Date): string {
    return fecha.toLocaleDateString("en-CA", { timeZone: ZONA_HORARIA_NEGOCIO });
}

/**
 * Primer y último día del mes actual, en 'yyyy-MM-dd', fijos a
 * America/Mexico_City. Se arma con aritmética de calendario (no restando
 * milisegundos a un Date) para no toparse con corrimientos de huso horario.
 */
export function primerYUltimoDiaDelMesActualISO(): { primerDia: string; ultimoDia: string } {
    const partes = Object.fromEntries(
        new Intl.DateTimeFormat("en-CA", {
            timeZone: ZONA_HORARIA_NEGOCIO,
            year: "numeric",
            month: "2-digit",
        }).formatToParts(new Date()).map((p) => [p.type, p.value])
    );
    const anio = Number(partes.year);
    const mes = Number(partes.month); // 1-12
    const ultimoDiaNumero = new Date(Date.UTC(anio, mes, 0)).getUTCDate(); // día 0 del mes siguiente = último día del actual
    const mesTexto = partes.month;
    const ultimoDiaTexto = String(ultimoDiaNumero).padStart(2, "0");

    return {
        primerDia: `${anio}-${mesTexto}-01`,
        ultimoDia: `${anio}-${mesTexto}-${ultimoDiaTexto}`,
    };
}
