import type { EdicionEntrada } from "../../interfaces/auditoria/EdicionEntrada";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";

interface EdicionesEntradaTableProps {
    registros: EdicionEntrada[];
}

function EdicionesEntradaTable({ registros }: EdicionesEntradaTableProps) {
    return (
        <div className="table-responsive">
            <table className="table table-striped table-sm mb-0">
                <thead>
                    <tr>
                        <th className="text-wrap">Fecha de edición</th>
                        <th className="text-wrap">Quién</th>
                        <th className="text-wrap">Entrada</th>
                        <th className="text-wrap">Línea</th>
                        <th className="text-wrap">Campo</th>
                        <th className="text-wrap">Antes</th>
                        <th className="text-wrap">Después</th>
                        <th className="text-wrap">Motivo</th>
                    </tr>
                </thead>
                <tbody>
                    {registros.length === 0 ? (
                        <tr>
                            <td colSpan={8} className="text-center text-muted py-4">
                                No hay ediciones registradas.
                            </td>
                        </tr>
                    ) : (
                        registros.map((registro) => (
                            <tr key={registro.id}>
                                <td className="text-nowrap">
                                    {formatearFechaNumerica(new Date(registro.editado_en), "numerico-hora")}
                                </td>
                                <td className="text-wrap">{registro.editado_por ?? "—"}</td>
                                <td className="text-wrap small">
                                    {registro.entrada_referencia || "—"}
                                    {!registro.entrada_existe && (
                                        <span className="badge text-bg-dark ms-1" title="La entrada ya fue eliminada">
                                            Eliminada
                                        </span>
                                    )}
                                </td>
                                <td className="text-wrap small">{registro.linea_referencia || "Cabecera"}</td>
                                <td className="text-wrap">{registro.campo_etiqueta}</td>
                                <td className="text-wrap text-body-secondary">
                                    <s>{registro.valor_anterior || "—"}</s>
                                </td>
                                <td className="text-wrap fw-semibold">{registro.valor_nuevo || "—"}</td>
                                <td className="text-wrap small">{registro.motivo}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default EdicionesEntradaTable;
