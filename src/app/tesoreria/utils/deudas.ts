/** Importe con el símbolo de su divisa y dos decimales, p. ej. "US$1,250.00". */
export function formatearDineroDivisa(simbolo: string, valor: string | number): string {
    return `${simbolo}${Number(valor).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** 'YYYY-MM-DD' a Date al mediodía local, para formatear sin corrimiento de día. */
export function fechaDeISO(iso: string): Date {
    return new Date(iso + "T12:00:00");
}

export function rutaDetalleDeuda(id: number): string {
    return `/tesoreria/deudas/detalle/${id}`;
}
