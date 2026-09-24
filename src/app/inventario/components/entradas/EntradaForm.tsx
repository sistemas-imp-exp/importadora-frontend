import { useMemo, useState } from "react";
import LoadingButton from "../../../../shared/components/LoadingButton";
import SearchableSelect from "../../../../shared/components/SearchableSelect";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import type { CrearEntradaLineaRequest, CrearEntradaRequest, EntradaApi } from "../../interfaces/entradas/Entrada";
import type { Proveedor } from "../../interfaces/proveedores/Proveedor";
import type { Camara } from "../../interfaces/camaras/Camara";
import type { Producto } from "../../interfaces/productos/Producto";

interface EntradaFormProps {
    proveedores: Proveedor[];
    camaras: Camara[];
    productos: Producto[];
    entrada?: EntradaApi | null;
    onGuardar: (entrada: CrearEntradaRequest) => Promise<void>;
    onCancelar?: () => void;
}

interface LineaForm {
    // Identificador local estable: key de React y referencia para editar/quitar.
    // No se envía al backend (ese es `id`, presente solo al editar una entrada).
    uid: number;
    id?: number;
    producto_id: number;
    lote_proveedor: string;
    camara: number | "";
    cajas: string;
    peso_por_caja: string;
    total_kilos: string;
    costo_por_kilo: string;
    precio_venta_planeado: string;
    fecha_caducidad: string;
    observaciones: string;
}

const CLASE_ETIQUETA = "form-label small text-uppercase fw-semibold text-body-secondary mb-1";

// Ids de los campos con desplegable: se usan para saber si un Enter viene de un
// SearchableSelect (donde Enter significa "elegir opción", no "agregar línea").
const ID_PRODUCTO = "borrador-producto";
const ID_CAMARA = "borrador-camara";

let contadorUid = 0;
function siguienteUid(): number {
    contadorUid += 1;
    return contadorUid;
}

function lineaVacia(): LineaForm {
    return {
        uid: siguienteUid(),
        producto_id: 0,
        lote_proveedor: "",
        camara: "",
        cajas: "",
        peso_por_caja: "",
        total_kilos: "",
        costo_por_kilo: "",
        precio_venta_planeado: "",
        fecha_caducidad: "",
        observaciones: "",
    };
}

function cabeceraVacia() {
    return { fecha: "", proveedor_id: 0, es_internacional: false, factura: "", pedimento: "", recibo_ingreso: "" };
}

type Cabecera = ReturnType<typeof cabeceraVacia>;

/** Errores por campo, para marcar en rojo (Bootstrap is-invalid) solo lo que falta. */
function validarCabeceraCampos(cabecera: Cabecera): Partial<Record<keyof Cabecera, string>> {
    const errores: Partial<Record<keyof Cabecera, string>> = {};
    if (!cabecera.fecha) errores.fecha = "La fecha es obligatoria.";
    if (!cabecera.proveedor_id) errores.proveedor_id = "Selecciona un proveedor.";
    if (!cabecera.factura.trim()) errores.factura = "La factura es obligatoria.";
    if (cabecera.es_internacional && !cabecera.pedimento.trim()) {
        errores.pedimento = "El pedimento es obligatorio en una entrada internacional.";
    }
    return errores;
}

function validarLineaCampos(linea: LineaForm): Partial<Record<keyof LineaForm, string>> {
    const errores: Partial<Record<keyof LineaForm, string>> = {};
    if (!linea.producto_id) errores.producto_id = "Selecciona el producto.";
    if (!linea.lote_proveedor.trim()) errores.lote_proveedor = "El lote es obligatorio.";
    if (!linea.cajas || Number(linea.cajas) <= 0) errores.cajas = "Ingresa las cajas.";
    // Obligatorio: es lo que permite calcular cajas disponibles en Salidas a
    // partir de los kilos que queden del lote (ver Existencias/Salidas).
    if (!linea.peso_por_caja || Number(linea.peso_por_caja) <= 0) errores.peso_por_caja = "Ingresa el peso por caja.";
    if (!linea.total_kilos || Number(linea.total_kilos) <= 0) errores.total_kilos = "Ingresa el total de kilos.";
    return errores;
}

