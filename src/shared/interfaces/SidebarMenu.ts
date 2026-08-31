export type SidebarMenuItem = {
    label: string;
    icon?: string;
    to?: string;
    children?: SidebarMenuItem[];
    matchPrefix?: boolean;
    area?: string;
    // Marca los catálogos de un área (Divisas, Ranchos, Empresas, ...) para
    // que el header pueda mostrarlos como accesos rápidos del área actual,
    // sin depender de que estén agrupados bajo un nodo "Catálogos" en el sidebar.
    catalogo?: boolean;
};