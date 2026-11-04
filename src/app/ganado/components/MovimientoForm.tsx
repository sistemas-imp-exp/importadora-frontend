import { useEffect, useMemo, useState } from "react";
import BotonGuardar from "../../cartera/components/BotonGuardar";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import { hoyISO } from "../../../shared/utils/fechas";
import type {
    AnimalNuevo, AnimalSeleccion, Categoria, Especie, MotivoMovimiento, MovimientoRequest, Rancho, TipoMovimiento,
} from "../interfaces/Ganado";
import { obtenerSeleccionAnimales } from "../services/ganado.service";
import { MOTIVOS, SEXOS, TIPOS } from "../utils/ganado";
import AreteInputs from "./AreteInputs";

interface Props {
    tipoInicial: TipoMovimiento;
    ranchos: Rancho[];
    especies: Especie[];
    categorias: Categoria[];
    onGuardar: (datos: MovimientoRequest) => Promise<void>;
    onCancelar: () => void;
}

const ETIQUETA_CONTRAPARTE: Partial<Record<MotivoMovimiento, string>> = {
    COMPRA: "Vendedor",
    REGALO: "Quién lo regaló",
    VENTA: "Comprador",
};

function renglonNuevo(base: AnimalNuevo | undefined, especies: Especie[], categorias: Categoria[]): AnimalNuevo {
    if (base) return { ...base, arete_1: base.arete_1, arete_2: base.arete_2, arete_3: "", cantidad: 1, notas: "" };
    const especie = especies.find((e) => e.activo);
    const categoria = categorias.find((c) => c.especie_id === especie?.id && c.activo);
    return {
        arete_1: "", arete_2: "", arete_3: "", especie_id: especie?.id ?? 0, categoria_id: categoria?.id ?? 0,
        sexo: categoria?.sexo || "H", raza: "", fecha_nacimiento: null, notas: "", cantidad: 1,
    };
}

const conArete = (a: AnimalNuevo) => !!(a.arete_1 || a.arete_2 || a.arete_3);

/**
 * Alta: renglones de animales nuevos (con arete uno por renglón; sin arete,
 * una cantidad). Baja y traspaso: se eligen los animales activos del rancho.
 */
