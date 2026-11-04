import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../../../layouts/components/PageHeader";
import Modal from "../../../shared/components/Modal";
import BuscadorTabla from "../../../shared/components/BuscadorTabla";
import FiltroChip from "../../../shared/components/FiltroChip";
import Paginacion from "../../../shared/components/Paginacion";
import SkeletonTable from "../../../shared/components/SkeletonTable";
import AvisoSoloLectura from "../../../shared/components/AvisoSoloLectura";
import TablaResponsive from "../../../shared/components/TablaResponsive";
import MenuAccionesFila from "../../../shared/components/tabla/MenuAccionesFila";
import { useAuth } from "../../../shared/hooks/useAuth";
import { useToastContext } from "../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import AnimalForm from "../components/AnimalForm";
import { useCatalogosGanado } from "../hooks/useCatalogosGanado";
import type { Animal } from "../interfaces/Ganado";
import { actualizarAnimal, obtenerAnimales, type FiltroAnimales } from "../services/ganado.service";
import { AREA_GANADO, ESTADOS, SEXOS, claseEstado, fecha } from "../utils/ganado";

const POR_PAGINA = 50;

function AnimalesView() {
    const { puedeEditar } = useAuth();
    const editable = puedeEditar(AREA_GANADO);
    const navigate = useNavigate();
    const { mostrarToast } = useToastContext();
    const { ranchos, especies, categorias } = useCatalogosGanado((m) => mostrarToast("Error al cargar", m, "danger"));

    const [filtro, setFiltro] = useState<FiltroAnimales>({ estado: "ACTIVO" });
    const [busqueda, setBusqueda] = useState("");
    const [pagina, setPagina] = useState(1);
    const [animales, setAnimales] = useState<Animal[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editando, setEditando] = useState<Animal | null>(null);
    const [version, setVersion] = useState(0);

    useEffect(() => {
        const control = new AbortController();
        // La búsqueda espera a que se deje de escribir; los filtros van de inmediato.
        const temporizador = setTimeout(async () => {
            setLoading(true);
            try {
                const datos = await obtenerAnimales({ ...filtro, q: busqueda, page: pagina, por_pagina: POR_PAGINA }, control.signal);
                setAnimales(datos.results);
                setTotal(datos.count);
                setError(null);
            } catch (err) {
                if (control.signal.aborted) return;
                setError(obtenerMensajeError(err));
            } finally {
                if (!control.signal.aborted) setLoading(false);
            }
        }, 300);
        return () => {
            clearTimeout(temporizador);
            control.abort();
        };
    }, [filtro, busqueda, pagina, version]);

    function filtrar(cambios: Partial<FiltroAnimales>) {
        setFiltro((f) => ({ ...f, ...cambios }));
        setPagina(1);
    }

    const categoriasFiltro = categorias.filter((c) => !filtro.especie || String(c.especie_id) === filtro.especie);
    const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
    const inicio = (pagina - 1) * POR_PAGINA;

    return (
        <>
            <PageHeader
                title="Animales"
                subtitle="Cabezas registradas por rancho; se dan de alta, de baja y se traspasan desde Movimientos"
                breadcrumbs={[{ label: "Inicio", to: "/" }, { label: "Ganado", to: "/ganado" }, { label: "Animales" }]}
            />
            <div className="container-fluid">
                {!editable && <AvisoSoloLectura area="Ganado" />}
                <div className="card card-outline card-primary">
                    <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                        <h3 className="card-title mb-0 me-auto">Animales</h3>
                        {editable && (
                            <Link className="btn btn-success btn-sm" to="/ganado/movimientos?nuevo=ALTA">
                                <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>Registrar alta
                            </Link>
                        )}
                    </div>
                    <div className="d-flex flex-wrap gap-2 align-items-center p-3 border-bottom">
                        <BuscadorTabla valor={busqueda} onChange={(v) => { setBusqueda(v); setPagina(1); }} placeholder="Buscar arete, folio, raza o notas..." />
                        <FiltroChip etiqueta="Rancho" icono="bi-house" valor={filtro.rancho ?? ""} onChange={(v) => filtrar({ rancho: v })}
                            etiquetaTodos="Todos los ranchos" opciones={ranchos.map((r) => ({ value: String(r.id), label: r.nombre }))} />
                        <FiltroChip etiqueta="Especie" icono="bi-tag" valor={filtro.especie ?? ""} onChange={(v) => filtrar({ especie: v, categoria: "" })}
                            etiquetaTodos="Todas" opciones={especies.map((e) => ({ value: String(e.id), label: e.nombre }))} />
                        <FiltroChip etiqueta="Categoría" icono="bi-tags" valor={filtro.categoria ?? ""} onChange={(v) => filtrar({ categoria: v })}
                            etiquetaTodos="Todas" opciones={categoriasFiltro.map((c) => ({ value: String(c.id), label: especies.length > 1 && !filtro.especie ? `${c.nombre} (${c.especie_nombre})` : c.nombre }))} />
                        <FiltroChip etiqueta="Sexo" icono="bi-gender-ambiguous" valor={filtro.sexo ?? ""} onChange={(v) => filtrar({ sexo: v })}
                            etiquetaTodos="Ambos" opciones={SEXOS} />
                        <FiltroChip etiqueta="Arete" icono="bi-upc" valor={filtro.arete ?? ""} onChange={(v) => filtrar({ arete: v })}
                            etiquetaTodos="Con y sin arete" opciones={[{ value: "con", label: "Con arete" }, { value: "sin", label: "Sin arete" }]} />
                        <FiltroChip etiqueta="Estado" icono="bi-flag" valor={filtro.estado ?? ""} onChange={(v) => filtrar({ estado: v })}
                            etiquetaTodos="Todos" opciones={ESTADOS} />
                        <span className="ms-auto small text-body-secondary">{total} animal(es)</span>
                    </div>
                    <div className="card-body p-0">
                        {error ? (
                            <div className="alert alert-danger m-3">{error}</div>
                        ) : loading && animales.length === 0 ? (
                            <SkeletonTable columnas={9} filas={8} />
                        ) : (
                            <TablaResponsive alturaMaxima="70vh">
                                <table className={`table tabla-datos mb-0 ${loading ? "opacity-50" : ""}`}>
                                    <thead>
                                        <tr>
                                            <th>Arete</th>
                                            <th>Folio</th>
                                            <th>Rancho</th>
                                            <th>Especie</th>
                                            <th>Categoría</th>
                                            <th>Sexo</th>
                                            <th>Raza / color</th>
                                            <th>Nacimiento</th>
                                            <th>Estado</th>
                                            <th className="text-end">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {animales.length === 0 ? (
                                            <tr><td colSpan={10} className="text-center text-body-secondary py-5">No hay animales con estos filtros.</td></tr>
                                        ) : animales.map((a) => (
                                            <tr key={a.id}>
                                                <td className="text-nowrap fw-semibold">
                                                    {a.arete ? <span className="font-monospace">{a.arete}</span> : <span className="text-body-secondary fw-normal">Sin arete</span>}
                                                </td>
                                                <td className="text-nowrap"><Link to={`/ganado/animales/${a.id}`}>{a.folio}</Link></td>
                                                <td>{a.rancho?.nombre}</td>
                                                <td className="small">{a.especie.nombre}</td>
                                                <td>{a.categoria.nombre}</td>
                                                <td>{a.sexo_nombre}</td>
                                                <td className="small">{a.raza}</td>
                                                <td className="text-nowrap">{fecha(a.fecha_nacimiento)}</td>
                                                <td><span className={claseEstado(a.estado)}>{a.estado_nombre}</span></td>
                                                <td className="text-end">
                                                    <MenuAccionesFila
                                                        etiqueta={`Acciones de ${a.identificacion}`}
                                                        acciones={[
                                                            { etiqueta: "Ver historial", icono: "bi-clock-history", onClick: () => navigate(`/ganado/animales/${a.id}`) },
                                                            ...(editable ? [{ etiqueta: "Editar datos", icono: "bi-pencil", onClick: () => setEditando(a) }] : []),
                                                        ]}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </TablaResponsive>
                        )}
                    </div>
                    {!error && (
                        <div className="card-footer d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <small className="text-body-secondary">
                                {total === 0 ? "Sin resultados" : `Mostrando ${inicio + 1}-${Math.min(inicio + POR_PAGINA, total)} de ${total}`}
                            </small>
                            <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
                        </div>
                    )}
                </div>
            </div>

            <Modal title={`Editar ${editando?.identificacion ?? ""}`} show={editando !== null} size="modal-lg" onClose={() => setEditando(null)}>
                {editando && (
                    <AnimalForm
                        key={editando.id}
                        animal={editando}
                        especies={especies}
                        categorias={categorias}
                        onCancelar={() => setEditando(null)}
                        onGuardar={async (datos) => {
                            await actualizarAnimal(editando.id, datos);
                            mostrarToast("Animal actualizado", "El cambio quedó en su historial.", "success");
                            setEditando(null);
                            setVersion((v) => v + 1);
                        }}
                    />
                )}
            </Modal>
        </>
    );
}

export default AnimalesView;
