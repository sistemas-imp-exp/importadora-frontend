import BuscadorTabla from "../../../../shared/components/BuscadorTabla";
import FiltroChip, { type OpcionFiltro } from "../../../../shared/components/FiltroChip";
import type { FiltrosExistencias } from "../../hooks/useExistenciasFiltros";

interface OpcionesExistencias {
    camaras: OpcionFiltro[];
    proveedores: OpcionFiltro[];
    tallas: OpcionFiltro[];
    tipos: OpcionFiltro[];
    niveles: OpcionFiltro[];
}

interface ExistenciasFiltrosProps {
    busqueda: string;
    onBusquedaChange: (valor: string) => void;
    filtros: FiltrosExistencias;
    onFiltroChange: (clave: keyof FiltrosExistencias, valor: string) => void;
    onLimpiar: () => void;
    hayFiltros: boolean;
    opciones: OpcionesExistencias;
}

function ExistenciasFiltros({
    busqueda,
    onBusquedaChange,
    filtros,
    onFiltroChange,
    onLimpiar,
    hayFiltros,
    opciones,
}: ExistenciasFiltrosProps) {
    return (
        // < xl (1200px): buscador y filtros van en filas separadas, apiladas
        // (una sola fila mezclando ambos deja hueco bajo el buscador de ancho
        // fijo cuando los chips se van a una segunda línea). >= xl: una sola fila.
        <div className="d-flex flex-column flex-xl-row gap-2 mb-3">
            <BuscadorTabla
                valor={busqueda}
                onChange={onBusquedaChange}
                placeholder="Buscar por talla, tipo, lote o factura..."
            />

            <div className="d-flex flex-wrap gap-2 align-items-center">
                <FiltroChip
                    etiqueta="Cámara"
                    icono="bi-snow2"
                    valor={filtros.camaraId}
                    opciones={opciones.camaras}
                    onChange={(valor) => onFiltroChange("camaraId", valor)}
                    etiquetaTodos="Todas las cámaras"
                />
                <FiltroChip
                    etiqueta="Proveedor"
                    icono="bi-truck"
                    valor={filtros.proveedor}
                    opciones={opciones.proveedores}
                    onChange={(valor) => onFiltroChange("proveedor", valor)}
                    etiquetaTodos="Todos los proveedores"
                />
                <FiltroChip
                    etiqueta="Caducidad"
                    icono="bi-exclamation-triangle"
                    valor={filtros.nivel}
                    opciones={opciones.niveles}
                    onChange={(valor) => onFiltroChange("nivel", valor)}
                    etiquetaTodos="Cualquier caducidad"
                />
                <FiltroChip
                    etiqueta="Talla"
                    icono="bi-rulers"
                    valor={filtros.talla}
                    opciones={opciones.tallas}
                    onChange={(valor) => onFiltroChange("talla", valor)}
                    etiquetaTodos="Todas las tallas"
                />
                <FiltroChip
                    etiqueta="Tipo"
                    icono="bi-box"
                    valor={filtros.tipo}
                    opciones={opciones.tipos}
                    onChange={(valor) => onFiltroChange("tipo", valor)}
                    etiquetaTodos="Todos los tipos"
                />

                {hayFiltros && (
                    <button type="button" className="btn btn-link btn-sm text-decoration-none ms-auto" onClick={onLimpiar}>
                        Borrar filtros
                    </button>
                )}
            </div>
        </div>
    );
}

export default ExistenciasFiltros;
