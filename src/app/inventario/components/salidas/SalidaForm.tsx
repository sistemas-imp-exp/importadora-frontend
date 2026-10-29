import { useMemo, useState } from "react";
import CampoNumero from "../../../../shared/components/CampoNumero";
import LoadingButton from "../../../../shared/components/LoadingButton";
import SelectorLotesModal from "./SelectorLotesModal";
import { construirLotesDisponibles, type LoteDisponible, type Reservado } from "../../utils/lotesDisponibles";
import { referenciaSalida, type CrearSalidaLineaRequest, type CrearSalidaRequest, type SalidaApi } from "../../interfaces/salidas/Salida";
import type { ExistenciaApi } from "../../interfaces/existencias/Existencia";
import type { Cliente } from "../../interfaces/clientes/Cliente";
import { formatearDinero, formatearPeso } from "../../utils/existencias";
import { formatearKg } from "../../../../shared/utils/numeros";

interface SalidaFormProps {
    clientes: Cliente[];
    existencias: ExistenciaApi[];
    salida?: SalidaApi | null;
    onGuardar: (salida: CrearSalidaRequest) => Promise<void>;
    onCancelar?: () => void;
}

interface LineaForm {
    id?: number;
    entrada_detalle: number;
    producto_id: number;
    // La cámara NO se captura aquí: la hereda el backend del lote de origen
    // (ver SalidaSerializer). Cambiarla es exclusivo de Movimientos entre cámaras.
    cajas: string;
    // peso_por_caja no se guarda en la línea: se lee del lote (loteDe), que
    // puede llegar después de montar el formulario al editar una salida.
    total_kilos: string;
    precio_x_kilo: string;
    total_venta: string;
    notas: string;
    // Parte de lo vendido que el cliente deja guardado: se cobra todo, pero del
    // lote solo sale lo entregado (cajas/kilos − resguardo).
    cajas_resguardo: string;
    kilos_resguardo: string;
    // Lo ya entregado de ese resguardo (retiros): el resguardo no puede bajar de ahí.
    kilos_retirados: number;
}

const CLASE_ETIQUETA = "form-label small text-uppercase fw-semibold text-body-secondary mb-1";

function cabeceraVacia() {
    return { folio_de_salida: "", cliente_id: 0, fecha: "", notas: "" };
}

type Cabecera = ReturnType<typeof cabeceraVacia>;
interface ErrorLinea {
    cajas?: string;
    total_kilos?: string;
    resguardo?: string;
}

/** Lo que sale físicamente del lote en esta línea: lo vendido menos lo que queda en resguardo. */
function entregado(linea: LineaForm): { cajas: number; kilos: number } {
    return {
        cajas: (Number(linea.cajas) || 0) - (Number(linea.cajas_resguardo) || 0),
        kilos: (Number(linea.total_kilos) || 0) - (Number(linea.kilos_resguardo) || 0),
    };
}

/**
 * Errores por campo, para marcar en rojo (Bootstrap is-invalid) solo lo que falta.
 * Sin folio solo si no sale nada de la cámara (todo queda en resguardo).
 */
function validarCabeceraCampos(cabecera: Cabecera, todoEnResguardo: boolean): Partial<Record<keyof Cabecera, string>> {
    const errores: Partial<Record<keyof Cabecera, string>> = {};
    if (!cabecera.folio_de_salida.trim() && !todoEnResguardo) {
        errores.folio_de_salida = "El folio de salida es obligatorio si sale producto de la cámara.";
    }
    if (!cabecera.cliente_id) errores.cliente_id = "Selecciona un cliente.";
    if (!cabecera.fecha) errores.fecha = "La fecha es obligatoria.";
    if (!cabecera.notas.trim()) errores.notas = "La nota de salida es obligatoria.";
    return errores;
}

