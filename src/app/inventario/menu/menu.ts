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
                        icon: "bi bi-building",
                        catalogo: true
                    },
                    {
                        label: "Cámaras",
                        to: "/inventario/camaras",
                        icon: "bi bi-snow2",
                        catalogo: true
                    },
                    {
                        label: "Proveedores",
                        to: "/inventario/proveedores",
                        icon: "bi bi-truck",
                        catalogo: true
                    },
                    {
                        label: "Clientes",
                        to: "/inventario/clientes",
                        icon: "bi bi-people",
                        catalogo: true
                    },
                    {
                        label: "Productos",
                        to: "/inventario/productos",
                        icon: "bi bi-box",
                        catalogo: true
                    }
                ]
            },
            {
                label: "Existencias",
                to: "/inventario/existencias",
                icon: "bi bi-clipboard-data"
            },
            {
                label: "Alertas de caducidad",
                to: "/inventario/alertas-caducidad",
                icon: "bi bi-exclamation-triangle"
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
            },
            {
                label: "Movimientos entre cámaras",
                to: "/inventario/movimientos-camara",
                icon: "bi bi-arrow-left-right"
            }
        ]
    }
];
