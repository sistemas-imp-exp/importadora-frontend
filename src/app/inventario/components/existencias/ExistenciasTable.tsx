import { useMemo, useState } from "react";
import type { EntradaApi } from "../../interfaces/entradas/Entrada";
import type { Camara } from "../../interfaces/camaras/Camara";
import BuscadorTabla from "../../../../shared/components/BuscadorTabla";

interface ExistenciasTableProps {
    entradas: EntradaApi[];
    camaras: Camara[];
}

interface FilaExistencia {
    detalleId: number;
    camaraId: number | null;
    camaraNombre: string;
    proveedorNombre: string;
    talla: string;
    tipo: string;
    loteProveedor: string;
    reciboIngreso: string;
    cajasDisponibles: number;
    totalKilos: string;
    costoPorKilo: string | null;
}

function ExistenciasTable({ entradas, camaras }: ExistenciasTableProps) {
    const [busqueda, setBusqueda] = useState("");
    const [camaraId, setCamaraId] = useState<number | "">("");
    const [proveedorNombre, setProveedorNombre] = useState("");

    const proveedoresDisponibles = useMemo(() => {
        const nombres = new Set<string>();
        for (const entrada of entradas) {
            if (entrada.proveedor) nombres.add(entrada.proveedor.nombre);
        }
        return Array.from(nombres).sort((a, b) => a.localeCompare(b));
    }, [entradas]);

    const filas: FilaExistencia[] = useMemo(() => {
        const resultado: FilaExistencia[] = [];
        for (const entrada of entradas) {
            for (const detalle of entrada.detalles) {
                if (detalle.cajas_disponibles <= 0) continue;
                const camara = camaras.find((c) => c.id === detalle.camara);
                resultado.push({
                    detalleId: detalle.id,
                    camaraId: detalle.camara,
                    camaraNombre: camara?.nombre ?? "Venta directa (sin cámara)",
                    proveedorNombre: entrada.proveedor?.nombre ?? "—",
                    talla: detalle.producto.talla,
                    tipo: detalle.producto.tipo,
                    loteProveedor: detalle.lote_proveedor,
                    reciboIngreso: detalle.lote_general_codigo ?? "—",
                    cajasDisponibles: detalle.cajas_disponibles,
                    totalKilos: detalle.total_kilos,
                    costoPorKilo: detalle.costo_por_kilo,
                });
            }
        }
        return resultado;
    }, [entradas, camaras]);

    const filtradas = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();
        return filas.filter((fila) => {
            if (camaraId !== "" && fila.camaraId !== camaraId) return false;
            if (proveedorNombre && fila.proveedorNombre !== proveedorNombre) return false;
            if (!termino) return true;
            return (
                fila.talla.toLowerCase().includes(termino) ||
                fila.tipo.toLowerCase().includes(termino)
            );
        });
    }, [filas, busqueda, camaraId, proveedorNombre]);

    const totalCajas = filtradas.reduce((acc, f) => acc + f.cajasDisponibles, 0);

    return (
        <>
            <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center p-3 border-bottom">
                <BuscadorTabla valor={busqueda} onChange={setBusqueda} placeholder="Buscar por talla o tipo..." />
                <div className="d-flex flex-wrap gap-2">
                    <select
                        className="form-select form-select-sm"
                        style={{ width: "auto" }}
                        value={camaraId}
                        onChange={(e) => setCamaraId(e.target.value === "" ? "" : Number(e.target.value))}
                    >
                        <option value="">Todas las cámaras</option>
                        {camaras.map((c) => (
                            <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                    </select>
                    <select
                        className="form-select form-select-sm"
                        style={{ width: "auto" }}
                        value={proveedorNombre}
                        onChange={(e) => setProveedorNombre(e.target.value)}
                    >
                        <option value="">Todos los proveedores</option>
                        {proveedoresDisponibles.map((nombre) => (
                            <option key={nombre} value={nombre}>{nombre}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="table-responsive">
                <table className="table table-striped table-sm mb-0">
                    <thead>
                        <tr>
                            <th className="text-wrap">Cámara</th>
                            <th className="text-wrap">Proveedor</th>
                            <th className="text-wrap">Talla</th>
                            <th className="text-wrap">Tipo</th>
                            <th className="text-wrap">Lote proveedor</th>
                            <th className="text-wrap">Recibo ingreso</th>
                            <th className="text-wrap text-end">Cajas disponibles</th>
                            <th className="text-wrap text-end">Total kilos (lote)</th>
                            <th className="text-wrap text-end">Costo/kg</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtradas.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="text-center text-muted py-4">
                                    {filas.length === 0 ? "No hay existencias." : "Nada coincide con los filtros."}
                                </td>
                            </tr>
                        ) : (
                            filtradas.map((fila) => (
                                <tr key={fila.detalleId}>
                                    <td className="text-wrap">{fila.camaraNombre}</td>
                                    <td className="text-wrap">{fila.proveedorNombre}</td>
                                    <td className="text-wrap">{fila.talla}</td>
                                    <td className="text-wrap">{fila.tipo}</td>
                                    <td className="text-wrap">{fila.loteProveedor}</td>
                                    <td className="text-wrap">{fila.reciboIngreso}</td>
                                    <td className="text-end fw-bold">{fila.cajasDisponibles}</td>
                                    <td className="text-end">{fila.totalKilos}</td>
                                    <td className="text-end">{fila.costoPorKilo ?? "—"}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    {filtradas.length > 0 && (
                        <tfoot>
                            <tr>
                                <td colSpan={6} className="text-end fw-bold">Total cajas disponibles ({filtradas.length} lotes):</td>
                                <td className="text-end fw-bold">{totalCajas}</td>
                                <td colSpan={2}></td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </>
    );
}

export default ExistenciasTable;
