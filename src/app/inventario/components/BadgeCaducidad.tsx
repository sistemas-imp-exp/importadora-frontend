import { formatearFechaNumerica } from "../../../shared/utils/fechas";
import {
    clasificarNivelCaducidad,
    diasRestantesHasta,
    CLASE_BADGE_NIVEL,
    ETIQUETA_NIVEL,
    RANGO_NIVEL,
    type NivelCaducidad,
} from "../utils/caducidad";

/** Descripción del nivel para el tooltip: "Crítico (0 a 7 días): vence en 3 días". */
function describirCaducidad(nivel: NivelCaducidad, dias: number): string {
    const cuando = dias < 0 ? `venció hace ${-dias} día(s)` : dias === 0 ? "vence hoy" : `vence en ${dias} día(s)`;
    return `${ETIQUETA_NIVEL[nivel]} (${RANGO_NIVEL[nivel]}): ${cuando}`;
}

function BadgeCaducidad({ fechaCaducidad }: { fechaCaducidad: string | null }) {
    if (!fechaCaducidad) return <span className="text-body-secondary">—</span>;
    const dias = diasRestantesHasta(fechaCaducidad);
    const nivel = clasificarNivelCaducidad(dias);
    if (!nivel) return <span>{formatearFechaNumerica(new Date(fechaCaducidad + "T00:00:00"))}</span>;
    return (
        <span className="d-inline-flex align-items-center gap-1 text-nowrap" title={describirCaducidad(nivel, dias)}>
            {formatearFechaNumerica(new Date(fechaCaducidad + "T00:00:00"))}
            <span className={`badge ${CLASE_BADGE_NIVEL[nivel]}`}>{ETIQUETA_NIVEL[nivel]}</span>
        </span>
    );
}

export default BadgeCaducidad;
