import { useMemo, useState } from "react";
import type { Producto } from "../../interfaces/productos/Producto";
import BuscadorTabla from "../../../../shared/components/BuscadorTabla";
import Paginacion from "../../../../shared/components/Paginacion";
import { usePaginacion } from "../../../../shared/hooks/usePaginacion";
import TablaResponsive from "../../../../shared/components/TablaResponsive";

interface ProductosTableProps {
    productos: Producto[];
    onEditar: (producto: Producto) => void;
}

const POR_PAGINA = 15;

function ProductosTable({ productos, onEditar }: ProductosTableProps) {
    const [busqueda, setBusqueda] = useState("");

    const filtrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();
        if (!termino) return productos;
        return productos.filter(
            (p) =>
                p.talla.toLowerCase().includes(termino) ||
                p.tipo.toLowerCase().includes(termino) ||
                p.categoria.toLowerCase().includes(termino)
        );
    }, [productos, busqueda]);

    const { pagina, setPagina, totalPaginas, inicio, fin } = usePaginacion(filtrados.length, POR_PAGINA, busqueda);
    const paginados = filtrados.slice(inicio, fin);

    return (
        <>
            <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center p-3 border-bottom">
                <BuscadorTabla valor={busqueda} onChange={setBusqueda} placeholder="Buscar por talla, tipo o categoría..." />
            </div>

            <TablaResponsive alturaMaxima="70vh">
                <table className="table tabla-datos">
                    <thead>
                        <tr>
                            <th>Talla</th>
                            <th>Tipo</th>
                            <th>Categoría</th>
                            <th>Presentación</th>
                            <th className="text-center">Estado</th>
                            <th className="text-end">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginados.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center text-body-secondary py-5">
                                    {productos.length === 0 ? "No hay productos registrados." : "Ningún producto coincide con la búsqueda."}
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
                                    <td className="text-wrap text-center">
                                        {producto.activo ? (
                                            <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle">Activo</span>
                                        ) : (
                                            <span className="badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle">Inactivo</span>
                                        )}
                                    </td>
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
