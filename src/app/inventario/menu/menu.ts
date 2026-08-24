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
                    },
                    {
                        label: "Cámaras",
                        to: "/inventario/camaras",
                        icon: "bi bi-snow2"
                    },
                    {
                        label: "Proveedores",
                        to: "/inventario/proveedores",
                        icon: "bi bi-truck"
                    },
                    {
                        label: "Clientes",
                        to: "/inventario/clientes",
                        icon: "bi bi-people"
                    },
                    {
                        label: "Productos",
                        to: "/inventario/productos",
                        icon: "bi bi-box"
                    }
                ]
            },
            {
                label: "Entradas",
                to: "/inventario/entradas",
                icon: "bi bi-box-arrow-in-down"
            },
            {
                label: "Salidas",
                to: "/inventario/salidas",
                icon: "bi bi-box-arrow-up"
            }
        ]
    }
];
