import type { SidebarMenuItem } from "../../../shared/interfaces/SidebarMenu";

export const ganadoMenu: SidebarMenuItem[] = [
    {
        label: "Ganado",
        icon: "bi bi-house-heart-fill",
        area: "GAN",
        children: [
            {
                label: "Animales",
                to: "/ganado/animales",
                // El historial de cada animal deja el menú en "Animales".
                matchPrefix: true,
                icon: "bi bi-list-ul",
            },
            {
                label: "Movimientos",
                to: "/ganado/movimientos",
                icon: "bi bi-arrow-left-right",
            },
            {
                label: "Catálogos",
                to: "/ganado/catalogos",
                icon: "bi bi-journal-bookmark",
            },
            {
                label: "Reportes",
                icon: "bi bi-file-earmark-bar-graph",
                children: [
                    {
                        label: "Inventario",
                        to: "/ganado/reportes/inventario",
                        icon: "bi bi-clipboard-data",
                    },
                    {
                        label: "Movimientos",
                        to: "/ganado/reportes/movimientos",
                        icon: "bi bi-table",
                    },
                ],
            },
        ],
    },
];