function validarLineaCampos(linea: LineaForm, lote: LoteDisponible | null): ErrorLinea {
    const errores: ErrorLinea = {};
    // 0 es válido: es peso suelto de una caja ya abierta, no una venta por caja.
    const sale = entregado(linea);
    if (linea.cajas === "" || Number(linea.cajas) < 0) {
        errores.cajas = "Ingresa las cajas (0 si es peso suelto).";
    } else if (lote && sale.cajas > lote.cajasDisponibles) {
        errores.cajas = `Solo hay ${lote.cajasDisponibles} disponibles para entregar.`;
    }
    if (!linea.total_kilos || Number(linea.total_kilos) <= 0) {
        errores.total_kilos = "Ingresa el total de kilos.";
    } else if (lote && sale.kilos > Number(lote.kilosDisponibles)) {
        errores.total_kilos = `Solo hay ${formatearKg(lote.kilosDisponibles)} kg disponibles para entregar.`;
    }
    const kilosResguardo = Number(linea.kilos_resguardo) || 0;
    if (sale.kilos < 0 || sale.cajas < 0) {
        errores.resguardo = "El resguardo no puede ser mayor que lo vendido.";
    } else if (kilosResguardo < linea.kilos_retirados) {
        errores.resguardo = `Ya se entregaron ${formatearKg(linea.kilos_retirados)} kg de este resguardo.`;
    }
    return errores;
}

function cabeceraDesdeSalida(salida?: SalidaApi | null): Cabecera {
    if (!salida) return cabeceraVacia();
    return {
        folio_de_salida: salida.folio_de_salida ?? "",
        cliente_id: salida.cliente?.id ?? 0,
        fecha: salida.fecha,
        notas: salida.notas,
    };
}

function lineasDesdeSalida(salida: SalidaApi): LineaForm[] {
    return salida.detalles.map((d) => ({
        id: d.id,
        entrada_detalle: d.entrada_detalle,
        producto_id: d.producto.id,
        cajas: String(d.cajas),
        total_kilos: d.total_kilos,
        precio_x_kilo: d.precio_x_kilo ?? "",
        total_venta: d.total_venta ?? "",
        notas: d.notas ?? "",
        cajas_resguardo: d.cajas_resguardo ? String(d.cajas_resguardo) : "",
        kilos_resguardo: Number(d.kilos_resguardo) ? d.kilos_resguardo : "",
        kilos_retirados: Number(d.kilos_retirados) || 0,
    }));
}

