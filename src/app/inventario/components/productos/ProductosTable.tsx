import { useMemo, useState } from "react";
import type { Producto } from "../../interfaces/productos/Producto";
import BuscadorTabla from "../../../../shared/components/BuscadorTabla";
import FiltroChip from "../../../../shared/components/FiltroChip";
import Paginacion from "../../../../shared/components/Paginacion";
import PorPaginaSelect from "../../../../shared/components/PorPaginaSelect";
import { usePaginacion } from "../../../../shared/hooks/usePaginacion";
import TablaResponsive from "../../../../shared/components/TablaResponsive";

interface FiltrosColumnas {
    tipo: string;
    categoria: string;
    presentacion: "" | "entero" | "colas" | "sin";
    estado: "" | "activo" | "inactivo";
}

const SIN_FILTROS: FiltrosColumnas = { tipo: "", categoria: "", presentacion: "", estado: "" };
const SIN_CATEGORIA = "__sin__";

/** Valores distintos de una columna, ordenados, para su lista de filtro. */
function distintos(valores: string[]): string[] {
    return Array.from(new Set(valores.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

interface ProductosTableProps {
    productos: Producto[];
    onEditar?: (producto: Producto) => void;
}

function ProductosTable({ productos, onEditar }: ProductosTableProps) {
    const [busqueda, setBusqueda] = useState("");
    const [porPagina, setPorPagina] = useState(25);
    const [columnas, setColumnas] = useState<FiltrosColumnas>(SIN_FILTROS);
    const hayFiltrosColumna = Object.values(columnas).some(Boolean);

    function filtrar(cambios: Partial<FiltrosColumnas>) {
        setColumnas((actual) => ({ ...actual, ...cambios }));
    }

    const tipos = useMemo(() => distintos(productos.map((p) => p.tipo)), [productos]);
    const categorias = useMemo(() => distintos(productos.map((p) => p.categoria)), [productos]);

    const filtrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();
        return productos.filter((p) => {
            const coincideBusqueda =
                !termino ||
                p.talla.toLowerCase().includes(termino) ||
                p.tipo.toLowerCase().includes(termino) ||
                p.categoria.toLowerCase().includes(termino);
            if (!coincideBusqueda) return false;
            if (columnas.tipo && p.tipo !== columnas.tipo) return false;
            if (columnas.categoria === SIN_CATEGORIA) {
                if (p.categoria !== "") return false;
            } else if (columnas.categoria && p.categoria !== columnas.categoria) {
                return false;
            }
            if (columnas.presentacion === "sin") {
                if (p.presentacion !== "") return false;
            } else if (columnas.presentacion && p.presentacion !== columnas.presentacion) {
                return false;
            }
            if (columnas.estado && p.activo !== (columnas.estado === "activo")) return false;
            return true;
        });
    }, [productos, busqueda, columnas]);

    const { pagina, setPagina, totalPaginas, inicio, fin } = usePaginacion(
        filtrados.length, porPagina, `${busqueda}|${porPagina}|${JSON.stringify(columnas)}`
    );
    const paginados = filtrados.slice(inicio, fin);

    return (
        <>
            <div className="d-flex flex-wrap gap-2 align-items-center p-3 border-bottom">
                <BuscadorTabla valor={busqueda} onChange={setBusqueda} placeholder="Buscar por talla, tipo o categoría..." />
                <FiltroChip
                    etiqueta="Tipo"
                    icono="bi-box"
                    valor={columnas.tipo}
                    opciones={tipos.map((t) => ({ value: t, label: t }))}
                    onChange={(valor) => filtrar({ tipo: valor })}
                    etiquetaTodos="Todos los tipos"
                />
                <FiltroChip
                    etiqueta="Categoría"
                    icono="bi-tags"
                    valor={columnas.categoria}
                    opciones={[...categorias.map((c) => ({ value: c, label: c })), { value: SIN_CATEGORIA, label: "Sin categoría" }]}
                    onChange={(valor) => filtrar({ categoria: valor })}
                    etiquetaTodos="Todas las categorías"
                />
                <FiltroChip
                    etiqueta="Presentación"
                    icono="bi-layers"
                    valor={columnas.presentacion}
                    opciones={[
                        { value: "entero", label: "Entero" },
                        { value: "colas", label: "Colas" },
                        { value: "sin", label: "Sin definir" },
                    ]}
                    onChange={(valor) => filtrar({ presentacion: valor as FiltrosColumnas["presentacion"] })}
                    etiquetaTodos="Todas las presentaciones"
                />
                <FiltroChip
                    etiqueta="Estado"
                    icono="bi-toggle-on"
                    valor={columnas.estado}
                    opciones={[{ value: "activo", label: "Activo" }, { value: "inactivo", label: "Inactivo" }]}
                    onChange={(valor) => filtrar({ estado: valor as FiltrosColumnas["estado"] })}
                    etiquetaTodos="Todos los estados"
                />
                {hayFiltrosColumna && (
                    <button type="button" className="btn btn-link btn-sm text-decoration-none" onClick={() => setColumnas(SIN_FILTROS)}>
                        Borrar filtros
                    </button>
                )}
                <div className="ms-auto">
                    <PorPaginaSelect valor={porPagina} onChange={setPorPagina} />
                </div>
            </div>

            <TablaResponsive alturaMaxima="70vh">
                <table className="table tabla-datos">
                    <thead>
                        <tr>
                            <th style={{ width: "28%" }}>Talla</th>
                            <th style={{ width: "20%" }}>Tipo</th>
                            <th style={{ width: "18%" }}>Categoría</th>
                            <th style={{ width: "14%" }}>Presentación</th>
                            <th style={{ width: "11%" }}>Estado</th>
                            {onEditar && <th className="text-end">Acciones</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {paginados.length === 0 ? (
                            <tr>
                                <td colSpan={onEditar ? 6 : 5} className="text-center text-body-secondary py-5">
                                    {productos.length === 0 ? "No hay productos registrados." : "Ningún producto coincide con la búsqueda o los filtros."}
                                </td>
                            </tr>
                        ) : (
                            paginados.map((producto) => (
                                <tr key={producto.id} className="fila-principal">
                                    <td className="text-wrap">{producto.talla}</td>
                                    <td className="text-wrap">{producto.tipo}</td>
                                    <td className="text-wrap">{producto.categoria || "—"}</td>
                                    <td className="text-wrap">
                                        {producto.presentacion === "entero" ? (
                                            "Entero"
                                        ) : producto.presentacion === "colas" ? (
                                            "Colas"
                                        ) : (
                                            <span
                                                className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle"
                                                title="Sin presentación el producto no se puede ubicar en el bloque Entero o Colas del reporte de existencias por cámara"
                                            >
                                                <i className="bi bi-exclamation-circle me-1" aria-hidden="true"></i>Sin definir
                                            </span>
                                        )}
                                    </td>
                                    <td className="text-wrap">
                                        {producto.activo ? (
                                            <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle">Activo</span>
                                        ) : (
                                            <span className="badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle">Inactivo</span>
                                        )}
                                    </td>
                                    {onEditar && (
                                        <td>
                                            <div className="text-end">
                                                <button
                                                    className="btn btn-outline-secondary btn-sm"
                                                    type="button"
                                                    title="Editar producto"
                                                    onClick={() => onEditar(producto)}
                                                >
                                                    <i className="bi bi-pencil" aria-hidden="true"></i>
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </TablaResponsive>

            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 p-3 border-top">
                <small className="text-muted">
                    {filtrados.length === 0 ? "Sin resultados" : `Mostrando ${inicio + 1}-${Math.min(fin, filtrados.length)} de ${filtrados.length}`}
                    {filtrados.length !== productos.length && ` (${productos.length} en total)`}
                </small>
                <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
            </div>
        </>
    );
}

export default ProductosTable;
