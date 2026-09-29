import { useEffect, useState } from "react";
import dayjs from "dayjs";
import PageHeader from "../../../../layouts/components/PageHeader";
import Modal from "../../../../shared/components/Modal";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import TablaResponsive from "../../../../shared/components/TablaResponsive";
import BotonAccionFila from "../../../../shared/components/tabla/BotonAccionFila";
import AvisoSoloLectura from "../../../../shared/components/AvisoSoloLectura";
import { useAuth } from "../../../../shared/hooks/useAuth";
import { useToastContext } from "../../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { formatearFechaNumerica, hoyISO } from "../../../../shared/utils/fechas";
import { getFullName } from "../../../../shared/utils/userUtils";
import type { AperturaApi } from "../../interfaces/caja/Caja";
import type { Divisa } from "../../interfaces/divisas/Divisa";
import { actualizarApertura, crearApertura, eliminarApertura, obtenerAperturas } from "../../services/caja.service";
import { obtenerDivisas } from "../../services/divisa.service";

const CLASE_ETIQUETA = "form-label small text-uppercase fw-semibold text-body-secondary mb-1";

interface FormApertura {
    fecha: string;
    observaciones: string;
    montos: Record<number, string>;
}

function formVacio(): FormApertura {
    // Por lo general la apertura es el primer día del mes.
    return { fecha: dayjs().startOf("month").format("YYYY-MM-DD"), observaciones: "", montos: {} };
}

/**
 * Saldos iniciales de caja a una fecha. El saldo de cualquier día parte de la
 * apertura más reciente anterior o igual a ese día; una apertura nueva a mitad
 * de mes reajusta desde su fecha (p. ej. tras un conteo físico).
 */
