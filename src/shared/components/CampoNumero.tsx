import { useLayoutEffect, useRef, type InputHTMLAttributes } from "react";

type AtributosInput = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "inputMode">;

interface Props extends AtributosInput {
    /** Valor limpio, sin comas ("1256123.26"); es lo que se guarda y se manda al API. */
    value: string | number | null | undefined;
    onChange: (valor: string) => void;
    /** 0 para cantidades enteras (cajas), 2 para kilos y dinero. */
    decimales?: number;
}

/** Deja solo dígitos y un punto, con a lo más `decimales` decimales. */
function limpiarNumero(texto: string, decimales: number): string {
    let limpio = texto.replace(/[^\d.]/g, "");
    const punto = limpio.indexOf(".");
    if (punto !== -1) {
        const entero = limpio.slice(0, punto);
        const fraccion = limpio.slice(punto + 1).replace(/\./g, "");
        limpio = decimales > 0 ? `${entero}.${fraccion.slice(0, decimales)}` : entero;
    }
    return limpio;
}

/** "1256123.26" → "1,256,123.26". Respeta lo escrito: no completa decimales. */
function formatearMiles(valor: string): string {
    if (!valor) return "";
    const [entero, fraccion] = valor.split(".");
    const conComas = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return fraccion !== undefined ? `${conComas}.${fraccion}` : conComas;
}

/** Cuántos dígitos y puntos hay antes de la posición (las comas no cuentan). */
function significativosAntes(texto: string, posicion: number): number {
    return texto.slice(0, posicion).replace(/[^\d.]/g, "").length;
}

/** Posición en el texto con comas después de `cuantos` dígitos/puntos. */
function posicionTras(texto: string, cuantos: number): number {
    if (cuantos <= 0) return 0;
    let vistos = 0;
    for (let i = 0; i < texto.length; i++) {
        if (/[\d.]/.test(texto[i])) vistos++;
        if (vistos === cuantos) return i + 1;
    }
    return texto.length;
}

/**
 * Campo numérico con separador de miles mientras se escribe (10000 → 10,000).
 * Es solo la máscara: hacia afuera entrega el número limpio, sin comas.
 */
export default function CampoNumero({ value, onChange, decimales = 2, className = "form-control", ...resto }: Props) {
    const ref = useRef<HTMLInputElement>(null);
    const cursor = useRef<number | null>(null);
    const mostrado = formatearMiles(limpiarNumero(value == null ? "" : String(value), Math.max(decimales, 20)));

    // Tras poner o quitar comas, el cursor vuelve junto al mismo dígito (en
    // cada render: si se tecleó una letra el valor no cambia, pero React
    // reescribe el campo y el cursor saltaría al final).
    useLayoutEffect(() => {
        if (cursor.current === null || !ref.current || document.activeElement !== ref.current) return;
        const posicion = posicionTras(mostrado, cursor.current);
        ref.current.setSelectionRange(posicion, posicion);
        cursor.current = null;
    });

    return (
        <input
            {...resto}
            ref={ref}
            type="text"
            inputMode={decimales > 0 ? "decimal" : "numeric"}
            autoComplete="off"
            className={className}
            value={mostrado}
            onChange={(e) => {
                const escrito = e.target.value;
                const limpio = limpiarNumero(escrito, decimales);
                cursor.current = Math.min(
                    significativosAntes(escrito, e.target.selectionStart ?? escrito.length),
                    limpio.length
                );
                onChange(limpio);
            }}
        />
    );
}
