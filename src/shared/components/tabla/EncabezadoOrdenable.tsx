import type { CSSProperties, ReactNode } from "react";
import type { OrdenTabla } from "../../hooks/useOrdenTabla";

interface EncabezadoOrdenableProps<K extends string> {
    columna: K;
    children: ReactNode;
    /** Sin orden ni `onOrdenar` se pinta como un encabezado normal. */
    orden?: OrdenTabla<K> | null;
    onOrdenar?: (columna: K) => void;
    className?: string;
    style?: CSSProperties;
}

/** `<th>` con botón para ordenar por esa columna (`useOrdenTabla`). */
function EncabezadoOrdenable<K extends string>({
    columna, children, orden, onOrdenar, className, style,
}: EncabezadoOrdenableProps<K>) {
    if (!onOrdenar) return <th className={className} style={style}>{children}</th>;

    const direccion = orden?.columna === columna ? orden.direccion : null;
    const icono = direccion === "asc" ? "bi-arrow-up" : direccion === "desc" ? "bi-arrow-down" : "bi-arrow-down-up";
    const siguiente = direccion === "asc" ? "descendente" : direccion === "desc" ? "sin orden" : "ascendente";

    return (
        <th
            className={className}
            style={style}
            aria-sort={direccion === "asc" ? "ascending" : direccion === "desc" ? "descending" : "none"}
        >
            <button
                type="button"
                className={`btn-ordenar ${direccion ? "activo" : ""}`}
                onClick={() => onOrdenar(columna)}
                title={`Ordenar: ${siguiente}`}
            >
                {children}
                <i className={`bi ${icono}`} aria-hidden="true"></i>
            </button>
        </th>
    );
}

export default EncabezadoOrdenable;
