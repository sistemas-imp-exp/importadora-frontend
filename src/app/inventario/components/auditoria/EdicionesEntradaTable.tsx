import type { EdicionEntrada } from "../../interfaces/auditoria/EdicionEntrada";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import TablaResponsive from "../../../../shared/components/TablaResponsive";

interface EdicionesEntradaTableProps {
    registros: EdicionEntrada[];
}

function EdicionesEntradaTable({ registros }: EdicionesEntradaTableProps) {
    return (
        <TablaResponsive alturaMaxima="70vh">
            <table className="table tabla-datos">
                <thead>
                    <tr>
                        <th>Fecha de edición</th>
                        <th>Quién</th>
                        <th>Entrada</th>
                        <th>Línea</th>
                        <th>Campo</th>
                        <th>Cambio</th>
                        <th>Motivo</th>
                    </tr>
                </thead>
                <tbody>
                    {registros.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="text-center text-body-secondary py-5">
                                No hay ediciones registradas.
                            </td>
                        </tr>
                    ) : (
                        registros.map((registro) => (
                            <tr key={registro.id} className="fila-principal">
                                <td className="text-nowrap">
                                    {formatearFechaNumerica(new Date(registro.editado_en), "numerico-hora")}
                                </td>
                                <td className="text-wrap">{registro.editado_por ?? "—"}</td>
                                <td className="text-wrap small">
                                    {registro.entrada_referencia || "—"}
                                    {!registro.entrada_existe && (
                                        <span className="badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle ms-1" title="La entrada ya fue eliminada">
                                            Eliminada
                                        </span>
                                    )}
                                </td>
                                <td className="text-wrap small">{registro.linea_referencia || "Cabecera"}</td>
                                <td className="text-wrap">{registro.campo_etiqueta}</td>
                                <td className="text-wrap">
                                    <span className="text-body-secondary"><s>{registro.valor_anterior || "—"}</s></span>
                                    <i className="bi bi-arrow-right mx-2 text-body-secondary" aria-label="cambió a"></i>
                                    <span className="fw-semibold">{registro.valor_nuevo || "—"}</span>
                                </td>
                                <td className="text-wrap small">{registro.motivo}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </TablaResponsive>
    );
}

export default EdicionesEntradaTable;
