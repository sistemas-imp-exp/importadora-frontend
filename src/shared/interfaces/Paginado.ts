/** Forma estándar de DRF cuando un listado está paginado en el servidor. */
export interface RespuestaPaginada<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface ParamsPaginados {
    pagina?: number;
    porPagina?: number;
    busqueda?: string;
}

/** Traduce los params del front a los que espera el backend. */
export function construirParams(params: ParamsPaginados): URLSearchParams {
    const query = new URLSearchParams();
    if (params.pagina) query.set("page", String(params.pagina));
    if (params.porPagina) query.set("por_pagina", String(params.porPagina));
    if (params.busqueda?.trim()) query.set("busqueda", params.busqueda.trim());
    return query;
}
