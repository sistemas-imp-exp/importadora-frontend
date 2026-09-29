import { Fragment, useState } from "react";
import type { EntradaApi, EntradaDetalleApi } from "../../interfaces/entradas/Entrada";
import type { Camara } from "../../interfaces/camaras/Camara";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import {
    clasificarNivelCaducidad,
    diasRestantesHasta,
    CLASE_BADGE_NIVEL,
    ETIQUETA_NIVEL,
    RANGO_NIVEL,
    type NivelCaducidad,
} from "../../utils/caducidad";
import { formatearDinero } from "../../utils/existencias";
import TablaResponsive from "../../../../shared/components/TablaResponsive";
import type { DensidadTabla } from "../../../../shared/hooks/useDensidadTabla";

interface EntradasTableProps {
    entradas: EntradaApi[];
    camaras: Camara[];
    densidad: DensidadTabla;
    onEditar: (entrada: EntradaApi) => void;
    onEliminar: (entrada: EntradaApi) => void;
}

// Columnas fijas a la izquierda: el ancho es fijo para poder calcular el
// desplazamiento (`left`) de cada una. Box-sizing border-box (Bootstrap) hace
// que el ancho incluya el padding.
const FIJA_EXPANDIR = { left: 0, width: "2.5rem", minWidth: "2.5rem" };
const FIJA_FECHA = { left: "2.5rem", width: "6.5rem", minWidth: "6.5rem" };
const FIJA_PROVEEDOR = { left: "9rem", width: "13rem", minWidth: "13rem", maxWidth: "13rem" };

const COLUMNAS = 12;

function fecha(iso: string): string {
    return formatearFechaNumerica(new Date(iso + "T00:00:00"));
}

function kilos(valor: number | string): string {
    return formatearDinero(Number(valor));
}

/** Descripción del nivel para el tooltip: "Crítico (0 a 7 días): vence en 3 días". */
function describirCaducidad(nivel: NivelCaducidad, dias: number): string {
    const cuando = dias < 0 ? `venció hace ${-dias} día(s)` : dias === 0 ? "vence hoy" : `vence en ${dias} día(s)`;
    return `${ETIQUETA_NIVEL[nivel]} (${RANGO_NIVEL[nivel]}): ${cuando}`;
}

function BadgeCaducidad({ fechaCaducidad }: { fechaCaducidad: string | null }) {
    if (!fechaCaducidad) return <span className="text-body-secondary">—</span>;
    const dias = diasRestantesHasta(fechaCaducidad);
    const nivel = clasificarNivelCaducidad(dias);
    if (!nivel) return <span>{fecha(fechaCaducidad)}</span>;
    return (
        <span className="d-inline-flex align-items-center gap-1 text-nowrap" title={describirCaducidad(nivel, dias)}>
            {fecha(fechaCaducidad)}
            <span className={`badge ${CLASE_BADGE_NIVEL[nivel]}`}>{ETIQUETA_NIVEL[nivel]}</span>
        </span>
    );
}

/** La caducidad más próxima de la entrada: es la que decide si hay que atenderla. */
function caducidadMasProxima(entrada: EntradaApi): string | null {
    const fechas = entrada.detalles.map((d) => d.fecha_caducidad).filter((f): f is string => !!f);
    return fechas.length ? fechas.sort()[0] : null;
}

