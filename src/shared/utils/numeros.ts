/**
 * Kilos y precios por kilo como los guarda el backend: kilos hasta 3 decimales
 * (cajas de 20 lb = 9.072 kg) y precio por kilo hasta 4. Siempre al menos 2
 * y sin ceros de relleno: 100 → "100.00", 9.072 → "9.072".
 */
export function formatearKg(valor: number | string): string {
    return Number(valor).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 3 });
}

/** Precio o costo por kilo con signo de pesos: 98.7654 → "$98.7654", 110 → "$110.00". */
export function formatearPrecioKg(valor: number | string): string {
    return `$${Number(valor).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}
