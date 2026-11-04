import { useState } from "react";
import PageHeader from "../../../layouts/components/PageHeader";
import Modal from "../../../shared/components/Modal";
import ConfirmModal from "../../../shared/components/ConfirmModal";
import BotonGuardar from "../../cartera/components/BotonGuardar";
import SkeletonTable from "../../../shared/components/SkeletonTable";
import AvisoSoloLectura from "../../../shared/components/AvisoSoloLectura";
import BotonAccionFila from "../../../shared/components/tabla/BotonAccionFila";
import { useAuth } from "../../../shared/hooks/useAuth";
import { useToastContext } from "../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import { useCatalogosGanado } from "../hooks/useCatalogosGanado";
import type { Categoria, Especie, Rancho } from "../interfaces/Ganado";
import {
    eliminarCategoria, eliminarEspecie, eliminarRancho, guardarCategoria, guardarEspecie, guardarRancho,
} from "../services/ganado.service";
import { AREA_GANADO, SEXOS, claseBadge, nombreSexo } from "../utils/ganado";

type Edicion =
    | { clase: "rancho"; datos: Rancho }
    | { clase: "especie"; datos: Especie }
    | { clase: "categoria"; datos: Categoria };

type Borrado = { clase: Edicion["clase"]; id: number; nombre: string };

const TITULOS = { rancho: "rancho", especie: "especie", categoria: "categoría" };

function Activo({ activo }: { activo: boolean }) {
    return activo
        ? <span className={claseBadge("success")}>Activo</span>
        : <span className={claseBadge("secondary")}>Inactivo</span>;
}