function DetalleEntrada({ detalles, nombreCamara }: { detalles: EntradaDetalleApi[]; nombreCamara: (id: number | null) => string }) {
    return (
        <table className="table table-sm tabla-detalle mb-0 border rounded">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Lote proveedor</th>
                    <th>Cámara</th>
                    <th>Recibo</th>
                    <th className="num">Cajas</th>
                    <th className="num">Kg/caja</th>
                    <th className="num">Total kg</th>
                    <th className="num" title="Lo que queda de la línea después de salidas y traslados">Disponible</th>
                    <th className="num">Costo/kg</th>
                    <th>Caducidad</th>
                    <th>Observaciones</th>
                </tr>
            </thead>
            <tbody>
                {detalles.map((d) => {
                    const agotada = d.cajas_disponibles < d.cajas;
                    return (
                        <tr key={d.id}>
                            <td className="text-nowrap fw-semibold">{d.producto.talla} {d.producto.tipo}</td>
                            <td className="text-nowrap">{d.lote_proveedor}</td>
                            <td className="text-nowrap">{nombreCamara(d.camara)}</td>
                            <td className="text-nowrap">{d.lote_general_codigo ?? "—"}</td>
                            <td className="num">{d.cajas.toLocaleString("es-MX")}</td>
                            <td className="num">{kilos(d.peso_por_caja)}</td>
                            <td className="num">{kilos(d.total_kilos)}</td>
                            <td className={`num ${agotada ? "text-body-secondary" : ""}`}>
                                {d.cajas_disponibles.toLocaleString("es-MX")} cj · {kilos(d.kilos_disponibles)} kg
                            </td>
                            <td className="num">{d.costo_por_kilo ? `$${formatearDinero(Number(d.costo_por_kilo))}` : "—"}</td>
                            <td><BadgeCaducidad fechaCaducidad={d.fecha_caducidad} /></td>
                            <td className="truncar" title={d.observaciones || undefined}>
                                {d.observaciones || <span className="text-body-secondary">—</span>}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

function EntradasTable({ entradas, camaras, densidad, onEditar, onEliminar }: EntradasTableProps) {
    const [expandidas, setExpandidas] = useState<Set<number>>(new Set());

    function nombreCamara(id: number | null): string {
        if (!id) return "Venta directa";
        return camaras.find((c) => c.id === id)?.nombre ?? "—";
    }

    // Los movimientos entre cámaras también crean una Entrada (la mitad "llegada"),
    // pero sin proveedor real — no pertenecen a esta lista de compras.
    const reales = entradas.filter((e) => e.proveedor !== null);

    // Una línea con menos cajas disponibles que capturadas ya fue vendida o
    // movida a otra cámara. El backend rechaza editar/eliminar esas entradas
    // (ver inventario/auditoria.py); esto solo evita el viaje al servidor.
    // Se calcula aquí y no en el API para no meter una consulta por entrada.
    function tieneSalidas(entrada: EntradaApi): boolean {
        return entrada.detalles.some((d) => d.cajas_disponibles < d.cajas);
    }

    const todasExpandidas = reales.length > 0 && reales.every((e) => expandidas.has(e.id));

    function alternar(id: number) {
        setExpandidas((actual) => {
            const copia = new Set(actual);
            if (copia.has(id)) copia.delete(id);
            else copia.add(id);
            return copia;
        });
    }

    function alternarTodas() {
        setExpandidas(todasExpandidas ? new Set() : new Set(reales.map((e) => e.id)));
    }

    return (
        <TablaResponsive alturaMaxima="70vh">
            <table className={`table tabla-datos ${densidad === "compacta" ? "densidad-compacta" : ""}`}>
                <thead>
                    <tr>
                        <th className="fija-izq text-center" style={FIJA_EXPANDIR}>
                            <button
                                type="button"
                                className="btn btn-link btn-sm btn-expandir text-body-secondary"
                                onClick={alternarTodas}
                                aria-expanded={todasExpandidas}
                                title={todasExpandidas ? "Contraer todas" : "Expandir todas"}
                                disabled={reales.length === 0}
                            >
                                <i className="bi bi-chevron-right" aria-hidden="true"></i>
                                <span className="visually-hidden">{todasExpandidas ? "Contraer todas" : "Expandir todas"}</span>
                            </button>
                        </th>
                        <th className="fija-izq" style={FIJA_FECHA}>Fecha</th>
                        <th className="fija-izq fija-izq-borde" style={FIJA_PROVEEDOR}>Proveedor</th>
                        <th>Empresa</th>
                        <th>Factura</th>
                        <th>Recibo ingreso</th>
                        <th className="num">Líneas</th>
                        <th className="num">Cajas</th>
                        <th className="num">Total kg</th>
                        <th>Caducidad próxima</th>
                        <th>Estado</th>
                        <th className="fija-der text-end">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {reales.length === 0 ? (
                        <tr>
                            <td colSpan={COLUMNAS} className="text-center text-body-secondary py-5">
                                <i className="bi bi-inbox fs-3 d-block mb-2" aria-hidden="true"></i>
                                No hay entradas registradas.
                            </td>
                        </tr>
                    ) : (
                        reales.map((entrada) => {
                            const abierta = expandidas.has(entrada.id);
                            const conSalidas = tieneSalidas(entrada);
                            const totalCajas = entrada.detalles.reduce((acc, d) => acc + d.cajas, 0);
                            const totalKilos = entrada.detalles.reduce((acc, d) => acc + Number(d.total_kilos), 0);
                            const idDetalle = `detalle-entrada-${entrada.id}`;
                            return (
                                <Fragment key={entrada.id}>
                                    <tr className={`fila-principal ${abierta ? "expandida" : ""}`}>
                                        <td className="fija-izq text-center" style={FIJA_EXPANDIR}>
                                            <button
                                                type="button"
                                                className="btn btn-link btn-sm btn-expandir text-body-secondary"
                                                onClick={() => alternar(entrada.id)}
                                                aria-expanded={abierta}
                                                aria-controls={idDetalle}
                                                title={abierta ? "Ocultar líneas" : "Ver líneas"}
                                            >
                                                <i className="bi bi-chevron-right" aria-hidden="true"></i>
                                                <span className="visually-hidden">{abierta ? "Ocultar" : "Ver"} líneas de la entrada {entrada.id}</span>
                                            </button>
                                        </td>
                                        <td className="fija-izq text-nowrap" style={FIJA_FECHA}>{fecha(entrada.fecha)}</td>
                                        <td
                                            className="fija-izq fija-izq-borde truncar fw-semibold"
                                            style={FIJA_PROVEEDOR}
                                            title={entrada.proveedor!.nombre}
                                        >
                                            {entrada.proveedor!.nombre}
                                        </td>
                                        <td className="text-nowrap">{entrada.empresa?.nombre ?? "—"}</td>
                                        <td className="text-nowrap">
                                            {entrada.factura || "—"}
                                            {entrada.es_internacional && entrada.pedimento && (
                                                <div className="small text-body-secondary">Ped. {entrada.pedimento}</div>
                                            )}
                                        </td>
                                        <td className="text-nowrap">{entrada.recibo_ingreso || <span className="text-body-secondary">—</span>}</td>
                                        <td className="num">{entrada.detalles.length}</td>
                                        <td className="num">{totalCajas.toLocaleString("es-MX")}</td>
                                        <td className="num fw-semibold">{kilos(totalKilos)}</td>
                                        <td><BadgeCaducidad fechaCaducidad={caducidadMasProxima(entrada)} /></td>
                                        <td>
                                            <div className="d-flex flex-wrap gap-1">
                                                {entrada.es_internacional ? (
                                                    <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle">Importación</span>
                                                ) : (
                                                    <span className="badge text-bg-light border">Nacional</span>
                                                )}
                                                {entrada.editado && (
                                                    <span
                                                        className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle"
                                                        title="Modificada después de registrarse. El detalle está en Auditoría de entradas."
                                                    >
                                                        <i className="bi bi-pencil-square me-1" aria-hidden="true"></i>Editada
                                                    </span>
                                                )}
                                                {conSalidas && (
                                                    <span
                                                        className="badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle"
                                                        title="Ya tiene salidas o traslados: no se puede editar ni eliminar."
                                                    >
                                                        <i className="bi bi-lock-fill me-1" aria-hidden="true"></i>Con salidas
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="fija-der text-end text-nowrap">
                                            {/* Un botón deshabilitado no muestra su title: el span sí, y explica por qué. */}
                                            <span
                                                className="d-inline-block"
                                                title={conSalidas ? "Ya tiene salidas: solo un superusuario puede corregirla desde Auditoría de entradas" : "Editar entrada"}
                                            >
                                                <button
                                                    className="btn btn-sm btn-outline-secondary"
                                                    type="button"
                                                    disabled={conSalidas}
                                                    onClick={() => onEditar(entrada)}
                                                >
                                                    <i className="bi bi-pencil" aria-hidden="true"></i>
                                                    <span className="visually-hidden">Editar entrada {entrada.id}</span>
                                                </button>
                                            </span>{" "}
                                            <span
                                                className="d-inline-block"
                                                title={conSalidas ? "No se puede eliminar: ya tiene salidas registradas" : "Eliminar entrada"}
                                            >
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    type="button"
                                                    disabled={conSalidas}
                                                    onClick={() => onEliminar(entrada)}
                                                >
                                                    <i className="bi bi-trash" aria-hidden="true"></i>
                                                    <span className="visually-hidden">Eliminar entrada {entrada.id}</span>
                                                </button>
                                            </span>
                                        </td>
                                    </tr>
                                    {abierta && (
                                        <tr className="fila-detalle" id={idDetalle}>
                                            <td colSpan={COLUMNAS}>
                                                <DetalleEntrada detalles={entrada.detalles} nombreCamara={nombreCamara} />
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            );
                        })
                    )}
                </tbody>
            </table>
        </TablaResponsive>
    );
}

export default EntradasTable;
