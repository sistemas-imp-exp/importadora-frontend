import type { EstadoDeuda } from "../../interfaces/deudas/Deuda";

const BADGE_ESTADO: Record<EstadoDeuda, { clase: string; texto: string }> = {
    abierta: { clase: "bg-warning-subtle text-warning-emphasis border-warning-subtle", texto: "Abierta" },
    pagada: { clase: "bg-success-subtle text-success-emphasis border-success-subtle", texto: "Pagada" },
    cancelada: { clase: "bg-secondary-subtle text-secondary-emphasis border-secondary-subtle", texto: "Cancelada" },
};

function BadgeEstadoDeuda({ estado }: { estado: EstadoDeuda }) {
    const { clase, texto } = BADGE_ESTADO[estado];
    return <span className={`badge border ${clase}`}>{texto}</span>;
}

export default BadgeEstadoDeuda;
