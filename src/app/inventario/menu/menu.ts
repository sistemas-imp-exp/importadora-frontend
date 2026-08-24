import type { SidebarMenuItem } from "../../../shared/interfaces/SidebarMenu";

export const inventarioMenu: SidebarMenuItem[] = [
    {
        label: "Inventario",
        icon: "bi bi-box-seam",
        area: "INV",
        children: [
            {
                label: "Catálogos",
                icon: "bi bi-collection",
                children: [
                    {
                        label: "Empresas",
                        to: "/inventario/empresas",
                        icon: "bi bi-building"
                    }
                ]
            }
        ]
    }
];
