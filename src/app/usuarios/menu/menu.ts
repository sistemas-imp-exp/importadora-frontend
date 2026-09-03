import type { SidebarMenuItem } from "../../../shared/interfaces/SidebarMenu";

export const usuariosMenu: SidebarMenuItem[] = [
    {
        label: "Administrador",
        icon: "bi bi-power",
        area: "ADMIN",
        children: [
            {
                label: "Admin backend",
                icon: "bi bi-server",
                to: "/admin/",
                area: "ADMIN",
            },
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
            {
                label: "Auditoría de entradas",
                icon: "bi bi-clock-history",
                to: "/inventario/auditoria-entradas",
                area: "ADMIN",
            },
        ]
    },
];
