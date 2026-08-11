import type { SidebarMenuItem } from "../../../shared/interfaces/SidebarMenu";

export const usuariosMenu: SidebarMenuItem[] = [
    {
        label: "Usuarios",
        icon: "bi bi-person-gear",
        to: "/usuarios",
        area: "ADMIN",
    },
    {
        label: "Roles",
        icon: "bi bi-shield-check",
        to: "/usuarios/roles",
        area: "ADMIN",
    },
];
