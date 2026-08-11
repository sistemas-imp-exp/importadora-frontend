import type { Empleado } from "../../interfaces/nomina/Empleado";

export interface ValorFila {
    dias_trabajados: string;
    salario_diario: string;
    descuento: string;
}

interface NominaRanchoGroupProps {
    ranchoNombre: string;
    empleados: Empleado[];
    valores: Record<number, ValorFila>;
    onCambiar: (empleadoId: number, campo: keyof ValorFila, valor: string) => void;
    disabled?: boolean;
}

function formatearMonto(valor: number): string {
    return `$${valor.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function calcularTotales(valor: ValorFila | undefined) {
    const dias = Number(valor?.dias_trabajados ?? 0);
    const salarioDiario = Number(valor?.salario_diario ?? 0);
    const descuento = Number(valor?.descuento ?? 0);
    const totalBruto = dias * salarioDiario;
    const totalNeto = totalBruto - descuento;
    return { totalBruto, totalNeto };
}

function NominaRanchoGroup({ ranchoNombre, empleados, valores, onCambiar, disabled }: NominaRanchoGroupProps) {
    const subtotales = empleados.reduce(
        (acumulado, empleado) => {
            const { totalBruto, totalNeto } = calcularTotales(valores[empleado.id]);
            return {
                bruto: acumulado.bruto + totalBruto,
                neto: acumulado.neto + totalNeto,
            };
        },
        { bruto: 0, neto: 0 }
    );

    return (
        <div className="card card-outline card-primary mb-3">
            <div className="card-header">
                <h3 className="card-title fs-6 fw-bold m-0">
                    <i className="bi bi-geo-alt me-1"></i>
                    {ranchoNombre}
                </h3>
            </div>
            <div className="card-body p-0">
                <div className="table-responsive">
                    <table className="table table-sm table-striped align-middle mb-0">
                        <thead>
                            <tr>
                                <th>Empleado</th>
                                <th>Puesto</th>
                                <th>Cuenta</th>
                                <th style={{ width: 130 }}>Salario diario</th>
                                <th style={{ width: 110 }}>Días trabajados</th>
                                <th style={{ width: 130 }}>Descuento</th>
                                <th className="text-end">Total bruto</th>
                                <th className="text-end">Total neto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {empleados.map((empleado) => {
                                const valor = valores[empleado.id];
                                const { totalBruto, totalNeto } = calcularTotales(valor);

                                return (
                                    <tr key={empleado.id}>
                                        <td>{empleado.nombre}</td>
                                        <td>{empleado.puesto.nombre}</td>
                                        <td>{empleado.banco?.nombre ?? "-"} · {empleado.numero_cuenta || "-"}</td>
                                        <td>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="form-control form-control-sm"
                                                value={valor?.salario_diario ?? "0"}
                                                disabled={disabled}
                                                onChange={(e) => onCambiar(empleado.id, "salario_diario", e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                min="0"
                                                max="7"
                                                step="0.5"
                                                className="form-control form-control-sm"
                                                value={valor?.dias_trabajados ?? "0"}
                                                disabled={disabled}
                                                onChange={(e) => onCambiar(empleado.id, "dias_trabajados", e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="form-control form-control-sm"
                                                value={valor?.descuento ?? "0"}
                                                disabled={disabled}
                                                onChange={(e) => onCambiar(empleado.id, "descuento", e.target.value)}
                                            />
                                        </td>
                                        <td className="text-end">{formatearMonto(totalBruto)}</td>
                                        <td className="text-end fw-semibold">{formatearMonto(totalNeto)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="table-light fw-bold">
                                <td colSpan={6} className="text-end">Subtotal {ranchoNombre}</td>
                                <td className="text-end">{formatearMonto(subtotales.bruto)}</td>
                                <td className="text-end">{formatearMonto(subtotales.neto)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default NominaRanchoGroup;