function SaldosInicialesView() {
    const { mostrarToast } = useToastContext();
    const { puedeEditar } = useAuth();
    const editable = puedeEditar("TES");
    const [aperturas, setAperturas] = useState<AperturaApi[]>([]);
    const [divisas, setDivisas] = useState<Divisa[]>([]);
    const [cargando, setCargando] = useState(true);
    const [form, setForm] = useState<FormApertura>(formVacio);
    const [editando, setEditando] = useState<AperturaApi | null>(null);
    const [guardando, setGuardando] = useState(false);
    const [aEliminar, setAEliminar] = useState<AperturaApi | null>(null);

    function cargar() {
        return Promise.all([obtenerAperturas(), obtenerDivisas()])
            .then(([datosAperturas, datosDivisas]) => {
                setAperturas(datosAperturas);
                setDivisas(datosDivisas.filter((d) => d.activa));
            })
            .catch((err) => mostrarToast("Error al cargar", obtenerMensajeError(err), "danger"))
            .finally(() => setCargando(false));
    }

    useEffect(() => {
        cargar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function editar(apertura: AperturaApi) {
        setEditando(apertura);
        setForm({
            fecha: apertura.fecha,
            observaciones: apertura.observaciones,
            montos: Object.fromEntries(apertura.saldos.map((s) => [s.divisa.id, s.monto])),
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function cancelar() {
        setEditando(null);
        setForm(formVacio());
    }

    async function guardar(e: React.FormEvent) {
        e.preventDefault();
        const saldos = divisas
            .filter((d) => form.montos[d.id] !== undefined && form.montos[d.id] !== "")
            .map((d) => ({ divisa_id: d.id, monto: form.montos[d.id] }));
        if (saldos.length === 0) {
            mostrarToast("Faltan datos", "Captura el saldo inicial de al menos una divisa.", "warning");
            return;
        }
        setGuardando(true);
        try {
            const payload = { fecha: form.fecha, observaciones: form.observaciones.trim(), saldos };
            if (editando) await actualizarApertura(editando.id, payload);
            else await crearApertura(payload);
            mostrarToast("Saldos iniciales guardados", "Los saldos de caja se recalculan a partir de esta fecha.", "success");
            cancelar();
            await cargar();
        } catch (err) {
            mostrarToast("Error al guardar", obtenerMensajeError(err), "danger");
        } finally {
            setGuardando(false);
        }
    }

    async function confirmarEliminar() {
        if (!aEliminar) return;
        try {
            await eliminarApertura(aEliminar.id);
            mostrarToast("Apertura eliminada", "Los saldos se recalculan con la apertura anterior.", "success");
            setAEliminar(null);
            await cargar();
        } catch (err) {
            mostrarToast("Error al eliminar", obtenerMensajeError(err), "danger");
        }
    }

    return (
        <>
            <PageHeader
                title="Saldos iniciales"
                subtitle="Saldo de caja por divisa a una fecha; de ahí parten los saldos de los días siguientes"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Tesorería", to: "/tesoreria" },
                    { label: "Saldos iniciales" },
                ]}
            />

            <div className="container-fluid">
                {!editable && <AvisoSoloLectura area="Tesorería" />}

                {editable && (
                    <form
                        className={`card card-outline mb-3 ${editando ? "card-warning" : "card-primary"}`}
                        onSubmit={guardar}
                    >
                        <div className="card-header">
                            <h3 className="card-title fs-6 fw-bold m-0">
                                {editando ? `Editando la apertura del ${formatearFechaNumerica(dayjs(editando.fecha).toDate())}` : "Nueva apertura"}
                            </h3>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-sm-4 col-lg-2">
                                    <label className={CLASE_ETIQUETA} htmlFor="apertura-fecha">Fecha</label>
                                    <input
                                        id="apertura-fecha"
                                        type="date"
                                        className="form-control form-control-sm"
                                        value={form.fecha}
                                        max={hoyISO()}
                                        onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                                        required
                                    />
                                </div>
                                {divisas.map((divisa) => (
                                    <div className="col-sm-4 col-lg-2" key={divisa.id}>
                                        <label className={CLASE_ETIQUETA} htmlFor={`apertura-${divisa.id}`}>
                                            {divisa.codigo} — {divisa.nombre}
                                        </label>
                                        <div className="input-group input-group-sm">
                                            <span className="input-group-text">{divisa.simbolo}</span>
                                            <input
                                                id={`apertura-${divisa.id}`}
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="form-control text-end"
                                                placeholder="0.00"
                                                value={form.montos[divisa.id] ?? ""}
                                                onChange={(e) => setForm({ ...form, montos: { ...form.montos, [divisa.id]: e.target.value } })}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <div className="col-12 col-lg">
                                    <label className={CLASE_ETIQUETA} htmlFor="apertura-observaciones">Observaciones</label>
                                    <input
                                        id="apertura-observaciones"
                                        className="form-control form-control-sm"
                                        placeholder="Ej. Conteo físico de inicio de mes"
                                        value={form.observaciones}
                                        onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                                    />
                                </div>
                            </div>
                            <p className="small text-body-secondary mt-3 mb-0">
                                <i className="bi bi-info-circle me-1" aria-hidden="true"></i>
                                El monto es el saldo al <b>inicio</b> de esa fecha: los movimientos de ese mismo día se suman encima.
                                Una apertura posterior reajusta el saldo desde su fecha.
                            </p>
                        </div>
                        <div className="card-footer d-flex justify-content-end gap-2">
                            {editando && (
                                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={cancelar}>Cancelar</button>
                            )}
                            <button type="submit" className="btn btn-primary btn-sm" disabled={guardando}>
                                {guardando && <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>}
                                {editando ? "Guardar cambios" : "Registrar apertura"}
                            </button>
                        </div>
                    </form>
                )}

                <div className="card card-outline card-secondary">
                    <div className="card-header">
                        <h3 className="card-title fs-6 fw-bold m-0">Aperturas registradas</h3>
                    </div>
                    <div className="card-body p-0">
                        {cargando ? (
                            <SkeletonTable columnas={5} filas={3} />
                        ) : (
                            <TablaResponsive alturaMaxima="60vh">
                                <table className="table tabla-datos">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Saldos</th>
                                            <th>Observaciones</th>
                                            <th>Registró</th>
                                            {editable && <th className="text-end">Acciones</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {aperturas.length === 0 ? (
                                            <tr>
                                                <td colSpan={editable ? 5 : 4} className="text-center text-body-secondary py-5">
                                                    <i className="bi bi-flag fs-3 d-block mb-2" aria-hidden="true"></i>
                                                    Aún no hay saldos iniciales. Registra el primero para empezar a capturar movimientos.
                                                </td>
                                            </tr>
                                        ) : (
                                            aperturas.map((apertura) => (
                                                <tr key={apertura.id} className="fila-principal">
                                                    <td className="text-nowrap fw-semibold">{formatearFechaNumerica(dayjs(apertura.fecha).toDate())}</td>
                                                    <td className="font-tabular-nums">
                                                        {apertura.saldos.map((s) => (
                                                            <span key={s.id} className="me-3 text-nowrap">
                                                                <span className="text-body-secondary small me-1">{s.divisa.codigo}</span>
                                                                {s.divisa.simbolo}{Number(s.monto).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                                            </span>
                                                        ))}
                                                    </td>
                                                    <td className="truncar" title={apertura.observaciones || undefined}>
                                                        {apertura.observaciones || <span className="text-body-secondary">—</span>}
                                                    </td>
                                                    <td className="small text-nowrap">
                                                        {getFullName(apertura.creado_por)}
                                                        {apertura.editado_por && (
                                                            <div className="text-body-secondary">Editó: {getFullName(apertura.editado_por)}</div>
                                                        )}
                                                    </td>
                                                    {editable && (
                                                        <td className="text-end text-nowrap">
                                                            <BotonAccionFila icono="bi-pencil" etiqueta="Editar apertura" onClick={() => editar(apertura)} />{" "}
                                                            <BotonAccionFila
                                                                icono="bi-trash"
                                                                etiqueta="Eliminar apertura"
                                                                variante="danger"
                                                                onClick={() => setAEliminar(apertura)}
                                                            />
                                                        </td>
                                                    )}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </TablaResponsive>
                        )}
                    </div>
                </div>
            </div>

            <Modal title="Eliminar apertura" show={!!aEliminar} onClose={() => setAEliminar(null)}>
                <p>
                    ¿Eliminar los saldos iniciales del{" "}
                    <b>{aEliminar && formatearFechaNumerica(dayjs(aEliminar.fecha).toDate())}</b>?
                </p>
                <p className="small text-body-secondary">
                    Los saldos desde esa fecha se recalcularán con la apertura anterior (si la hay). Los movimientos no se borran.
                </p>
                <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setAEliminar(null)}>Cancelar</button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={confirmarEliminar}>Eliminar</button>
                </div>
            </Modal>
        </>
    );
}

export default SaldosInicialesView;