function MovimientoForm({ tipoInicial, ranchos, especies, categorias, onGuardar, onCancelar }: Props) {
    const activos = ranchos.filter((r) => r.activo);
    const [tipo, setTipo] = useState<TipoMovimiento>(tipoInicial);
    const [motivo, setMotivo] = useState<MotivoMovimiento>(MOTIVOS[tipoInicial][0]?.value ?? "");
    const [fechaMov, setFechaMov] = useState(hoyISO());
    const [rancho, setRancho] = useState<number>(0);
    const [destino, setDestino] = useState<number>(0);
    const [contraparte, setContraparte] = useState("");
    const [importe, setImporte] = useState("");
    const [notas, setNotas] = useState("");
    const [nuevos, setNuevos] = useState<AnimalNuevo[]>(() => [renglonNuevo(undefined, especies, categorias)]);
    const [disponibles, setDisponibles] = useState<AnimalSeleccion[] | null>(null);
    const [elegidos, setElegidos] = useState<Set<number>>(new Set());
    const [busqueda, setBusqueda] = useState("");
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const esAlta = tipo === "ALTA";

    useEffect(() => {
        if (esAlta || !rancho) return;
        let vigente = true;
        obtenerSeleccionAnimales(rancho)
            .then((lista) => vigente && setDisponibles(lista))
            .catch((err) => vigente && setError(obtenerMensajeError(err)));
        return () => { vigente = false; };
    }, [esAlta, rancho]);

    function cambiarTipo(t: TipoMovimiento) {
        setTipo(t);
        setMotivo(MOTIVOS[t][0]?.value ?? "");
        setElegidos(new Set());
        setError(null);
    }

    function cambiarRancho(id: number) {
        setRancho(id);
        setDisponibles(null);
        setElegidos(new Set());
        if (destino === id) setDestino(0);
    }

    function cambiarRenglon(i: number, cambios: Partial<AnimalNuevo>) {
        setNuevos(nuevos.map((a, j) => (j === i ? { ...a, ...cambios } : a)));
    }

    const visibles = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();
        return (disponibles ?? []).filter((a) =>
            !termino || `${a.arete} ${a.folio} ${a.categoria} ${a.raza}`.toLowerCase().includes(termino));
    }, [disponibles, busqueda]);

    const todosVisibles = visibles.length > 0 && visibles.every((a) => elegidos.has(a.id));

    function alternarVisibles() {
        const siguiente = new Set(elegidos);
        visibles.forEach((a) => (todosVisibles ? siguiente.delete(a.id) : siguiente.add(a.id)));
        setElegidos(siguiente);
    }

    const cabezas = esAlta ? nuevos.reduce((acc, a) => acc + (conArete(a) ? 1 : a.cantidad || 0), 0) : elegidos.size;
    const etiquetaContraparte = ETIQUETA_CONTRAPARTE[motivo];
    const llevaImporte = motivo === "COMPRA" || motivo === "VENTA";

    async function enviar(e: React.SyntheticEvent) {
        e.preventDefault();
        if (!rancho) return setError("Elige el rancho.");
        if (tipo === "TRASPASO" && !destino) return setError("Elige el rancho destino.");
        if (cabezas === 0) return setError(esAlta ? "Agrega al menos un animal." : "Elige al menos un animal.");
        setError(null);
        setGuardando(true);
        try {
            await onGuardar({
                tipo, motivo, fecha: fechaMov, rancho_id: rancho, rancho_destino_id: tipo === "TRASPASO" ? destino : null,
                contraparte: etiquetaContraparte ? contraparte.trim() : "",
                importe: llevaImporte && importe !== "" ? importe : null,
                notas: notas.trim(),
                ...(esAlta
                    ? { animales: nuevos.map((a) => ({ ...a, cantidad: conArete(a) ? 1 : a.cantidad })) }
                    : { animal_ids: [...elegidos] }),
            });
        } catch (err) {
            setError(obtenerMensajeError(err));
        } finally {
            setGuardando(false);
        }
    }

    return (
        <form onSubmit={enviar}>
            <div className="btn-group mb-3" role="group" aria-label="Tipo de movimiento">
                {TIPOS.map((t) => (
                    <button key={t.value} type="button" onClick={() => cambiarTipo(t.value)}
                        className={`btn ${tipo === t.value ? "btn-primary" : "btn-outline-primary"}`}>
                        {t.label}
                    </button>
                ))}
            </div>
            <div className="row g-3">
                {MOTIVOS[tipo].length > 0 && (
                    <div className="col-sm-6 col-lg-3">
                        <label className="form-label" htmlFor="mov-motivo">Motivo</label>
                        <select id="mov-motivo" className="form-select" value={motivo}
                            onChange={(e) => setMotivo(e.target.value as MotivoMovimiento)}>
                            {MOTIVOS[tipo].map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>
                )}
                <div className="col-sm-6 col-lg-3">
                    <label className="form-label" htmlFor="mov-fecha">Fecha</label>
                    <input id="mov-fecha" type="date" className="form-control" max={hoyISO()} value={fechaMov}
                        onChange={(e) => setFechaMov(e.target.value)} />
                </div>
                <div className="col-sm-6 col-lg-3">
                    <label className="form-label" htmlFor="mov-rancho">
                        {esAlta ? "Llegan a" : tipo === "TRASPASO" ? "Salen de" : "Rancho"}
                    </label>
                    <select id="mov-rancho" className="form-select" value={rancho} onChange={(e) => cambiarRancho(Number(e.target.value))}>
                        <option value={0}>Elige el rancho…</option>
                        {(esAlta ? activos : ranchos).map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select>
                </div>
                {tipo === "TRASPASO" && (
                    <div className="col-sm-6 col-lg-3">
                        <label className="form-label" htmlFor="mov-destino">Llegan a</label>
                        <select id="mov-destino" className="form-select" value={destino} onChange={(e) => setDestino(Number(e.target.value))}>
                            <option value={0}>Elige el rancho…</option>
                            {activos.filter((r) => r.id !== rancho).map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                        </select>
                    </div>
                )}
                {etiquetaContraparte && (
                    <div className="col-sm-6 col-lg-3">
                        <label className="form-label" htmlFor="mov-contraparte">{etiquetaContraparte}</label>
                        <input id="mov-contraparte" className="form-control" maxLength={150} value={contraparte}
                            onChange={(e) => setContraparte(e.target.value)} />
                    </div>
                )}
                {llevaImporte && (
                    <div className="col-sm-6 col-lg-3">
                        <label className="form-label" htmlFor="mov-importe">Importe total <span className="text-body-secondary small">(opcional)</span></label>
                        <div className="input-group">
                            <span className="input-group-text">$</span>
                            <input id="mov-importe" type="number" min="0" step="0.01" className="form-control text-end"
                                value={importe} onChange={(e) => setImporte(e.target.value)} />
                        </div>
                    </div>
                )}
                <div className="col-12">
                    <label className="form-label" htmlFor="mov-notas">{motivo === "MUERTE" ? "Causa de la muerte" : "Notas"}</label>
                    <input id="mov-notas" className="form-control" value={notas} onChange={(e) => setNotas(e.target.value)} />
                </div>
            </div>

            <hr />
            {esAlta ? (
                <>
                    <div className="table-responsive" style={{ maxHeight: "45vh" }}>
                        <table className="table table-sm align-middle tabla-datos mb-2">
                            <thead className="sticky-top">
                                <tr>
                                    <th>Arete</th>
                                    <th>Especie</th>
                                    <th>Categoría</th>
                                    <th>Sexo</th>
                                    <th>Raza / color</th>
                                    <th>Nacimiento</th>
                                    <th className="num" title="Solo sin arete">Cantidad</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {nuevos.map((a, i) => {
                                    const opciones = categorias.filter((c) => c.especie_id === a.especie_id && c.activo);
                                    return (
                                        <tr key={i}>
                                            <td>
                                                <AreteInputs tamano="sm" valor={[a.arete_1, a.arete_2, a.arete_3]}
                                                    onChange={([x, y, z]) => cambiarRenglon(i, { arete_1: x, arete_2: y, arete_3: z })} />
                                            </td>
                                            <td>
                                                <select className="form-select form-select-sm" aria-label="Especie" value={a.especie_id}
                                                    onChange={(e) => {
                                                        const especie = Number(e.target.value);
                                                        const primera = categorias.find((c) => c.especie_id === especie && c.activo);
                                                        cambiarRenglon(i, { especie_id: especie, categoria_id: primera?.id ?? 0, sexo: primera?.sexo || a.sexo });
                                                    }}>
                                                    {especies.filter((e) => e.activo).map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                                                </select>
                                            </td>
                                            <td>
                                                <select className="form-select form-select-sm" aria-label="Categoría" value={a.categoria_id}
                                                    onChange={(e) => {
                                                        const categoria = categorias.find((c) => c.id === Number(e.target.value));
                                                        cambiarRenglon(i, { categoria_id: Number(e.target.value), sexo: categoria?.sexo || a.sexo });
                                                    }}>
                                                    {opciones.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                                </select>
                                            </td>
                                            <td>
                                                <select className="form-select form-select-sm" aria-label="Sexo" value={a.sexo}
                                                    onChange={(e) => cambiarRenglon(i, { sexo: e.target.value as AnimalNuevo["sexo"] })}>
                                                    {SEXOS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                                                </select>
                                            </td>
                                            <td>
                                                <input className="form-control form-control-sm" aria-label="Raza o color" style={{ minWidth: "7rem" }}
                                                    value={a.raza} onChange={(e) => cambiarRenglon(i, { raza: e.target.value })} />
                                            </td>
                                            <td>
                                                <input type="date" className="form-control form-control-sm" aria-label="Nacimiento"
                                                    value={a.fecha_nacimiento ?? ""} max={hoyISO()}
                                                    onChange={(e) => cambiarRenglon(i, { fecha_nacimiento: e.target.value || null })} />
                                            </td>
                                            <td>
                                                <input type="number" min="1" max="500" className="form-control form-control-sm text-end"
                                                    style={{ width: "5rem" }} aria-label="Cantidad" disabled={conArete(a)}
                                                    title={conArete(a) ? "Con arete se registra uno por renglón" : undefined}
                                                    value={conArete(a) ? 1 : a.cantidad}
                                                    onChange={(e) => cambiarRenglon(i, { cantidad: Number(e.target.value) || 0 })} />
                                            </td>
                                            <td className="text-end">
                                                <button type="button" className="btn btn-sm btn-outline-danger" title="Quitar renglón"
                                                    disabled={nuevos.length === 1} onClick={() => setNuevos(nuevos.filter((_, j) => j !== i))}>
                                                    <i className="bi bi-x-lg" aria-hidden="true"></i>
                                                    <span className="visually-hidden">Quitar renglón</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <button type="button" className="btn btn-sm btn-outline-primary"
                        onClick={() => setNuevos([...nuevos, renglonNuevo(nuevos[nuevos.length - 1], especies, categorias)])}>
                        <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>Agregar renglón
                    </button>
                    <span className="small text-body-secondary ms-2">
                        El renglón nuevo copia los datos del anterior. Sin arete se identifica con un folio interno (GAN-00001).
                    </span>
                </>
            ) : !rancho ? (
                <p className="text-body-secondary small mb-0">Elige el rancho para ver sus animales activos.</p>
            ) : disponibles === null ? (
                <p className="text-body-secondary small mb-0">Cargando animales…</p>
            ) : disponibles.length === 0 ? (
                <p className="text-body-secondary small mb-0">El rancho no tiene animales activos.</p>
            ) : (
                <>
                    <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
                        <input className="form-control form-control-sm" style={{ maxWidth: "300px" }} placeholder="Filtrar por arete, folio o categoría..."
                            value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Filtrar animales" />
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={alternarVisibles}>
                            {todosVisibles ? "Quitar" : "Elegir"} {busqueda ? "los filtrados" : "todos"} ({visibles.length})
                        </button>
                    </div>
                    <div className="table-responsive border rounded" style={{ maxHeight: "40vh" }}>
                        <table className="table table-sm table-hover tabla-datos mb-0">
                            <thead className="sticky-top">
                                <tr><th style={{ width: "2rem" }}></th><th>Arete</th><th>Folio</th><th>Categoría</th><th>Sexo</th><th>Raza / color</th></tr>
                            </thead>
                            <tbody>
                                {visibles.map((a) => (
                                    <tr key={a.id} role="button" onClick={() => {
                                        const siguiente = new Set(elegidos);
                                        if (siguiente.has(a.id)) siguiente.delete(a.id); else siguiente.add(a.id);
                                        setElegidos(siguiente);
                                    }}>
                                        <td><input type="checkbox" className="form-check-input" readOnly checked={elegidos.has(a.id)} aria-label={`Elegir ${a.identificacion}`} /></td>
                                        <td className="font-monospace">{a.arete || <span className="text-body-secondary">Sin arete</span>}</td>
                                        <td>{a.folio}</td>
                                        <td>{a.categoria}</td>
                                        <td>{a.sexo === "H" ? "Hembra" : "Macho"}</td>
                                        <td className="small">{a.raza}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {error && <div className="alert alert-danger py-2 small mt-3 mb-0" style={{ whiteSpace: "pre-line" }}>{error}</div>}
            <div className="d-flex justify-content-between align-items-center gap-2 pt-3 mt-3 border-top">
                <span className="fw-semibold">{cabezas} cabeza(s)</span>
                <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-secondary" onClick={onCancelar}>Cancelar</button>
                    <BotonGuardar guardando={guardando} texto={`Registrar ${TIPOS.find((t) => t.value === tipo)?.label.toLowerCase()}`} />
                </div>
            </div>
        </form>
    );
}

export default MovimientoForm;
