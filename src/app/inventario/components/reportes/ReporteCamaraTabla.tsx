import type { BloqueReporteCamara, CamaraReporte } from "../../interfaces/reportes/ReporteCamaras";
import { formatearDinero } from "../../utils/existencias";

interface ReporteCamaraTablaProps {
    camara: CamaraReporte;
    fecha: string;
    empresa?: string;
}

/** "18.00" -> "18"; "18.50" -> "18.5": el peso master se muestra como en el formato del área. */
function peso(valor: string): string {
    return String(Number(valor));
}

function FilasBloque({ bloque, mostrarRotulo }: { bloque: BloqueReporteCamara; mostrarRotulo: boolean }) {
    return (
        <>
            {mostrarRotulo && (
                <tr className="reporte-rotulo">
                    <td colSpan={7}>
                        {bloque.etiqueta.toUpperCase()}
                        {bloque.presentacion === "" && (
                            <span
                                className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle ms-2 text-normal"
                                title="Estos productos no tienen presentación (entero o colas) en el catálogo de Productos"
                            >
                                <i className="bi bi-exclamation-circle me-1" aria-hidden="true"></i>Completar en Productos
                            </span>
                        )}
                    </td>
                </tr>
            )}
            {bloque.tallas.map((talla) => {
                const filasTalla = talla.tipos.reduce((acc, t) => acc + t.filas.length, 0);
                return talla.tipos.map((tipo, iTipo) =>
                    tipo.filas.map((fila, iFila) => {
                        const primeraDeTalla = iTipo === 0 && iFila === 0;
                        return (
                            <tr key={`${talla.talla}-${tipo.tipo}-${fila.proveedor}-${fila.peso_por_caja}`}>
                                {primeraDeTalla && (
                                    <td rowSpan={filasTalla} className="text-center align-middle">{talla.talla}</td>
                                )}
                                {iFila === 0 && (
                                    <td rowSpan={tipo.filas.length} className="text-center align-middle">{tipo.tipo}</td>
                                )}
                                <td>{fila.proveedor}</td>
                                <td className="text-center">{peso(fila.peso_por_caja)}</td>
                                <td className="num">{fila.cajas.toLocaleString("es-MX")}</td>
                                <td className="num">{formatearDinero(Number(fila.kilos))}</td>
                                {primeraDeTalla && (
                                    <td rowSpan={filasTalla} className="num align-middle">{formatearDinero(Number(talla.existencia))}</td>
                                )}
                            </tr>
                        );
                    })
                );
            })}
            <tr className="reporte-total">
                <td colSpan={4}></td>
                <td className="text-center">SUBTOTAL</td>
                <td className="num">{formatearDinero(Number(bloque.subtotal))}</td>
                <td></td>
            </tr>
        </>
    );
}

/** Vista previa en pantalla, con el mismo formato que el PDF y el Excel. */
function ReporteCamaraTabla({ camara, fecha, empresa }: ReporteCamaraTablaProps) {
    const [anio, mes, dia] = fecha.split("-");
    return (
        <div className="table-responsive">
            <table className="table table-sm reporte-camara mb-0">
                <thead>
                    <tr>
                        <th colSpan={2} className="text-start">EXISTENCIAS {camara.camara.nombre}</th>
                        <th colSpan={3} className="text-start fw-normal">{empresa ?? ""}</th>
                        <th className="text-center">{`${dia}/${mes}/${anio}`}</th>
                        <th></th>
                    </tr>
                    <tr className="reporte-columnas">
                        <th>TALLA</th>
                        <th>TIPO</th>
                        <th>PROVEEDOR</th>
                        <th>PESO MASTER</th>
                        <th>MASTER</th>
                        <th>KILOGRAMOS</th>
                        <th>EXISTENCIA</th>
                    </tr>
                </thead>
                <tbody>
                    {camara.bloques.map((bloque) => (
                        <FilasBloque key={bloque.presentacion} bloque={bloque} mostrarRotulo={camara.bloques.length > 1} />
                    ))}
                    <tr className="reporte-total">
                        <td colSpan={4}></td>
                        <td className="text-center">TOTAL</td>
                        <td className="num">{formatearDinero(Number(camara.total))}</td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

export default ReporteCamaraTabla;