function SalidaForm({ clientes, existencias, salida, onGuardar, onCancelar }: SalidaFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // El estado arranca desde `salida`; para cambiar de registro el padre
    // remonta el formulario con otra `key` (ver SalidasView).
    const [cabecera, setCabecera] = useState(() => cabeceraDesdeSalida(salida));
    const [lineas, setLineas] = useState<LineaForm[]>(() => (salida ? lineasDesdeSalida(salida) : []));
    const [modalAbierto, setModalAbierto] = useState(false);
    const [erroresCabecera, setErroresCabecera] = useState<Partial<Record<keyof Cabecera, string>>>({});
    const [erroresLineas, setErroresLineas] = useState<Record<number, ErrorLinea>>({});

    // Al editar, esta salida ya tenía tomadas ciertas cajas y kilos de sus lotes
    // (solo lo entregado: el resguardo sigue en la cámara): se le suman de vuelta
    // a lo disponible, porque al guardar se reemplazan, no se suman.
    const yaReservado = useMemo(() => {
        const mapa: Record<number, Reservado> = {};
        if (salida) {
            for (const d of salida.detalles) {
                const actual = mapa[d.entrada_detalle] ?? { cajas: 0, kilos: 0 };
                mapa[d.entrada_detalle] = {
                    cajas: actual.cajas + d.cajas - d.cajas_resguardo,
                    kilos: actual.kilos + Number(d.total_kilos) - Number(d.kilos_resguardo),
                };
            }
        }
        return mapa;
    }, [salida]);

    const lotesDisponibles = useMemo(
        () => construirLotesDisponibles(existencias, yaReservado),
        [existencias, yaReservado]
    );

    const loteDe = (entradaDetalleId: number): LoteDisponible | null =>
        lotesDisponibles.find((l) => l.entradaDetalleId === entradaDetalleId) ?? null;

    function actualizarCabecera(cambios: Partial<Cabecera>) {
        setCabecera((actual) => ({ ...actual, ...cambios }));
        // Quita el marcado en rojo del campo apenas el usuario lo corrige, sin
        // esperar a que vuelva a intentar guardar.
        setErroresCabecera((actual) => {
            if (Object.keys(actual).length === 0) return actual;
            const copia = { ...actual };
            for (const campo of Object.keys(cambios)) delete copia[campo as keyof Cabecera];
            return copia;
        });
    }

    function actualizarLinea(index: number, cambios: Partial<LineaForm>) {
        setLineas((actual) =>
            actual.map((linea, i) => {
                if (i !== index) return linea;
                const nueva = { ...linea, ...cambios };

                const pesoPorCaja = Number(loteDe(nueva.entrada_detalle)?.pesoPorCaja);
                if ("cajas" in cambios) {
                    const cajas = Number(nueva.cajas);
                    if (cajas > 0 && pesoPorCaja > 0) {
                        nueva.total_kilos = (cajas * pesoPorCaja).toFixed(3);
                    }
                }
                if ("cajas_resguardo" in cambios) {
                    const cajas = Number(nueva.cajas_resguardo);
                    if (cajas > 0 && pesoPorCaja > 0) nueva.kilos_resguardo = (cajas * pesoPorCaja).toFixed(3);
                    if (nueva.cajas_resguardo === "") nueva.kilos_resguardo = "";
                }

                // Las cajas también cambian los kilos (arriba): sin recalcular aquí,
                // el total se quedaba con el de los kilos anteriores.
                if ("cajas" in cambios || "total_kilos" in cambios || "precio_x_kilo" in cambios) {
                    const kilos = Number(nueva.total_kilos);
                    const precio = Number(nueva.precio_x_kilo);
                    if (kilos > 0 && precio > 0) {
                        nueva.total_venta = (kilos * precio).toFixed(2);
                    }
                }
                return nueva;
            })
        );

        const tocaResguardo = "cajas_resguardo" in cambios || "kilos_resguardo" in cambios;
        if ("cajas" in cambios || "total_kilos" in cambios || tocaResguardo) {
            const entradaDetalle = lineas[index]?.entrada_detalle;
            if (entradaDetalle !== undefined) {
                setErroresLineas((actual) => {
                    if (!actual[entradaDetalle]) return actual;
                    const copiaLinea = { ...actual[entradaDetalle] };
                    if ("cajas" in cambios || tocaResguardo) delete copiaLinea.cajas;
                    if ("total_kilos" in cambios || tocaResguardo) delete copiaLinea.total_kilos;
                    if (tocaResguardo || "cajas" in cambios || "total_kilos" in cambios) delete copiaLinea.resguardo;
                    return { ...actual, [entradaDetalle]: copiaLinea };
                });
            }
        }
    }

    /**
     * Las cajas se topan a la existencia del lote (más lo que quede en resguardo,
     * que no sale de la cámara). Se avisa en vez de recortar en silencio: capear
     * sin decirlo hace creer que se registró lo tecleado.
     */
    function cambiarCajas(index: number, valor: string) {
        const linea = lineas[index];
        const lote = loteDe(linea.entrada_detalle);
        const maximo = lote ? lote.cajasDisponibles + (Number(linea.cajas_resguardo) || 0) : Infinity;

        if (lote && Number(valor) > maximo) {
            setError(
                `${lote.productoNombre} (lote ${lote.loteProveedor}): ` +
                `solo hay ${lote.cajasDisponibles} cajas disponibles para entregar, se ajustó a ese máximo.`
            );
            actualizarLinea(index, { cajas: String(maximo) });
            return;
        }

        setError(null);
        actualizarLinea(index, { cajas: valor });
    }

    /** Mismo criterio que cambiarCajas, pero contra los kilos disponibles del lote. */
    function cambiarTotalKilos(index: number, valor: string) {
        const linea = lineas[index];
        const lote = loteDe(linea.entrada_detalle);
        const maximo = lote ? Number(lote.kilosDisponibles) + (Number(linea.kilos_resguardo) || 0) : Infinity;

        if (lote && Number(valor) > maximo) {
            setError(
                `${lote.productoNombre} (lote ${lote.loteProveedor}): ` +
                `solo hay ${formatearKg(lote.kilosDisponibles)} kg disponibles para entregar, se ajustó a ese máximo.`
            );
            actualizarLinea(index, { total_kilos: maximo.toFixed(3) });
            return;
        }

        setError(null);
        actualizarLinea(index, { total_kilos: valor });
    }

    function agregarLotes(elegidos: LoteDisponible[]) {
        setLineas((actual) => [
            ...actual,
            ...elegidos.map((lote) => ({
                entrada_detalle: lote.entradaDetalleId,
                producto_id: lote.productoId,
                // Arranca en 0, no vacío: la mayoría de las veces sí se captura
                // un número de cajas, pero si es puro peso suelto (ver nota arriba
                // de la tabla) el 0 ya es válido sin que haya que tocar el campo.
                cajas: "0",
                total_kilos: "",
                precio_x_kilo: lote.precioVentaPlaneado ?? "",
                total_venta: "",
                notas: "",
                cajas_resguardo: "",
                kilos_resguardo: "",
                kilos_retirados: 0,
            })),
        ]);
        setModalAbierto(false);
        setError(null);
    }

    function quitarLinea(index: number) {
        setLineas((actual) => actual.filter((_, i) => i !== index));
    }

    // Nada sale de la cámara: la venta queda completa en resguardo y no lleva folio de salida.
    const todoEnResguardo = lineas.length > 0 && lineas.every((l) => {
        const sale = entregado(l);
        return sale.kilos === 0 && sale.cajas === 0;
    });

    function validar(): string | null {
        const erroresCab = validarCabeceraCampos(cabecera, todoEnResguardo);
        setErroresCabecera(erroresCab);
        if (Object.keys(erroresCab).length > 0) {
            return "Revisa los campos marcados en rojo en los datos de la salida.";
        }

        if (lineas.length === 0) return "Agrega al menos un producto con el buscador de facturas o recibos.";

        const nuevosErroresLineas: Record<number, ErrorLinea> = {};
        for (const linea of lineas) {
            const errores = validarLineaCampos(linea, loteDe(linea.entrada_detalle));
            if (Object.keys(errores).length > 0) nuevosErroresLineas[linea.entrada_detalle] = errores;
        }
        setErroresLineas(nuevosErroresLineas);
        if (Object.keys(nuevosErroresLineas).length > 0) {
            return "Revisa los campos marcados en rojo en la tabla de productos.";
        }
        return null;
    }

    async function guardar(e: React.SyntheticEvent) {
        e.preventDefault();
        setError(null);

        const mensaje = validar();
        if (mensaje) {
            setError(mensaje);
            return;
        }

        const payload: CrearSalidaRequest = {
            folio_de_salida: cabecera.folio_de_salida.trim().toUpperCase(),
            cliente_id: cabecera.cliente_id,
            fecha: cabecera.fecha,
            notas: cabecera.notas.trim().toUpperCase(),
            detalles: lineas.map((linea): CrearSalidaLineaRequest => ({
                ...(linea.id ? { id: linea.id } : {}),
                producto_id: linea.producto_id,
                entrada_detalle: linea.entrada_detalle,
                cajas: Number(linea.cajas),
                total_kilos: Number(linea.total_kilos),
                precio_x_kilo: linea.precio_x_kilo === "" ? null : Number(linea.precio_x_kilo),
                total_venta: linea.total_venta === "" ? null : Number(linea.total_venta),
                notas: linea.notas.trim().toUpperCase(),
                cajas_resguardo: Number(linea.cajas_resguardo) || 0,
                kilos_resguardo: Number(linea.kilos_resguardo) || 0,
            })),
        };

        setIsLoading(true);
        try {
            await onGuardar(payload);
            if (!salida) {
                setCabecera(cabeceraVacia());
                setLineas([]);
                setErroresCabecera({});
                setErroresLineas({});
            }
        } catch {
            // El error ya se muestra vía toast en la vista; el formulario conserva los datos para corregir.
        } finally {
            setIsLoading(false);
        }
    }

    const totalCajas = lineas.reduce((acc, l) => acc + (Number(l.cajas) || 0), 0);
    const totalKilos = lineas.reduce((acc, l) => acc + (Number(l.total_kilos) || 0), 0);
    const totalVenta = lineas.reduce((acc, l) => acc + (Number(l.total_venta) || 0), 0);
    const totalResguardo = lineas.reduce((acc, l) => acc + (Number(l.kilos_resguardo) || 0), 0);

    return (
        <div className={`card card-outline mb-3 ${salida ? "card-warning" : "card-primary"}`}>
            <div className="card-header d-flex flex-wrap gap-2 justify-content-between align-items-center">
                <h3 className="card-title fs-6 fw-bold m-0">
                    {salida ? `Editando salida ${referenciaSalida(salida)}` : "Registrar salida"}
                </h3>
            </div>

            <form onSubmit={guardar}>
                <div className="card-body">
                    {/* ---------- Datos de la salida ---------- */}
                    <section className="mb-4">
                        <h6 className="d-flex align-items-center gap-2 fw-bold border-bottom pb-2 mb-3">
                            <i className="bi bi-box-arrow-up text-body-secondary" aria-hidden="true"></i>
                            Datos de la salida
                        </h6>

                        <div className="row g-3">
                            <div className="col-12 col-sm-6 col-lg-3">
                                <label className={CLASE_ETIQUETA}>
                                    Folio de salida {!todoEnResguardo && <span className="text-danger">*</span>}
                                </label>
                                <input
                                    className={`form-control form-control-sm ${erroresCabecera.folio_de_salida ? "is-invalid" : ""}`}
                                    placeholder={todoEnResguardo ? "No aplica: no sale de cámara" : undefined}
                                    title={todoEnResguardo ? "Todo queda en resguardo: no hay salida de cámara. Cada retiro llevará su folio." : undefined}
                                    value={cabecera.folio_de_salida}
                                    onChange={(e) => actualizarCabecera({ folio_de_salida: e.target.value })}
                                />
                                {erroresCabecera.folio_de_salida && (
                                    <div className="invalid-feedback d-block">{erroresCabecera.folio_de_salida}</div>
                                )}
                            </div>
                            <div className="col-12 col-sm-6 col-lg-3">
                                <label className={CLASE_ETIQUETA}>
                                    Cliente <span className="text-danger">*</span>
                                </label>
                                <select
                                    className={`form-select form-select-sm ${erroresCabecera.cliente_id ? "is-invalid" : ""}`}
                                    value={cabecera.cliente_id}
                                    onChange={(e) => actualizarCabecera({ cliente_id: Number(e.target.value) })}
                                >
                                    <option value={0}>Seleccione cliente...</option>
                                    {clientes.map((c) => (
                                        <option key={c.id} value={c.id} disabled={!c.activo}>{c.nombre}</option>
                                    ))}
                                </select>
                                {erroresCabecera.cliente_id && (
                                    <div className="invalid-feedback d-block">{erroresCabecera.cliente_id}</div>
                                )}
                            </div>
                            <div className="col-12 col-sm-6 col-lg-3">
                                <label className={CLASE_ETIQUETA}>
                                    Fecha <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="date"
                                    className={`form-control form-control-sm ${erroresCabecera.fecha ? "is-invalid" : ""}`}
                                    value={cabecera.fecha}
                                    onChange={(e) => actualizarCabecera({ fecha: e.target.value })}
                                />
                                {erroresCabecera.fecha && <div className="invalid-feedback d-block">{erroresCabecera.fecha}</div>}
                            </div>
                            <div className="col-12 col-sm-6 col-lg-3">
                                <label className={CLASE_ETIQUETA}>
                                    Nota de salida <span className="text-danger">*</span>
                                </label>
                                <input
                                    className={`form-control form-control-sm ${erroresCabecera.notas ? "is-invalid" : ""}`}
                                    placeholder="Folio del documento físico"
                                    value={cabecera.notas}
                                    onChange={(e) => actualizarCabecera({ notas: e.target.value })}
                                />
                                {erroresCabecera.notas && <div className="invalid-feedback d-block">{erroresCabecera.notas}</div>}
                            </div>
                        </div>
                    </section>

                    {/* ---------- Productos a surtir ---------- */}
                    <section>
                        <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center border-bottom pb-2 mb-3">
                            <h6 className="d-flex align-items-center gap-2 fw-bold mb-0">
                                <i className="bi bi-list-check text-body-secondary" aria-hidden="true"></i>
                                Productos a surtir
                                <span className="badge text-bg-secondary">{lineas.length}</span>
                            </h6>
                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setModalAbierto(true)}>
                                <i className="bi bi-search me-1" aria-hidden="true"></i>
                                Buscar por factura o recibo
                            </button>
                        </div>

                        {lineas.length === 0 ? (
                            <div className="text-center text-body-secondary py-4 small">
                                Aún no hay productos. Usa <strong>Buscar por factura o recibo</strong> para elegir
                                los lotes de dónde va a salir la mercancía.
                            </div>
                        ) : (
                            <>
                            <div className="small text-body-secondary mb-2">
                                <i className="bi bi-info-circle me-1" aria-hidden="true"></i>
                                Deja <strong>Cajas</strong> en 0 si vendes peso suelto de una caja ya abierta,
                                sin sacar una caja completa. Si el cliente deja parte guardada, captúrala en
                                {" "}<strong>Resguardo</strong>: se cobra todo y de la cámara solo sale lo entregado.
                            </div>
                            <div className="table-responsive">
                                <table className="table table-sm align-middle mb-0">
                                    <thead>
                                        <tr className="small text-uppercase text-body-secondary">
                                            <th>Origen</th>
                                            <th>Producto</th>
                                            <th>Cámara</th>
                                            <th className="text-end">Cajas disp.</th>
                                            <th className="text-end">Kg disp.</th>
                                            <th className="text-end" style={{ minWidth: "95px" }}>Peso/caja</th>
                                            <th className="text-end" style={{ minWidth: "90px" }}>Cajas</th>
                                            <th className="text-end" style={{ minWidth: "110px" }}>Total kilos</th>
                                            <th className="text-end" style={{ minWidth: "150px" }} title="Lo que el cliente deja guardado: cajas y kg">
                                                Resguardo
                                            </th>
                                            <th className="text-end" style={{ minWidth: "115px" }}>Precio/kg</th>
                                            <th className="text-end" style={{ minWidth: "120px" }}>Total venta</th>
                                            <th style={{ minWidth: "150px" }}>Nota</th>
                                            <th style={{ width: "40px" }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lineas.map((linea, index) => {
                                            const lote = loteDe(linea.entrada_detalle);
                                            const excedida = lote !== null && entregado(linea).cajas > lote.cajasDisponibles;
                                            const erroresLinea = erroresLineas[linea.entrada_detalle] ?? {};
                                            return (
                                                <tr key={linea.entrada_detalle} className={excedida ? "table-danger" : undefined}>
                                                    <td className="text-wrap small">
                                                        <div className="fw-semibold">{lote?.factura || "Sin factura"}</div>
                                                        <div className="text-body-secondary">
                                                            {lote?.recibo ? `Recibo ${lote.recibo} · ` : ""}
                                                            lote {lote?.loteProveedor ?? "—"}
                                                        </div>
                                                    </td>
                                                    <td className="text-wrap fw-semibold">
                                                        {lote ? lote.productoNombre : "—"}
                                                    </td>
                                                    <td className="text-wrap small">{lote?.camaraNombre ?? "—"}</td>
                                                    <td className="text-end small text-body-secondary">
                                                        {lote?.cajasDisponibles ?? "—"}
                                                    </td>
                                                    <td className="text-end small text-body-secondary">
                                                        {lote ? formatearKg(lote.kilosDisponibles) : "—"}
                                                    </td>
                                                    <td className="text-end small text-body-secondary" title="Peso de fábrica del lote, tal como se registró en la entrada. No es editable aquí.">
                                                        {lote ? formatearPeso(Number(lote.pesoPorCaja)) : "—"}
                                                    </td>
                                                    <td>
                                                        <CampoNumero
                                                            decimales={0}
                                                            className={`form-control form-control-sm text-end ${erroresLinea.cajas ? "is-invalid" : ""}`}
                                                            value={linea.cajas}
                                                            onChange={(valor) => cambiarCajas(index, valor)}
                                                        />
                                                        {erroresLinea.cajas && (
                                                            <div className="invalid-feedback d-block">{erroresLinea.cajas}</div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <CampoNumero
                                                            decimales={3}
                                                            className={`form-control form-control-sm text-end fw-bold ${erroresLinea.total_kilos ? "is-invalid" : ""}`}
                                                            value={linea.total_kilos}
                                                            onChange={(valor) => cambiarTotalKilos(index, valor)}
                                                        />
                                                        {erroresLinea.total_kilos && (
                                                            <div className="invalid-feedback d-block">{erroresLinea.total_kilos}</div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="d-flex gap-1">
                                                            <CampoNumero
                                                                decimales={0}
                                                                className={`form-control form-control-sm text-end ${erroresLinea.resguardo ? "is-invalid" : ""}`}
                                                                style={{ maxWidth: "4.5rem" }}
                                                                placeholder="cj"
                                                                aria-label="Cajas en resguardo"
                                                                value={linea.cajas_resguardo}
                                                                onChange={(valor) => actualizarLinea(index, { cajas_resguardo: valor })}
                                                            />
                                                            <CampoNumero
                                                                decimales={3}
                                                                className={`form-control form-control-sm text-end ${erroresLinea.resguardo ? "is-invalid" : ""}`}
                                                                placeholder="kg"
                                                                aria-label="Kilos en resguardo"
                                                                value={linea.kilos_resguardo}
                                                                onChange={(valor) => actualizarLinea(index, { kilos_resguardo: valor })}
                                                            />
                                                        </div>
                                                        {linea.kilos_retirados > 0 && (
                                                            <div className="small text-body-secondary mt-1">
                                                                Entregado: {formatearKg(linea.kilos_retirados)} kg
                                                            </div>
                                                        )}
                                                        {erroresLinea.resguardo && (
                                                            <div className="invalid-feedback d-block">{erroresLinea.resguardo}</div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="input-group input-group-sm">
                                                            <span className="input-group-text">$</span>
                                                            <CampoNumero
                                                                decimales={4}
                                                                className="form-control text-end"
                                                                value={linea.precio_x_kilo}
                                                                onChange={(valor) => actualizarLinea(index, { precio_x_kilo: valor })}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="input-group input-group-sm">
                                                            <span className="input-group-text">$</span>
                                                            <CampoNumero
                                                                className="form-control text-end"
                                                                value={linea.total_venta}
                                                                onChange={(valor) => actualizarLinea(index, { total_venta: valor })}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <input
                                                            className="form-control form-control-sm"
                                                            placeholder="Ej. Guardado en cámara Pacific"
                                                            value={linea.notas}
                                                            onChange={(e) => actualizarLinea(index, { notas: e.target.value })}
                                                        />
                                                    </td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => quitarLinea(index)}
                                                            title="Quitar producto"
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-top">
                                            <td colSpan={6} className="text-end fw-semibold text-uppercase small text-body-secondary">
                                                Totales:
                                            </td>
                                            <td className="text-end fw-bold">{totalCajas}</td>
                                            <td className="text-end fw-bold">{formatearKg(totalKilos)} kg</td>
                                            <td className="text-end fw-semibold">
                                                {totalResguardo > 0 ? `${formatearKg(totalResguardo)} kg` : ""}
                                            </td>
                                            <td></td>
                                            <td className="text-end fw-bold">${formatearDinero(totalVenta)}</td>
                                            <td colSpan={2}></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            </>
                        )}
                    </section>
                </div>

                {error && (
                    <div className="card-footer bg-white border-top-0 py-2 text-danger small fw-semibold">
                        <i className="bi bi-exclamation-circle-fill me-1"></i> {error}
                    </div>
                )}

                <div className="card-footer d-flex justify-content-end gap-2">
                    {salida && onCancelar && (
                        <button type="button" className="btn btn-outline-secondary" onClick={onCancelar}>
                            Cancelar edición
                        </button>
                    )}
                    {isLoading ? (
                        <LoadingButton isLoading={isLoading} text="Guardando..." onClick={() => Promise.resolve()} />
                    ) : (
                        <button type="submit" className="btn btn-primary">
                            <i className="bi bi-save me-1"></i> {salida ? "Guardar cambios" : "Registrar salida"}
                        </button>
                    )}
                </div>
            </form>

            <SelectorLotesModal
                show={modalAbierto}
                lotes={lotesDisponibles}
                yaAgregados={lineas.map((l) => l.entrada_detalle)}
                onAgregar={agregarLotes}
                onCerrar={() => setModalAbierto(false)}
            />
        </div>
    );
}

export default SalidaForm;
