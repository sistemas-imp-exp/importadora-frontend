import { Fragment, useEffect, useState } from "react";
import Modal from "../../../shared/components/Modal";
import SkeletonTable from "../../../shared/components/SkeletonTable";
import { useToastContext } from "../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import { formatearFechaNumerica } from "../../../shared/utils/fechas";
import type { EmpresaCartera, EstadoVenta, LineaVenta, VentaCliente } from "../interfaces/Cartera";
import { obtenerVentasCliente, verificarVentas } from "../services/cartera.service";
import { dinero, fecha } from "../utils/cartera";
import { formatearKg, formatearPrecioKg } from "../../../shared/utils/numeros";

interface Props {
    clienteId: number;
    empresas: EmpresaCartera[];
    editable: boolean;
    /** Tras verificar algo (para refrescar contadores o saldos de la vista). */
    onCambio?: () => void;
}

const FILTROS: { value: EstadoVenta | ""; label: string }[] = [
    { value: "pendiente", label: "Pendientes" },
    { value: "diferencia", label: "Con diferencia" },
    { value: "sin_precio", label: "Sin precio" },
    { value: "verificada", label: "Verificadas" },
    { value: "", label: "Todas" },
];

const BADGE: Record<EstadoVenta, { clase: string; texto: string; icono: string }> = {
    pendiente: { clase: "bg-warning-subtle text-warning-emphasis border-warning-subtle", texto: "Pendiente", icono: "bi-hourglass-split" },
    verificada: { clase: "bg-success-subtle text-success-emphasis border-success-subtle", texto: "Verificada", icono: "bi-check2-circle" },
    diferencia: { clase: "bg-danger-subtle text-danger-emphasis border-danger-subtle", texto: "Con diferencia", icono: "bi-exclamation-triangle" },
    sin_precio: { clase: "bg-secondary-subtle text-secondary-emphasis border-secondary-subtle", texto: "Sin precio", icono: "bi-question-circle" },
};

/**
 * Ventas del cliente: las salidas de Inventario, línea por línea, para
 * compararlas con la nota en papel. Si algo no coincide se reporta la
 * diferencia y Inventario la ve en la salida para corregirla.
 */
