import { Fragment } from "react";

interface Props {
    pagina: number;
    totalPaginas: number;
    onCambiar: (pagina: number) => void;
}

function Paginacion({ pagina, totalPaginas, onCambiar }: Props) {
    if (totalPaginas <= 1) return null;

    const todas = Array.from({ length: totalPaginas }, (_, i) => i + 1);
    const visibles = todas.filter((p) => p === 1 || p === totalPaginas || Math.abs(p - pagina) <= 1);

    return (
        <nav aria-label="Paginación">
            <ul className="pagination pagination-sm mb-0 flex-wrap">
                <li className={`page-item ${pagina === 1 ? "disabled" : ""}`}>
                    <button
                        type="button"
                        className="page-link"
                        onClick={() => onCambiar(pagina - 1)}
                        disabled={pagina === 1}
                    >
                        <i className="bi bi-chevron-left"></i>
                    </button>
                </li>

                {visibles.map((p, idx) => {
                    const anterior = visibles[idx - 1];
                    const mostrarSalto = anterior !== undefined && p - anterior > 1;
                    return (
                        <Fragment key={p}>
                            {mostrarSalto && (
                                <li className="page-item disabled">
                                    <span className="page-link">…</span>
                                </li>
                            )}
                            <li className={`page-item ${p === pagina ? "active" : ""}`}>
                                <button type="button" className="page-link" onClick={() => onCambiar(p)}>
                                    {p}
                                </button>
                            </li>
                        </Fragment>
                    );
                })}

                <li className={`page-item ${pagina === totalPaginas ? "disabled" : ""}`}>
                    <button
                        type="button"
                        className="page-link"
                        onClick={() => onCambiar(pagina + 1)}
                        disabled={pagina === totalPaginas}
                    >
                        <i className="bi bi-chevron-right"></i>
                    </button>
                </li>
            </ul>
        </nav>
    );
}

export default Paginacion;
