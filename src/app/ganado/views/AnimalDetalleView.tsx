import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "../../../layouts/components/PageHeader";
import Modal from "../../../shared/components/Modal";
import SkeletonTable from "../../../shared/components/SkeletonTable";
import { useAuth } from "../../../shared/hooks/useAuth";
import { useToastContext } from "../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import { formatearFechaNumerica } from "../../../shared/utils/fechas";
import AnimalForm from "../components/AnimalForm";
import { useCatalogosGanado } from "../hooks/useCatalogosGanado";
import type { HistorialAnimal } from "../interfaces/Ganado";
import { actualizarAnimal, obtenerHistorialAnimal } from "../services/ganado.service";
import { AREA_GANADO, claseBadge, claseEstado, claseTipo, fecha, nombreUsuario } from "../utils/ganado";

/** Datos del animal y su seguimiento: altas, traspasos, bajas (cancelados incluidos) y cambios de datos. */
function AnimalDetalleView() {
    const { id } = useParams();
    const { puedeEditar } = useAuth();
    const editable = puedeEditar(AREA_GANADO);
    const { mostrarToast } = useToastContext();
    const { especies, categorias } = useCatalogosGanado();
    const [datos, setDatos] = useState<HistorialAnimal | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [editando, setEditando] = useState(false);
    const [version, setVersion] = useState(0);

    useEffect(() => {
        let vigente = true;
        obtenerHistorialAnimal(Number(id))
            .then((d) => { if (vigente) { setDatos(d); setError(null); } })
            .catch((err) => vigente && setError(obtenerMensajeError(err)));
        return () => { vigente = false; };
    }, [id, version]);

    const animal = datos?.animal;
    const titulo = animal ? animal.identificacion : "Animal";

    return (
        <>
            <PageHeader
                title={titulo}
                subtitle="Datos y seguimiento del animal"
                breadcrumbs={[
                    { label: "Inicio", to: "/" }, { label: "Ganado", to: "/ganado" },
                    { label: "Animales", to: "/ganado/animales" }, { label: titulo },
                ]}
            />
            <div className="container-fluid">
                {error && <div className="alert alert-danger">{error}</div>}
                {!datos && !error && <SkeletonTable columnas={4} filas={4} />}
                {animal && datos && (
                    <div className="row g-3">
                        <div className="col-lg-4">
                            <div className="card card-outline card-primary">
                                <div className="card-header d-flex align-items-center">
                                    <h3 className="card-title mb-0 me-auto">Datos</h3>
                                    {editable && (
                                        <button className="btn btn-outline-secondary btn-sm" onClick={() => setEditando(true)}>
                                            <i className="bi bi-pencil me-1" aria-hidden="true"></i>Editar
                                        </button>
                                    )}
                                </div>
                                <div className="card-body">
                                    <dl className="row mb-0 small">
                                        <dt className="col-5">Arete</dt>
                                        <dd className="col-7 font-monospace fw-semibold">{animal.arete || "Sin arete"}</dd>
                                        <dt className="col-5">Folio</dt>
                                        <dd className="col-7">{animal.folio}</dd>
                                        <dt className="col-5">Estado</dt>
                                        <dd className="col-7"><span className={claseEstado(animal.estado)}>{animal.estado_nombre}</span></dd>
                                        <dt className="col-5">Rancho</dt>
                                        <dd className="col-7">{animal.rancho?.nombre}</dd>
                                        <dt className="col-5">Especie</dt>
                                        <dd className="col-7">{animal.especie.nombre}</dd>
                                        <dt className="col-5">Categoría</dt>
                                        <dd className="col-7">{animal.categoria.nombre}</dd>
                                        <dt className="col-5">Sexo</dt>
                                        <dd className="col-7">{animal.sexo_nombre}</dd>
                                        <dt className="col-5">Raza / color</dt>
                                        <dd className="col-7">{animal.raza || "—"}</dd>
                                        <dt className="col-5">Nacimiento</dt>
                                        <dd className="col-7">{fecha(animal.fecha_nacimiento) || "—"}</dd>
                                        {animal.notas && (
                                            <>
                                                <dt className="col-5">Notas</dt>
                                                <dd className="col-7" style={{ whiteSpace: "pre-wrap" }}>{animal.notas}</dd>
                                            </>
                                        )}
                                    </dl>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-8">
                            <div className="card card-outline card-primary">
                                <div className="card-header"><h3 className="card-title mb-0">Seguimiento</h3></div>
                                <div className="card-body p-0">
                                    <div className="table-responsive">
                                        <table className="table tabla-datos mb-0">
                                            <thead>
                                                <tr><th>Fecha</th><th>Evento</th><th>Detalle</th><th>Usuario</th></tr>
                                            </thead>
                                            <tbody>
                                                {datos.eventos.map((e, i) => {
                                                    const tachado = e.cancelado ? "text-decoration-line-through text-body-secondary" : "";
                                                    return (
                                                        <tr key={i}>
                                                            <td className={`text-nowrap ${tachado}`}>
                                                                {e.clase === "edicion" && e.momento
                                                                    ? formatearFechaNumerica(new Date(e.momento), "numerico-hora")
                                                                    : fecha(e.fecha)}
                                                            </td>
                                                            <td className="text-nowrap">
                                                                {e.clase === "movimiento" && e.tipo ? (
                                                                    <>
                                                                        <span className={claseTipo(e.tipo)}>{e.tipo_nombre}{e.motivo_nombre && ` · ${e.motivo_nombre}`}</span>
                                                                        <div className="small text-body-secondary">{e.folio}</div>
                                                                    </>
                                                                ) : (
                                                                    <span className={claseBadge("secondary")}>Cambio de datos</span>
                                                                )}
                                                            </td>
                                                            <td className={tachado}>
                                                                {e.clase === "movimiento" ? (
                                                                    <>
                                                                        {e.tipo === "TRASPASO" ? `${e.rancho} → ${e.rancho_destino}` : e.rancho}
                                                                        {e.contraparte && <span className="text-body-secondary"> · {e.contraparte}</span>}
                                                                        {e.notas && <div className="small text-body-secondary">{e.notas}</div>}
                                                                    </>
                                                                ) : (
                                                                    e.cambios?.map((c) => (
                                                                        <div key={c.campo} className="small">
                                                                            <b>{c.campo}:</b> {c.antes || "—"} → {c.despues || "—"}
                                                                        </div>
                                                                    ))
                                                                )}
                                                                {e.cancelado && (
                                                                    <div className="small text-decoration-none">
                                                                        <span className={claseBadge("secondary")}>Cancelado</span> {e.motivo_cancelacion}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="small text-nowrap">{nombreUsuario(e.usuario)}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Modal title={`Editar ${titulo}`} show={editando} size="modal-lg" onClose={() => setEditando(false)}>
                {editando && animal && categorias.length > 0 && (
                    <AnimalForm
                        animal={animal}
                        especies={especies}
                        categorias={categorias}
                        onCancelar={() => setEditando(false)}
                        onGuardar={async (cambios) => {
                            await actualizarAnimal(animal.id, cambios);
                            mostrarToast("Animal actualizado", "El cambio quedó en su historial.", "success");
                            setEditando(false);
                            setVersion((v) => v + 1);
                        }}
                    />
                )}
            </Modal>
        </>
    );
}

export default AnimalDetalleView;
