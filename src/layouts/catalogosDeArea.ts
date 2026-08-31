import type { SidebarMenuItem } from "../shared/interfaces/SidebarMenu";

export interface CatalogoHeader {
    to: string;
    label: string;
    icon?: string;
}

function contienePathname(item: SidebarMenuItem, pathname: string): boolean {
    if (item.to && (pathname === item.to || pathname.startsWith(`${item.to}/`))) {
        return true;
    }
    return (item.children ?? []).some((hijo) => contienePathname(hijo, pathname));
}

/**
 * Encuentra el ítem raíz del sidebar (una "área": Tesorería, Inventario, ...)
 * al que pertenece la ruta actual, buscando cuál rama contiene ese pathname.
 */
export function encontrarAreaActual(menu: SidebarMenuItem[], pathname: string): SidebarMenuItem | null {
    return menu.find((item) => contienePathname(item, pathname)) ?? null;
}

function recolectarCatalogos(item: SidebarMenuItem, acumulado: CatalogoHeader[]): void {
    if (item.catalogo && item.to) {
        acumulado.push({ to: item.to, label: item.label, icon: item.icon });
    }
    for (const hijo of item.children ?? []) {
        recolectarCatalogos(hijo, acumulado);
    }
}

/** Todos los ítems marcados `catalogo: true` dentro de un área, sin importar su nivel de anidado. */
export function obtenerCatalogosDelArea(area: SidebarMenuItem): CatalogoHeader[] {
    const acumulado: CatalogoHeader[] = [];
    recolectarCatalogos(area, acumulado);
    return acumulado;
}
