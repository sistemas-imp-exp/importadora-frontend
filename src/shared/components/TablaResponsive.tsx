import { useLayoutEffect, useRef, useState } from "react";

interface TablaResponsiveProps {
    children: React.ReactNode;
    /**
     * Altura máxima del área de la tabla (p. ej. "70vh"). Con ella la tabla
     * desplaza en su propio contenedor y un encabezado `position: sticky`
     * queda fijo arriba; sin ella, el scroll vertical es el de la página y el
     * sticky no tiene contra qué fijarse (el contenedor tiene overflow-x).
     */
    alturaMaxima?: string;
}

/**
 * Envoltorio de .table-responsive con una segunda barra de scroll horizontal
 * arriba de la tabla, sincronizada con la de abajo. Tablas con muchas
 * columnas obligaban a bajar hasta el fondo (a veces fuera de la pantalla,
 * con paginador y todo) solo para poder desplazarse lateralmente.
 */
function TablaResponsive({ children, alturaMaxima }: TablaResponsiveProps) {
    const scrollSuperiorRef = useRef<HTMLDivElement>(null);
    const contenedorRef = useRef<HTMLDivElement>(null);
    const [anchoContenido, setAnchoContenido] = useState(0);

    useLayoutEffect(() => {
        const contenedor = contenedorRef.current;
        const tabla = contenedor?.querySelector("table");
        if (!contenedor || !tabla) return;

        const medir = () => setAnchoContenido(tabla.scrollWidth);
        medir();

        // El ancho de la tabla cambia con los datos (filtros, paginación,
        // columnas que envuelven texto distinto), no solo con el viewport.
        const observer = new ResizeObserver(medir);
        observer.observe(tabla);
        return () => observer.disconnect();
    }, [children]);

    return (
        <>
            <div
                ref={scrollSuperiorRef}
                className="overflow-x-auto"
                style={{ overflowY: "hidden" }}
                onScroll={(e) => {
                    if (contenedorRef.current) contenedorRef.current.scrollLeft = e.currentTarget.scrollLeft;
                }}
            >
                <div style={{ width: anchoContenido, height: 1 }} />
            </div>
            <div
                ref={contenedorRef}
                className="table-responsive"
                style={alturaMaxima ? { maxHeight: alturaMaxima, overflowY: "auto" } : undefined}
                onScroll={(e) => {
                    if (scrollSuperiorRef.current) scrollSuperiorRef.current.scrollLeft = e.currentTarget.scrollLeft;
                }}
            >
                {children}
            </div>
        </>
    );
}

export default TablaResponsive;
