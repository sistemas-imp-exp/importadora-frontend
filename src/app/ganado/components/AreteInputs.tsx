interface Props {
    valor: [string, string, string];
    onChange: (valor: [string, string, string]) => void;
    tamano?: "sm";
    id?: string;
}

const ANCHOS = ["4.2rem", "4.2rem", "4.8rem"];
const AYUDAS = ["0007", "2484", "6789"];

/** Arete en sus 3 partes, como viene en el arete físico (0007 2484 6789). Vacío = sin arete. */
function AreteInputs({ valor, onChange, tamano, id }: Props) {
    return (
        <div className={`input-group flex-nowrap ${tamano ? "input-group-sm" : ""}`} id={id}>
            {valor.map((parte, i) => (
                <input
                    key={i}
                    className="form-control text-center px-1"
                    style={{ maxWidth: ANCHOS[i], minWidth: ANCHOS[i] }}
                    inputMode="numeric"
                    maxLength={10}
                    placeholder={AYUDAS[i]}
                    aria-label={`Arete, parte ${i + 1}`}
                    value={parte}
                    onChange={(e) => {
                        const siguiente = [...valor] as [string, string, string];
                        siguiente[i] = e.target.value.trim();
                        onChange(siguiente);
                    }}
                />
            ))}
        </div>
    );
}

export default AreteInputs;
