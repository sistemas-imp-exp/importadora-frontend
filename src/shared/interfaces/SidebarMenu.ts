export type SidebarMenuItem = {
    label: string;
    icon?: string;
    to?: string;
    children?: SidebarMenuItem[];
    // true: también activo en las subrutas de `to`; un texto: activo en las
    // subrutas de ese prefijo (para no encender un hermano como /deudas/deudores).
    matchPrefix?: boolean | string;
    area?: string;
    // Marca los catálogos de un área (Divisas, Ranchos, Empresas, ...) para
    // que el header pueda mostrarlos como accesos rápidos del área actual,
    // sin depender de que estén agrupados bajo un nodo "Catálogos" en el sidebar.
    catalogo?: boolean;
};