import { tesoreriaMenu } from "../app/tesoreria/menu/menu";
import { usuariosMenu } from "../app/usuarios/menu/menu";
import { inventarioMenu } from "../app/inventario/menu/menu";
import { carteraMenu } from "../app/cartera/menu/menu";
import type { SidebarMenuItem } from "../shared/interfaces/SidebarMenu";

export const sidebarMenu: SidebarMenuItem[] = [
    // Sin área: cada quien ve las de sus áreas.
    { label: "Notificaciones", icon: "bi bi-bell", to: "/notificaciones", matchPrefix: true },
    ...usuariosMenu,
    ...inventarioMenu,
    ...tesoreriaMenu,
    ...carteraMenu,
];