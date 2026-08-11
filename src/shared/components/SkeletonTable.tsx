interface SkeletonTableProps {
    columnas?: number;
    filas?: number;
}

function SkeletonTable({ columnas = 5, filas = 6 }: SkeletonTableProps) {
    return (
        <div className="table-responsive" aria-hidden="true">
            <table className="table table-striped align-middle mb-0 placeholder-glow">
                <tbody>
                    {Array.from({ length: filas }).map((_, fila) => (
                        <tr key={fila}>
                            {Array.from({ length: columnas }).map((_, col) => (
                                <td key={col}>
                                    <span className="placeholder col-8 rounded" style={{ height: "0.8rem" }}></span>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default SkeletonTable;
