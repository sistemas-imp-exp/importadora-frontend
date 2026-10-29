import type { ExistenciaApi } from "../interfaces/existencias/Existencia";
import type { Producto } from "../interfaces/productos/Producto";

/** Existencia de un producto sumando todos sus lotes (sin importar IMP, factura, lote ni proveedor). */
export interface TotalProducto {
    producto: Producto;
    kilos: number;
    cajas: number;
    lotes: number;
    proveedores: string[];
    camaras: string[];
}

export function totalesPorProducto(productos: Producto[], existencias: ExistenciaApi[]): TotalProducto[] {
    const mapa = new Map<number, TotalProducto>(
        productos.map((p) => [p.id, { producto: p, kilos: 0, cajas: 0, lotes: 0, proveedores: [], camaras: [] }])
    );
    for (const e of existencias) {
        const total = mapa.get(e.producto_id);
        if (!total) continue;
        total.kilos += Number(e.kilos_disponibles);
        total.cajas += e.cajas_disponibles;
        total.lotes += 1;
        if (!total.proveedores.includes(e.proveedor_nombre)) total.proveedores.push(e.proveedor_nombre);
        if (!total.camaras.includes(e.camara_nombre)) total.camaras.push(e.camara_nombre);
    }
    return [...mapa.values()];
}
