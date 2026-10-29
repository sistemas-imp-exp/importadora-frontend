import type { SidebarMenuItem } from "../../../shared/interfaces/SidebarMenu";

export const carteraMenu: SidebarMenuItem[] = [
    {
        label: "Cartera",
        icon: "bi bi-briefcase-fill",
        area: "CAR",
        children: [
            {
                label: "Inicio",
                to: "/cartera",
                icon: "bi bi-speedometer2",
            },
            {
                label: "Clientes",
                to: "/cartera/clientes",
                // El detalle de cada cliente deja el menú en "Clientes".
                matchPrefix: true,
                icon: "bi bi-people",
            },
            {
                label: "Pagos",
                to: "/cartera/pagos",
                icon: "bi bi-cash-coin",
            },
            {
                label: "Ajustes",
                to: "/cartera/ajustes",
                icon: "bi bi-sliders",
            },
            {
                label: "Resguardos",
                to: "/cartera/resguardos",
                icon: "bi bi-safe",
            },
            {
                label: "Reportes",
                icon: "bi bi-file-earmark-bar-graph",
                children: [
                    {
                        label: "Saldos de clientes",
                        to: "/cartera/reportes/saldos",
                        icon: "bi bi-table",
                    },
                ],
            },
        ],
    },
];
