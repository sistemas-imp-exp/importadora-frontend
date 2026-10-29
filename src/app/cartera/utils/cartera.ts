import { formatearFechaNumerica } from "../../../shared/utils/fechas";

/** "$1,234.56" (negativo = saldo a favor del cliente). */
export function dinero(valor: string | number | null | undefined): string {
    if (valor === null || valor === undefined || valor === "") return "—";
    const numero = Number(valor);
    const texto = Math.abs(numero).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${numero < 0 ? "−" : ""}$${texto}`;
}

/** 'YYYY-MM-DD' a dd/mm/aaaa sin corrimiento por zona horaria. */
export function fecha(iso: string | null | undefined): string {
    if (!iso) return "—";
    return formatearFechaNumerica(new Date(iso.slice(0, 10) + "T12:00:00"));
}

/** Clase de color para un saldo: debe (rojo suave), a favor (verde), en cero (gris). */
export function claseSaldo(valor: string | number): string {
    const numero = Number(valor);
    if (numero > 0.004) return "text-danger-emphasis";
    if (numero < -0.004) return "text-success-emphasis";
    return "text-body-secondary";
}

export function rutaClienteCartera(id: number): string {
    return `/cartera/clientes/${id}`;
}
