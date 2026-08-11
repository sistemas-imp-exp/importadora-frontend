import { useAuth } from "../../../../shared/hooks/useAuth";
import type { Denominacion } from "../../interfaces/denominaciones/Denominacion";

interface DenominacionesTableProps {
    denominaciones: Denominacion[];
    simbolo: string;
    onToggleActiva: (denominacion: Denominacion) => void;
    onEliminar: (denominacion: Denominacion) => void;
}

function formatearValor(valor: string, simbolo: string): string {
    return `${simbolo}${Number(valor).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function DenominacionesTable({ denominaciones, simbolo, onToggleActiva, onEliminar }: DenominacionesTableProps) {
    const { user } = useAuth();
    const esSuperusuario = !!user?.is_superuser;

    const ordenadas = [...denominaciones].sort((a, b) => {
        if (a.tipo !== b.tipo) return a.tipo === "B" ? -1 : 1;
        return Number(b.valor) - Number(a.valor);
    });

    return (
        <div className="table-responsive">
            <table className="table table-striped mb-0">
                <thead>
                    <tr>
                        <th className="text-wrap">Tipo</th>
                        <th className="text-wrap">Valor</th>
                        <th className="text-wrap text-center">Estado</th>
                        {esSuperusuario && <th className="text-wrap text-end">Acciones</th>}
                    </tr>
                </thead>
                <tbody>
                    {ordenadas.length === 0 ? (
                        <tr>
                            <td colSpan={esSuperusuario ? 4 : 3} className="text-center text-muted py-4">
                                Esta divisa todavía no tiene billetes ni monedas registrados.
                            </td>
                        </tr>
                    ) : (
                        ordenadas.map((denominacion) => (
                            <tr key={denominacion.id}>
                                <td className="text-wrap">
                                    {denominacion.tipo === "B" ? "Billete" : "Moneda"}
                                </td>
                                <td className="text-wrap">{formatearValor(denominacion.valor, simbolo)}</td>
                                <td className="text-wrap text-center">
                                    {denominacion.activa ? (
                                        <span className="badge text-bg-success">Activo</span>
                                    ) : (
                                        <span className="badge text-bg-secondary">Inactivo</span>
                                    )}
                                </td>
                                {esSuperusuario && (
                                    <td>
                                        <div className="text-end">
                                            <div className="btn-group btn-group-sm">
                                                <button
                                                    className="btn btn-outline-secondary"
                                                    type="button"
                                                    title={denominacion.activa ? "Desactivar" : "Activar"}
                                                    onClick={() => onToggleActiva(denominacion)}
                                                >
                                                    <i className={`bi ${denominacion.activa ? "bi-toggle-on" : "bi-toggle-off"}`} aria-hidden="true"></i>
                                                </button>
                                                <button
                                                    className="btn btn-outline-secondary"
                                                    type="button"
                                                    title="Eliminar denominación"
                                                    onClick={() => onEliminar(denominacion)}
                                                >
                                                    <i className="bi bi-trash" aria-hidden="true"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default DenominacionesTable;