function CatalogosView() {
    const { puedeEditar } = useAuth();
    const editable = puedeEditar(AREA_GANADO);
    const { mostrarToast } = useToastContext();
    const { ranchos, especies, categorias, cargando, recargar } = useCatalogosGanado(
        (m) => mostrarToast("Error al cargar", m, "danger"),
    );
    const [edicion, setEdicion] = useState<Edicion | null>(null);
    const [borrado, setBorrado] = useState<Borrado | null>(null);
    const [borrando, setBorrando] = useState(false);

    async function guardar(e: Edicion) {
        if (e.clase === "rancho") await guardarRancho(e.datos);
        else if (e.clase === "especie") await guardarEspecie(e.datos);
        else await guardarCategoria(e.datos);
        mostrarToast("Guardado", `El ${TITULOS[e.clase]} se guardó correctamente.`, "success");
        setEdicion(null);
        await recargar();
    }

    async function borrar() {
        if (!borrado) return;
        setBorrando(true);
        try {
            if (borrado.clase === "rancho") await eliminarRancho(borrado.id);
            else if (borrado.clase === "especie") await eliminarEspecie(borrado.id);
            else await eliminarCategoria(borrado.id);
            mostrarToast("Eliminado", `${borrado.nombre} se eliminó.`, "success");
            setBorrado(null);
            await recargar();
        } catch (err) {
            mostrarToast("No se pudo eliminar", `${obtenerMensajeError(err)} Puedes marcarlo como inactivo.`, "danger");
        } finally {
            setBorrando(false);
        }
    }

    function acciones(editar: () => void, borrar: Borrado) {
        if (!editable) return null;
        return (
            <td className="text-end text-nowrap">
                <BotonAccionFila icono="bi-pencil" etiqueta="Editar" onClick={editar} />{" "}
                <BotonAccionFila icono="bi-trash" etiqueta="Eliminar" variante="danger" onClick={() => setBorrado(borrar)} />
            </td>
        );
    }

    function encabezado(titulo: string, nuevo: () => void) {
        return (
            <div className="card-header d-flex align-items-center">
                <h3 className="card-title mb-0 me-auto">{titulo}</h3>
                {editable && (
                    <button className="btn btn-success btn-sm" onClick={nuevo}>
                        <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>Nuevo
                    </button>
                )}
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title="Catálogos de ganado"
                subtitle="Ranchos, especies y categorías"
                breadcrumbs={[{ label: "Inicio", to: "/" }, { label: "Ganado", to: "/ganado" }, { label: "Catálogos" }]}
            />
            <div className="container-fluid">
                {!editable && <AvisoSoloLectura area="Ganado" />}
                <div className="row g-3">
                    <div className="col-lg-5">
                        <div className="card card-outline card-primary h-100">
                            {encabezado("Ranchos", () => setEdicion({ clase: "rancho", datos: { id: 0, nombre: "", activo: true, notas: "" } }))}
                            <div className="card-body p-0">
                                {cargando ? <SkeletonTable columnas={3} filas={5} /> : (
                                    <table className="table tabla-datos mb-0">
                                        <thead>
                                            <tr>
                                                <th>Rancho</th>
                                                <th className="num">Cabezas</th>
                                                <th>Estado</th>
                                                {editable && <th className="text-end">Acciones</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ranchos.map((r) => (
                                                <tr key={r.id}>
                                                    <td className="fw-semibold">
                                                        {r.nombre}
                                                        {r.notas && <div className="small text-body-secondary fw-normal">{r.notas}</div>}
                                                    </td>
                                                    <td className="num">{r.cabezas ?? 0}</td>
                                                    <td><Activo activo={r.activo} /></td>
                                                    {acciones(() => setEdicion({ clase: "rancho", datos: r }), { clase: "rancho", id: r.id, nombre: r.nombre })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-7">
                        <div className="card card-outline card-primary mb-3">
                            {encabezado("Especies", () => setEdicion({ clase: "especie", datos: { id: 0, nombre: "", activo: true } }))}
                            <div className="card-body p-0">
                                {cargando ? <SkeletonTable columnas={2} filas={2} /> : (
                                    <table className="table tabla-datos mb-0">
                                        <thead>
                                            <tr><th>Especie</th><th>Estado</th>{editable && <th className="text-end">Acciones</th>}</tr>
                                        </thead>
                                        <tbody>
                                            {especies.map((e) => (
                                                <tr key={e.id}>
                                                    <td className="fw-semibold">{e.nombre}</td>
                                                    <td><Activo activo={e.activo} /></td>
                                                    {acciones(() => setEdicion({ clase: "especie", datos: e }), { clase: "especie", id: e.id, nombre: e.nombre })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                        <div className="card card-outline card-primary">
                            {encabezado("Categorías", () => setEdicion({
                                clase: "categoria",
                                datos: { id: 0, especie_id: especies[0]?.id ?? 0, nombre: "", sexo: "", orden: 0, activo: true },
                            }))}
                            <div className="card-body p-0">
                                {cargando ? <SkeletonTable columnas={5} filas={6} /> : (
                                    <table className="table tabla-datos mb-0">
                                        <thead>
                                            <tr>
                                                <th>Especie</th>
                                                <th>Categoría</th>
                                                <th>Sexo</th>
                                                <th className="num">Orden</th>
                                                <th>Estado</th>
                                                {editable && <th className="text-end">Acciones</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categorias.map((c) => (
                                                <tr key={c.id}>
                                                    <td className="small">{c.especie_nombre}</td>
                                                    <td className="fw-semibold">{c.nombre}</td>
                                                    <td>{nombreSexo(c.sexo)}</td>
                                                    <td className="num">{c.orden}</td>
                                                    <td><Activo activo={c.activo} /></td>
                                                    {acciones(() => setEdicion({ clase: "categoria", datos: c }), { clase: "categoria", id: c.id, nombre: c.nombre })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                title={edicion ? `${edicion.datos.id ? "Editar" : "Nuevo"} ${TITULOS[edicion.clase]}` : ""}
                show={edicion !== null}
                onClose={() => setEdicion(null)}
            >
                {edicion && (
                    <FormCatalogo
                        key={`${edicion.clase}-${edicion.datos.id}`}
                        inicial={edicion}
                        especies={especies}
                        onGuardar={guardar}
                        onCancelar={() => setEdicion(null)}
                    />
                )}
            </Modal>

            <ConfirmModal show={borrado !== null} isLoading={borrando} onConfirm={borrar} onCancel={() => setBorrado(null)}>
                ¿Eliminar <b>{borrado?.nombre}</b>? Solo se puede si no tiene animales ni movimientos; si los tiene, márcalo como inactivo.
            </ConfirmModal>
        </>
    );
}

interface FormProps {
    inicial: Edicion;
    especies: Especie[];
    onGuardar: (e: Edicion) => Promise<void>;
    onCancelar: () => void;
}

function FormCatalogo({ inicial, especies, onGuardar, onCancelar }: FormProps) {
    const [edicion, setEdicion] = useState<Edicion>(inicial);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function cambiar(campos: Partial<Rancho & Especie & Categoria>) {
        setEdicion({ ...edicion, datos: { ...edicion.datos, ...campos } } as Edicion);
    }

    async function enviar(e: React.SyntheticEvent) {
        e.preventDefault();
        if (!edicion.datos.nombre.trim()) {
            setError("El nombre es obligatorio.");
            return;
        }
        setError(null);
        setGuardando(true);
        try {
            await onGuardar(edicion);
        } catch (err) {
            setError(obtenerMensajeError(err));
        } finally {
            setGuardando(false);
        }
    }

    const datos = edicion.datos;
    return (
        <form onSubmit={enviar}>
            <div className="row g-3">
                {edicion.clase === "categoria" && (
                    <div className="col-sm-6">
                        <label className="form-label" htmlFor="cat-especie">Especie</label>
                        <select id="cat-especie" className="form-select" value={edicion.datos.especie_id}
                            onChange={(e) => cambiar({ especie_id: Number(e.target.value) })}>
                            {especies.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                        </select>
                    </div>
                )}
                <div className={edicion.clase === "categoria" ? "col-sm-6" : "col-12"}>
                    <label className="form-label" htmlFor="cat-nombre">Nombre <span className="text-danger">*</span></label>
                    <input id="cat-nombre" className="form-control text-uppercase" autoFocus value={datos.nombre}
                        onChange={(e) => cambiar({ nombre: e.target.value })} />
                </div>
                {edicion.clase === "categoria" && (
                    <>
                        <div className="col-sm-6">
                            <label className="form-label" htmlFor="cat-sexo">Sexo</label>
                            <select id="cat-sexo" className="form-select" value={edicion.datos.sexo}
                                onChange={(e) => cambiar({ sexo: e.target.value as Categoria["sexo"] })}>
                                <option value="">Ambos</option>
                                {SEXOS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>
                        <div className="col-sm-6">
                            <label className="form-label" htmlFor="cat-orden">Orden en reportes</label>
                            <input id="cat-orden" type="number" min="0" className="form-control" value={edicion.datos.orden}
                                onChange={(e) => cambiar({ orden: Number(e.target.value) || 0 })} />
                        </div>
                    </>
                )}
                {edicion.clase === "rancho" && (
                    <div className="col-12">
                        <label className="form-label" htmlFor="cat-notas">Notas</label>
                        <textarea id="cat-notas" className="form-control" rows={2} value={edicion.datos.notas}
                            onChange={(e) => cambiar({ notas: e.target.value })} />
                    </div>
                )}
            </div>
            {error && <div className="alert alert-danger py-2 small mt-3 mb-0">{error}</div>}
            <div className="d-flex justify-content-between align-items-center gap-3 pt-3 mt-4 border-top">
                <div className="form-check">
                    <input id="cat-activo" type="checkbox" className="form-check-input" checked={datos.activo}
                        onChange={(e) => cambiar({ activo: e.target.checked })} />
                    <label className="form-check-label" htmlFor="cat-activo">Activo</label>
                </div>
                <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-secondary" onClick={onCancelar}>Cancelar</button>
                    <BotonGuardar guardando={guardando} texto="Guardar" />
                </div>
            </div>
        </form>
    );
}

export default CatalogosView;