function cabeceraDesdeEntrada(entrada?: EntradaApi | null): Cabecera {
    if (!entrada) return cabeceraVacia();
    return {
        fecha: entrada.fecha,
        proveedor_id: entrada.proveedor?.id ?? 0,
        es_internacional: entrada.es_internacional,
        factura: entrada.factura,
        pedimento: entrada.pedimento,
        recibo_ingreso: entrada.recibo_ingreso,
    };
}

function lineasDesdeEntrada(entrada: EntradaApi): LineaForm[] {
    return entrada.detalles.map((d) => ({
        uid: siguienteUid(),
        id: d.id,
        producto_id: d.producto.id,
        lote_proveedor: d.lote_proveedor,
        camara: d.camara ?? "",
        cajas: String(d.cajas),
        peso_por_caja: d.peso_por_caja,
        total_kilos: d.total_kilos,
        costo_por_kilo: d.costo_por_kilo ?? "",
        precio_venta_planeado: d.precio_venta_planeado ?? "",
        fecha_caducidad: d.fecha_caducidad ?? "",
        observaciones: d.observaciones,
    }));
}

/** ¿El formulario de captura tiene algo escrito sin agregar todavía? */
function borradorTieneDatos(linea: LineaForm): boolean {
    return (
        linea.producto_id !== 0 ||
        linea.lote_proveedor.trim() !== "" ||
        linea.cajas !== "" ||
        linea.peso_por_caja !== "" ||
        linea.total_kilos !== "" ||
        linea.costo_por_kilo !== "" ||
        linea.precio_venta_planeado !== "" ||
        linea.observaciones.trim() !== ""
    );
}