function VentasCliente({ clienteId, empresas, editable, onCambio }: Props) {
    const { mostrarToast } = useToastContext();
    const [filtro, setFiltro] = useState<EstadoVenta | "">("pendiente");
    const [empresa, setEmpresa] = useState<number | "">("");
    const [ventas, setVentas] = useState<VentaCliente[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [diferencia, setDiferencia] = useState<{ lineas: LineaVenta[]; folio: string } | null>(null);
    const [recarga, setRecarga] = useState(0);

    useEffect(() => {
        let vigente = true;
        obtenerVentasCliente(clienteId, { estado: filtro || undefined, empresa: empresa || undefined })
            .then((datos) => vigente && (setVentas(datos), setError(null)))
            .catch((err) => vigente && setError(obtenerMensajeError(err)));
        return () => {
            vigente = false;
        };
    }, [clienteId, filtro, empresa, recarga]);

    async function marcar(lineas: LineaVenta[], estado: "verificada" | "diferencia" | "pendiente", comentario = "") {
        try {
            await verificarVentas(lineas.map((l) => l.id), estado, comentario);
            const textos = { verificada: "verificada(s)", diferencia: "con diferencia reportada a Inventario", pendiente: "de vuelta a pendientes" };
            mostrarToast("Ventas", `${lineas.length} línea(s) ${textos[estado]}.`, "success");
            setRecarga((n) => n + 1);
            onCambio?.();
        } catch (err) {
            mostrarToast("Error", obtenerMensajeError(err), "danger");
            throw err;
        }
    }

    const totalVisible = (ventas ?? []).reduce((acc, v) => acc + Number(v.total), 0);

    return (
        <>
            <div className="d-flex flex-wrap gap-2 align-items-center p-3 border-bottom">
                <div className="btn-group flex-wrap" role="group" aria-label="Estado de las líneas">
                    {FILTROS.map((f) => (
                        <button key={f.value || "todas"} type="button" aria-pressed={filtro === f.value}
                            className={`btn btn-sm ${filtro === f.value ? "btn-primary" : "btn-outline-primary"}`}
                            onClick={() => setFiltro(f.value)}>
                            {f.label}
                        </button>
                    ))}
                </div>
                <select className="form-select form-select-sm w-auto" value={empresa} aria-label="Empresa"
                    onChange={(e) => setEmpresa(e.target.value ? Number(e.target.value) : "")}>
                    <option value="">Todas las empresas</option>
                    {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
                {ventas && (
                    <span className="ms-auto small">
                        <span className="text-body-secondary">{ventas.length} salida(s) · </span>
                        <span className="fw-bold">{dinero(totalVisible)}</span>
                    </span>
                )}
            </div>

            {error ? (
                <div className="alert alert-danger m-3">{error}</div>
            ) : !ventas ? (
                <SkeletonTable columnas={7} filas={4} />
            ) : ventas.length === 0 ? (
                <p className="text-center text-body-secondary py-5 mb-0">
                    <i className="bi bi-inbox fs-3 d-block mb-2" aria-hidden="true"></i>
                    {filtro === "pendiente" ? "No hay líneas pendientes de verificar." : "No hay ventas con este filtro."}
                </p>
            ) : (
                <div className="table-responsive">
                    <table className="table tabla-datos mb-0">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Lote</th>
                                <th className="num">Cajas</th>
                                <th className="num">Kilos</th>
                                <th className="num">Precio/kg</th>
                                <th className="num">Importe</th>
                                <th>Verificación</th>
                                {editable && <th className="text-end">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {ventas.map((v) => {
                                const porVerificar = v.lineas.filter((l) => l.estado === "pendiente");
                                return (
                                    <Fragment key={`${v.salida_id}-${v.empresa.id}`}>
                                        <tr className="table-light">
                                            <td colSpan={5}>
                                                <span className="fw-semibold">{fecha(v.fecha)}</span>
                                                <span className="mx-2">·</span>Salida <span className="fw-semibold">{v.folio_salida}</span>
                                                <span className="mx-2">·</span>Nota <span className="fw-semibold">{v.nota_salida || "—"}</span>
                                                <span className="small text-body-secondary ms-2">{v.empresa.nombre}</span>
                                            </td>
                                            <td className="num fw-bold">{dinero(v.total)}</td>
                                            <td></td>
                                            {editable && (
                                                <td className="text-end text-nowrap">
                                                    {porVerificar.length > 1 && (
                                                        <button type="button" className="btn btn-sm btn-outline-success"
                                                            onClick={() => marcar(porVerificar, "verificada")}>
                                                            <i className="bi bi-check2-all me-1" aria-hidden="true"></i>Verificar todas ({porVerificar.length})
                                                        </button>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                        {v.lineas.map((l) => {
                                            const badge = BADGE[l.estado];
                                            return (
                                                <tr key={l.id}>
                                                    <td className="ps-4">{l.producto}</td>
                                                    <td className="small">{l.lote || "—"}</td>
                                                    <td className="num">{l.cajas}</td>
                                                    <td className="num">{formatearKg(l.kilos)}</td>
                                                    <td className="num">{l.precio_kilo !== null ? formatearPrecioKg(l.precio_kilo) : "—"}</td>
                                                    <td className="num fw-semibold">{l.importe !== null ? dinero(l.importe) : "—"}</td>
                                                    <td>
                                                        <span className={`badge border ${badge.clase}`}>
                                                            <i className={`bi ${badge.icono} me-1`} aria-hidden="true"></i>{badge.texto}
                                                        </span>
                                                        {l.corregida_por_inventario && (
                                                            <span className="badge border bg-info-subtle text-info-emphasis border-info-subtle ms-1"
                                                                title="Inventario corrigió la línea después de la revisión">
                                                                Corregida por Inventario
                                                            </span>
                                                        )}
                                                        {l.estado === "sin_precio" && <div className="small text-body-secondary">Inventario debe capturar el precio.</div>}
                                                        {l.comentario && <div className="small text-danger-emphasis">{l.comentario}</div>}
                                                        {l.verificado_por && (
                                                            <div className="small text-body-secondary">
                                                                {l.verificado_por} · {formatearFechaNumerica(l.verificado_en ? new Date(l.verificado_en) : null, "numerico-hora")}
                                                            </div>
                                                        )}
                                                    </td>
                                                    {editable && (
                                                        <td className="text-end text-nowrap">
                                                            {l.estado === "pendiente" && (
                                                                <button type="button" className="btn btn-sm btn-success me-1" title="Coincide con la nota"
                                                                    onClick={() => marcar([l], "verificada")}>
                                                                    <i className="bi bi-check-lg" aria-hidden="true"></i>
                                                                    <span className="visually-hidden">Verificar {l.producto}</span>
                                                                </button>
                                                            )}
                                                            {(l.estado === "pendiente" || l.estado === "verificada") && (
                                                                <button type="button" className="btn btn-sm btn-outline-danger me-1" title="No coincide: reportar a Inventario"
                                                                    onClick={() => setDiferencia({ lineas: [l], folio: v.folio_salida })}>
                                                                    <i className="bi bi-exclamation-triangle" aria-hidden="true"></i>
                                                                    <span className="visually-hidden">Reportar diferencia en {l.producto}</span>
                                                                </button>
                                                            )}
                                                            {(l.estado === "verificada" || l.estado === "diferencia") && (
                                                                <button type="button" className="btn btn-sm btn-outline-secondary" title="Regresar a pendiente"
                                                                    onClick={() => marcar([l], "pendiente")}>
                                                                    <i className="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
                                                                    <span className="visually-hidden">Regresar {l.producto} a pendiente</span>
                                                                </button>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal title="Reportar diferencia a Inventario" show={diferencia !== null} onClose={() => setDiferencia(null)}>
                {diferencia && (
                    <ReportarDiferencia
                        descripcion={`${diferencia.lineas.map((l) => l.producto).join(", ")} de la salida ${diferencia.folio}`}
                        onCancelar={() => setDiferencia(null)}
                        onGuardar={async (comentario) => {
                            await marcar(diferencia.lineas, "diferencia", comentario);
                            setDiferencia(null);
                        }}
                    />
                )}
            </Modal>
        </>
    );
}

function ReportarDiferencia({ descripcion, onGuardar, onCancelar }: {
    descripcion: string;
    onGuardar: (comentario: string) => Promise<void>;
    onCancelar: () => void;
}) {
    const [comentario, setComentario] = useState("");
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function guardar() {
        if (!comentario.trim()) return setError("Describe qué no coincide con la nota.");
        setGuardando(true);
        try {
            await onGuardar(comentario.trim());
        } catch (err) {
            setError(obtenerMensajeError(err));
        } finally {
            setGuardando(false);
        }
    }

    return (
        <>
            <p className="mb-2">
                <strong>{descripcion}</strong> no coincide con la nota en papel. Inventario verá este comentario en la salida para
                corregirla; al corregirla, la línea vuelve a pendientes para revisarla de nuevo.
            </p>
            <label className="form-label" htmlFor="comentario-diferencia">¿Qué no coincide? <span className="text-danger">*</span></label>
            <textarea id="comentario-diferencia" className="form-control" rows={3} autoFocus value={comentario}
                placeholder="Ej. En la nota son 18 kg a $125" onChange={(e) => setComentario(e.target.value)} />
            {error && <div className="alert alert-danger py-2 mt-3 mb-0">{error}</div>}
            <div className="d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-outline-secondary" onClick={onCancelar} disabled={guardando}>Cancelar</button>
                <button type="button" className="btn btn-danger" onClick={guardar} disabled={guardando}>
                    <i className="bi bi-send me-1" aria-hidden="true"></i>{guardando ? "Enviando..." : "Reportar"}
                </button>
            </div>
        </>
    );
}

export default VentasCliente;
