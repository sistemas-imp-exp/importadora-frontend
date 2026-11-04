import { useState } from "react";
import BotonGuardar from "../../cartera/components/BotonGuardar";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import type { Animal, AnimalRequest, Categoria, Especie } from "../interfaces/Ganado";
import { SEXOS } from "../utils/ganado";
import AreteInputs from "./AreteInputs";

interface Props {
    animal: Animal;
    especies: Especie[];
    categorias: Categoria[];
    onGuardar: (datos: AnimalRequest) => Promise<void>;
    onCancelar: () => void;
}

/** Corrige los datos del animal; rancho y estado cambian solo con movimientos. */
function AnimalForm({ animal, especies, categorias, onGuardar, onCancelar }: Props) {
    const [form, setForm] = useState<AnimalRequest>({
        arete_1: animal.arete_1,
        arete_2: animal.arete_2,
        arete_3: animal.arete_3,
        especie_id: animal.especie.id,
        categoria_id: animal.categoria.id,
        sexo: animal.sexo,
        raza: animal.raza,
        fecha_nacimiento: animal.fecha_nacimiento,
        notas: animal.notas,
    });
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const opciones = categorias.filter((c) => c.especie_id === form.especie_id && (c.activo || c.id === animal.categoria.id));

    function cambiarCategoria(id: number) {
        const categoria = categorias.find((c) => c.id === id);
        setForm({ ...form, categoria_id: id, sexo: categoria?.sexo || form.sexo });
    }

    async function enviar(e: React.SyntheticEvent) {
        e.preventDefault();
        setError(null);
        setGuardando(true);
        try {
            await onGuardar(form);
        } catch (err) {
            setError(obtenerMensajeError(err));
        } finally {
            setGuardando(false);
        }
    }

    return (
        <form onSubmit={enviar}>
            <div className="row g-3">
                <div className="col-sm-6">
                    <label className="form-label" htmlFor="animal-arete">Arete</label>
                    <AreteInputs
                        id="animal-arete"
                        valor={[form.arete_1, form.arete_2, form.arete_3]}
                        onChange={([a, b, c]) => setForm({ ...form, arete_1: a, arete_2: b, arete_3: c })}
                    />
                    <div className="form-text">Sin arete: deja las 3 vacías (se identifica con {animal.folio}).</div>
                </div>
                <div className="col-sm-6">
                    <label className="form-label" htmlFor="animal-especie">Especie</label>
                    <select id="animal-especie" className="form-select" value={form.especie_id}
                        onChange={(e) => {
                            const especie = Number(e.target.value);
                            const primera = categorias.find((c) => c.especie_id === especie && c.activo);
                            setForm({ ...form, especie_id: especie, categoria_id: primera?.id ?? 0, sexo: primera?.sexo || form.sexo });
                        }}>
                        {especies.filter((e) => e.activo || e.id === animal.especie.id).map((e) => (
                            <option key={e.id} value={e.id}>{e.nombre}</option>
                        ))}
                    </select>
                </div>
                <div className="col-sm-6">
                    <label className="form-label" htmlFor="animal-categoria">Categoría</label>
                    <select id="animal-categoria" className="form-select" value={form.categoria_id}
                        onChange={(e) => cambiarCategoria(Number(e.target.value))}>
                        {opciones.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                </div>
                <div className="col-sm-6">
                    <label className="form-label" htmlFor="animal-sexo">Sexo</label>
                    <select id="animal-sexo" className="form-select" value={form.sexo}
                        onChange={(e) => setForm({ ...form, sexo: e.target.value as AnimalRequest["sexo"] })}>
                        {SEXOS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                </div>
                <div className="col-sm-6">
                    <label className="form-label" htmlFor="animal-raza">Raza / color</label>
                    <input id="animal-raza" className="form-control" value={form.raza}
                        onChange={(e) => setForm({ ...form, raza: e.target.value })} />
                </div>
                <div className="col-sm-6">
                    <label className="form-label" htmlFor="animal-nacimiento">Nacimiento</label>
                    <input id="animal-nacimiento" type="date" className="form-control" value={form.fecha_nacimiento ?? ""}
                        onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value || null })} />
                </div>
                <div className="col-12">
                    <label className="form-label" htmlFor="animal-notas">Notas</label>
                    <textarea id="animal-notas" className="form-control" rows={2} value={form.notas}
                        onChange={(e) => setForm({ ...form, notas: e.target.value })} />
                </div>
            </div>
            {error && <div className="alert alert-danger py-2 small mt-3 mb-0">{error}</div>}
            <div className="d-flex justify-content-end gap-2 pt-3 mt-4 border-top">
                <button type="button" className="btn btn-outline-secondary" onClick={onCancelar}>Cancelar</button>
                <BotonGuardar guardando={guardando} texto="Guardar cambios" />
            </div>
        </form>
    );
}

export default AnimalForm;