function EntradaForm({ proveedores, camaras, productos, entrada, onGuardar, onCancelar }: EntradaFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // El estado arranca desde `entrada`; para cambiar de registro el padre
    // remonta el formulario con otra `key` (ver EntradasView).
    const [cabecera, setCabecera] = useState(() => cabeceraDesdeEntrada(entrada));
    const [lineas, setLineas] = useState<LineaForm[]>(() => (entrada ? lineasDesdeEntrada(entrada) : []));
    const [borrador, setBorrador] = useState<LineaForm>(lineaVacia);
    const [editandoUid, setEditandoUid] = useState<number | null>(null);
    const [erroresCabecera, setErroresCabecera] = useState<Partial<Record<keyof Cabecera, string>>>({});
    const [erroresLinea, setErroresLinea] = useState<Partial<Record<keyof LineaForm, string>>>({});

    const opcionesProducto = useMemo(
        () => productos.map((p) => ({ value: p.id, label: `${p.talla} ${p.tipo}`, disabled: !p.activo })),
        [productos]
    );
    const opcionesCamara = useMemo(
        () => camaras.map((c) => ({ value: c.id, label: c.nombre, disabled: !c.activo })),
        [camaras]
    );

    const totalCajas = lineas.reduce((acc, l) => acc + (Number(l.cajas) || 0), 0);
    const totalKilos = lineas.reduce((acc, l) => acc + (Number(l.total_kilos) || 0), 0);

    const indiceEditando = editandoUid !== null ? lineas.findIndex((l) => l.uid === editandoUid) : -1;

    function nombreProducto(id: number): string {
        const producto = productos.find((p) => p.id === id);
        return producto ? `${producto.talla} ${producto.tipo}` : "—";
    }

    function nombreCamara(id: number | ""): string {
        if (id === "") return "Venta directa";
        return camaras.find((c) => c.id === id)?.nombre ?? "—";
    }

    function actualizarBorrador(cambios: Partial<LineaForm>) {
        setBorrador((actual) => {
            const nueva = { ...actual, ...cambios };
            // Total kilos se recalcula solo mientras cajas y kg/caja tengan valor;
            // si no hay peso por caja, el usuario captura el total a mano.
            if ("cajas" in cambios || "peso_por_caja" in cambios) {
                const cajas = Number(nueva.cajas);
                const peso = Number(nueva.peso_por_caja);
                if (cajas > 0 && peso > 0) nueva.total_kilos = (cajas * peso).toFixed(2);
            }
            return nueva;
        });
        // Quita el marcado en rojo del campo apenas el usuario lo corrige, sin
        // esperar a que vuelva a presionar "Agregar línea".
        setErroresLinea((actual) => {
            if (Object.keys(actual).length === 0) return actual;
            const copia = { ...actual };
            for (const campo of Object.keys(cambios)) delete copia[campo as keyof LineaForm];
            return copia;
        });
    }

    function actualizarCabecera(cambios: Partial<Cabecera>) {
        setCabecera((actual) => ({ ...actual, ...cambios }));
        setErroresCabecera((actual) => {
            if (Object.keys(actual).length === 0) return actual;
            const copia = { ...actual };
            for (const campo of Object.keys(cambios)) delete copia[campo as keyof Cabecera];
            return copia;
        });
    }

    function enfocarProducto() {
        document.getElementById(ID_PRODUCTO)?.focus();
    }

    function confirmarLinea() {
        const errores = validarLineaCampos(borrador);
        setErroresLinea(errores);
        if (Object.keys(errores).length > 0) {
            setError("Revisa los campos marcados en rojo antes de agregar la línea.");
            return;
        }
        setError(null);

        if (editandoUid !== null) {
            setLineas((actual) => actual.map((l) => (l.uid === editandoUid ? borrador : l)));
            setEditandoUid(null);
        } else {
            setLineas((actual) => [...actual, borrador]);
        }

        // La cámara y la caducidad casi siempre se repiten dentro de la misma
        // recepción, así que se conservan para la siguiente línea.
        setBorrador({ ...lineaVacia(), camara: borrador.camara, fecha_caducidad: borrador.fecha_caducidad });
        enfocarProducto();
    }

    function editarLinea(uid: number) {
        const linea = lineas.find((l) => l.uid === uid);
        if (!linea) return;
        setBorrador(linea);
        setEditandoUid(uid);
        setError(null);
        setErroresLinea({});
        enfocarProducto();
    }

    /** Limpia la sección de captura: cancela una edición en curso o solo borra lo escrito. */
    function cancelarEdicionLinea() {
        setBorrador(lineaVacia());
        setEditandoUid(null);
        setError(null);
        setErroresLinea({});
    }

    /** Copia la línea al formulario como una nueva (sin `id`) para capturar otra parecida. */
    function duplicarLinea(uid: number) {
        const linea = lineas.find((l) => l.uid === uid);
        if (!linea) return;
        const copia: LineaForm = { ...linea, uid: siguienteUid() };
        delete copia.id;
        setBorrador(copia);
        setEditandoUid(null);
        setError(null);
        setErroresLinea({});
        enfocarProducto();
    }

    function quitarLinea(uid: number) {
        setLineas((actual) => actual.filter((l) => l.uid !== uid));
        if (editandoUid === uid) cancelarEdicionLinea();
    }

    /** Enter dentro de la sección de captura agrega la línea en vez de enviar el formulario. */
    function manejarEnterCaptura(e: React.KeyboardEvent<HTMLElement>) {
        if (e.key !== "Enter") return;
        e.preventDefault();
        const id = (e.target as HTMLElement).id;
        // En los desplegables Enter significa "elegir la opción resaltada".
        if (id === ID_PRODUCTO || id === ID_CAMARA) return;
        confirmarLinea();
    }

    function validar(): string | null {
        const erroresCab = validarCabeceraCampos(cabecera);
        setErroresCabecera(erroresCab);
        if (Object.keys(erroresCab).length > 0) {
            return "Revisa los campos marcados en rojo en la información de recepción.";
        }
        if (editandoUid !== null) return "Termina de editar la línea abierta (Actualizar o Cancelar) antes de guardar.";
        if (borradorTieneDatos(borrador)) {
            return "Tienes una línea capturada sin agregar. Presiona 'Agregar línea' o límpiala antes de guardar.";
        }
        if (lineas.length === 0) return "Agregue al menos una línea.";
        return null;
    }

    async function guardar(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const mensaje = validar();
        if (mensaje) {
            setError(mensaje);
            return;
        }

        const payload: CrearEntradaRequest = {
            fecha: cabecera.fecha,
            proveedor_id: cabecera.proveedor_id,
            es_internacional: cabecera.es_internacional,
            factura: cabecera.factura.trim().toUpperCase(),
            pedimento: cabecera.pedimento.trim().toUpperCase(),
            recibo_ingreso: cabecera.recibo_ingreso.trim().toUpperCase(),
            detalles: lineas.map((linea): CrearEntradaLineaRequest => ({
                ...(linea.id ? { id: linea.id } : {}),
                producto_id: linea.producto_id,
                lote_proveedor: linea.lote_proveedor.trim().toUpperCase(),
                camara: linea.camara === "" ? null : Number(linea.camara),
                cajas: Number(linea.cajas),
                peso_por_caja: Number(linea.peso_por_caja),
                total_kilos: Number(linea.total_kilos),
                costo_por_kilo: linea.costo_por_kilo === "" ? null : Number(linea.costo_por_kilo),
                precio_venta_planeado: linea.precio_venta_planeado === "" ? null : Number(linea.precio_venta_planeado),
                fecha_caducidad: linea.fecha_caducidad === "" ? null : linea.fecha_caducidad,
                observaciones: linea.observaciones.trim().toUpperCase(),
            })),
        };

        setIsLoading(true);
        try {
            await onGuardar(payload);
            if (!entrada) {
                setCabecera(cabeceraVacia());
                setLineas([]);
                setBorrador(lineaVacia());
                setEditandoUid(null);
                setErroresCabecera({});
                setErroresLinea({});
            }
        } catch {
            // El error ya se muestra vía toast en la vista; el formulario conserva los datos para corregir.
        } finally {
            setIsLoading(false);
        }
    }

    const editando = editandoUid !== null;

    return (
        <div className={`card card-outline mb-3 ${entrada ? "card-warning" : "card-primary"}`}>
            <div className="card-header d-flex flex-wrap gap-2 justify-content-between align-items-center">
                <h3 className="card-title fs-6 fw-bold m-0">
                    {entrada ? `Editando entrada #${entrada.id}` : "Registrar entrada"}
                </h3>
                <div className="btn-group btn-group-sm" role="group" aria-label="Tipo de entrada">
                    <button
                        type="button"
                        className={`btn ${cabecera.es_internacional ? "btn-outline-secondary" : "btn-primary"}`}
                        onClick={() => actualizarCabecera({ es_internacional: false, pedimento: "" })}
                    >
                        Nacional
                    </button>
                    <button
                        type="button"
                        className={`btn ${cabecera.es_internacional ? "btn-primary" : "btn-outline-secondary"}`}
                        onClick={() => actualizarCabecera({ es_internacional: true })}
                    >
                        Importación
                    </button>
                </div>
            </div>

            <form onSubmit={guardar}>
                <div className="card-body">
                    {/* ---------- Información de recepción ---------- */}
                    <section className="mb-4">
                        <h6 className="d-flex align-items-center gap-2 fw-bold border-bottom pb-2 mb-3">
                            <i className="bi bi-truck text-body-secondary" aria-hidden="true"></i>
                            Información de recepción
                        </h6>

                        <div className="row g-3">
                            <div className="col-12 col-sm-6 col-lg-3">
                                <label className={CLASE_ETIQUETA}>
                                    Fecha de recepción <span className="text-danger">*</span>
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
                                    Proveedor <span className="text-danger">*</span>
                                </label>
                                <select
                                    className={`form-select form-select-sm ${erroresCabecera.proveedor_id ? "is-invalid" : ""}`}
                                    value={cabecera.proveedor_id}
                                    onChange={(e) => actualizarCabecera({ proveedor_id: Number(e.target.value) })}
                                >
                                    <option value={0}>Seleccione proveedor...</option>
                                    {proveedores.map((p) => (
                                        <option key={p.id} value={p.id} disabled={!p.activo}>{p.nombre}</option>
                                    ))}
                                </select>
                                {erroresCabecera.proveedor_id && <div className="invalid-feedback d-block">{erroresCabecera.proveedor_id}</div>}
                            </div>
                            <div className="col-12 col-sm-6 col-lg-3">
                                <label className={CLASE_ETIQUETA}>
                                    N° factura / remisión <span className="text-danger">*</span>
                                </label>
                                <input
                                    className={`form-control form-control-sm ${erroresCabecera.factura ? "is-invalid" : ""}`}
                                    placeholder="Ej. FAC-2026-0891"
                                    value={cabecera.factura}
                                    onChange={(e) => actualizarCabecera({ factura: e.target.value })}
                                />
                                {erroresCabecera.factura && <div className="invalid-feedback d-block">{erroresCabecera.factura}</div>}
                            </div>
                            {cabecera.es_internacional && (
                                <div className="col-12 col-sm-6 col-lg-3">
                                    <label className={CLASE_ETIQUETA}>
                                        Pedimento <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        className={`form-control form-control-sm ${erroresCabecera.pedimento ? "is-invalid" : ""}`}
                                        value={cabecera.pedimento}
                                        onChange={(e) => actualizarCabecera({ pedimento: e.target.value })}
                                    />
                                    {erroresCabecera.pedimento && <div className="invalid-feedback d-block">{erroresCabecera.pedimento}</div>}
                                </div>
                            )}
                            <div className="col-12 col-sm-6 col-lg-3">
                                <label className={CLASE_ETIQUETA}>
                                    Recibo de ingreso
                                    <i
                                        className="bi bi-info-circle ms-1"
                                        title="Si lo llenas, agrupa las líneas que van a resguardo (misma cámara). Las de venta directa no se ven afectadas."
                                        aria-hidden="true"
                                    ></i>
                                </label>
                                <input
                                    className="form-control form-control-sm"
                                    placeholder="Ej. IMP1797 (opcional)"
                                    value={cabecera.recibo_ingreso}
                                    onChange={(e) => actualizarCabecera({ recibo_ingreso: e.target.value })}
                                />
                            </div>
                        </div>
                    </section>

                    {/* ---------- Captura de una línea ---------- */}
                    <section
                        className={`mb-4 ${editando ? "border-start border-warning border-3 ps-3" : ""}`}
                        onKeyDown={manejarEnterCaptura}
                    >
                        <h6 className="d-flex align-items-center gap-2 fw-bold border-bottom pb-2 mb-3">
                            <i className="bi bi-box-seam text-body-secondary" aria-hidden="true"></i>
                            {editando ? `Editando línea ${indiceEditando + 1}` : "Agregar producto"}
                        </h6>

                        {editando && (
                            <div className="alert alert-warning d-flex flex-wrap gap-2 justify-content-between align-items-center py-2" role="alert">
                                <span>
                                    <i className="bi bi-pencil-square me-2" aria-hidden="true"></i>
                                    Estás editando la línea {indiceEditando + 1} de la lista. Presiona <strong>Actualizar línea</strong> para
                                    guardar el cambio o <strong>Cancelar edición</strong> para dejarla como estaba.
                                </span>
                                <button type="button" className="btn btn-sm btn-warning" onClick={cancelarEdicionLinea}>
                                    Cancelar edición
                                </button>
                            </div>
                        )}

                        <div className="row g-3">
                            <div className="col-12 col-md-5">
                                <label className={CLASE_ETIQUETA} htmlFor={ID_PRODUCTO}>
                                    Producto <span className="text-danger">*</span>
                                </label>
                                <SearchableSelect
                                    id={ID_PRODUCTO}
                                    className={`form-control form-control-sm ${erroresLinea.producto_id ? "is-invalid" : ""}`}
                                    placeholder="Buscar producto..."
                                    options={opcionesProducto}
                                    value={borrador.producto_id === 0 ? "" : borrador.producto_id}
                                    onChange={(v) => actualizarBorrador({ producto_id: v === "" ? 0 : v })}
                                />
                                {erroresLinea.producto_id && <div className="invalid-feedback d-block">{erroresLinea.producto_id}</div>}
                            </div>
                            <div className="col-6 col-md-3">
                                <label className={CLASE_ETIQUETA}>
                                    Lote <span className="text-danger">*</span>
                                </label>
                                <input
                                    className={`form-control form-control-sm ${erroresLinea.lote_proveedor ? "is-invalid" : ""}`}
                                    placeholder="Ej. L-0982-A"
                                    value={borrador.lote_proveedor}
                                    onChange={(e) => actualizarBorrador({ lote_proveedor: e.target.value })}
                                />
                                {erroresLinea.lote_proveedor && <div className="invalid-feedback d-block">{erroresLinea.lote_proveedor}</div>}
                            </div>
                            <div className="col-6 col-md-4">
                                <label className={CLASE_ETIQUETA} htmlFor={ID_CAMARA}>Cámara</label>
                                <SearchableSelect
                                    id={ID_CAMARA}
                                    className="form-control form-control-sm"
                                    placeholder="Venta directa (sin cámara)"
                                    options={opcionesCamara}
                                    value={borrador.camara === 0 ? "" : borrador.camara}
                                    onChange={(v) => actualizarBorrador({ camara: v === "" ? "" : v })}
                                />
                            </div>

                            <div className="col-4 col-md-2">
                                <label className={CLASE_ETIQUETA}>
                                    Cajas <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="number" min="0"
                                    className={`form-control form-control-sm text-end ${erroresLinea.cajas ? "is-invalid" : ""}`}
                                    value={borrador.cajas}
                                    onChange={(e) => actualizarBorrador({ cajas: e.target.value })}
                                />
                                {erroresLinea.cajas && <div className="invalid-feedback d-block">{erroresLinea.cajas}</div>}
                            </div>
                            <div className="col-4 col-md-2">
                                <label className={CLASE_ETIQUETA}>
                                    Kg / caja <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="number" min="0" step="0.01"
                                    className={`form-control form-control-sm text-end ${erroresLinea.peso_por_caja ? "is-invalid" : ""}`}
                                    value={borrador.peso_por_caja}
                                    onChange={(e) => actualizarBorrador({ peso_por_caja: e.target.value })}
                                />
                                {erroresLinea.peso_por_caja && (
                                    <div className="invalid-feedback d-block">{erroresLinea.peso_por_caja}</div>
                                )}
                            </div>
                            <div className="col-4 col-md-2">
                                <label className={CLASE_ETIQUETA}>
                                    Total kg <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="number" min="0" step="0.01"
                                    className={`form-control form-control-sm text-end fw-bold ${erroresLinea.total_kilos ? "is-invalid" : ""}`}
                                    value={borrador.total_kilos}
                                    onChange={(e) => actualizarBorrador({ total_kilos: e.target.value })}
                                />
                                {erroresLinea.total_kilos && <div className="invalid-feedback d-block">{erroresLinea.total_kilos}</div>}
                            </div>
                            <div className="col-6 col-md-2">
                                <label className={CLASE_ETIQUETA}>Costo / kg</label>
                                <div className="input-group input-group-sm">
                                    <span className="input-group-text">$</span>
                                    <input
                                        type="number" min="0" step="0.01" className="form-control text-end"
                                        value={borrador.costo_por_kilo}
                                        onChange={(e) => actualizarBorrador({ costo_por_kilo: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="col-6 col-md-2">
                                <label className={CLASE_ETIQUETA}>P. venta</label>
                                <div className="input-group input-group-sm">
                                    <span className="input-group-text">$</span>
                                    <input
                                        type="number" min="0" step="0.01" className="form-control text-end"
                                        value={borrador.precio_venta_planeado}
                                        onChange={(e) => actualizarBorrador({ precio_venta_planeado: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="col-12 col-md-2">
                                <label className={CLASE_ETIQUETA}>Caducidad</label>
                                <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={borrador.fecha_caducidad}
                                    onChange={(e) => actualizarBorrador({ fecha_caducidad: e.target.value })}
                                />
                            </div>

                            <div className="col-12">
                                <label className={CLASE_ETIQUETA}>Observaciones de la línea</label>
                                <input
                                    className="form-control form-control-sm"
                                    placeholder="Merma reportada en origen, estado del empaque, etc."
                                    value={borrador.observaciones}
                                    onChange={(e) => actualizarBorrador({ observaciones: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between mt-3">
                            <span className="small text-body-secondary">
                                <i className="bi bi-keyboard me-1" aria-hidden="true"></i>
                                Presiona <kbd>Enter</kbd> para agregar la línea y volver al producto.
                            </span>
                            <div className="d-flex gap-2">
                                {(editando || borradorTieneDatos(borrador)) && (
                                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={cancelarEdicionLinea}>
                                        <i className="bi bi-x-lg me-1" aria-hidden="true"></i>
                                        {editando ? "Cancelar edición" : "Limpiar"}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className={`btn btn-sm ${editando ? "btn-warning" : "btn-outline-primary"}`}
                                    onClick={confirmarLinea}
                                >
                                    <i className={`bi ${editando ? "bi-check-lg" : "bi-plus-lg"} me-1`} aria-hidden="true"></i>
                                    {editando ? "Actualizar línea" : "Agregar línea"}
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* ---------- Líneas agregadas (solo lectura) ---------- */}
                    <section>
                        <h6 className="d-flex align-items-center gap-2 fw-bold border-bottom pb-2 mb-3">
                            <i className="bi bi-list-ul text-body-secondary" aria-hidden="true"></i>
                            Líneas agregadas
                            <span className="badge text-bg-secondary">{lineas.length}</span>
                        </h6>

                        {lineas.length === 0 ? (
                            <div className="text-center text-body-secondary py-4 small">
                                Aún no hay líneas. Captura el producto arriba y presiona <strong>Agregar línea</strong>.
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-sm align-middle mb-0">
                                    <thead>
                                        <tr className="small text-uppercase text-body-secondary">
                                            <th style={{ width: "36px" }}>#</th>
                                            <th>Producto</th>
                                            <th>Lote</th>
                                            <th>Cámara</th>
                                            <th className="text-end">Cajas</th>
                                            <th className="text-end">Kg/caja</th>
                                            <th className="text-end">Total kg</th>
                                            <th className="text-end">Costo/kg</th>
                                            <th className="text-end">P. venta</th>
                                            <th>Caducidad</th>
                                            <th>Observaciones</th>
                                            <th style={{ width: "110px" }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lineas.map((linea, index) => (
                                            <tr key={linea.uid} className={linea.uid === editandoUid ? "table-warning" : undefined}>
                                                <td className="text-body-secondary">{index + 1}</td>
                                                <td className="text-wrap fw-semibold">{nombreProducto(linea.producto_id)}</td>
                                                <td className="text-wrap">{linea.lote_proveedor}</td>
                                                <td className="text-wrap">{nombreCamara(linea.camara)}</td>
                                                <td className="text-end">{linea.cajas}</td>
                                                <td className="text-end">{linea.peso_por_caja || "—"}</td>
                                                <td className="text-end fw-bold">{Number(linea.total_kilos).toFixed(2)}</td>
                                                <td className="text-end">{linea.costo_por_kilo ? `$${linea.costo_por_kilo}` : "—"}</td>
                                                <td className="text-end">{linea.precio_venta_planeado ? `$${linea.precio_venta_planeado}` : "—"}</td>
                                                <td className="text-wrap">
                                                    {linea.fecha_caducidad
                                                        ? formatearFechaNumerica(new Date(linea.fecha_caducidad + "T00:00:00"))
                                                        : "—"}
                                                </td>
                                                <td className="text-wrap small">{linea.observaciones || "—"}</td>
                                                <td className="text-end text-nowrap">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-secondary me-1"
                                                        onClick={() => editarLinea(linea.uid)}
                                                        title="Editar línea"
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-secondary me-1"
                                                        onClick={() => duplicarLinea(linea.uid)}
                                                        title="Copiar al formulario para capturar otra igual"
                                                    >
                                                        <i className="bi bi-copy"></i>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => quitarLinea(linea.uid)}
                                                        title="Quitar línea"
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-top">
                                            <td colSpan={4} className="text-end fw-semibold text-uppercase small text-body-secondary">
                                                Totales:
                                            </td>
                                            <td className="text-end fw-bold">{totalCajas}</td>
                                            <td></td>
                                            <td className="text-end fw-bold">{totalKilos.toFixed(2)} kg</td>
                                            <td colSpan={5}></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </section>
                </div>

                {error && (
                    <div className="card-footer bg-white border-top-0 py-2 text-danger small fw-semibold">
                        <i className="bi bi-exclamation-circle-fill me-1"></i> {error}
                    </div>
                )}

                <div className="card-footer d-flex justify-content-end gap-2">
                    {entrada && onCancelar && (
                        <button type="button" className="btn btn-outline-secondary" onClick={onCancelar}>
                            Cancelar edición
                        </button>
                    )}
                    {isLoading ? (
                        <LoadingButton isLoading={isLoading} text="Guardando..." onClick={() => Promise.resolve()} />
                    ) : (
                        <button type="submit" className="btn btn-primary">
                            <i className="bi bi-save me-1"></i> {entrada ? "Guardar cambios" : "Registrar entrada"}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

export default EntradaForm;
