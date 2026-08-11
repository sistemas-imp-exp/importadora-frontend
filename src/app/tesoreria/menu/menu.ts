import type { SidebarMenuItem } from "../../../shared/interfaces/SidebarMenu";

export const tesoreriaMenu: SidebarMenuItem[] = [
    {
        label: "Tesorería",
        icon: "bi bi-wallet-fill",
        area: "TES",
        children: [
            {
                label: "Inicio",
                to: "/tesoreria",
                icon: "bi bi-speedometer2"
            },
            {
                label: "Divisas",
                to: "/tesoreria/divisas",
                icon: "bi bi-currency-exchange"
            },
            {
                label: "Caja",
                icon: "bi bi-safe2",
                children: [
                    {
                        label: "Corte de caja",
                        to: "/tesoreria/caja/corte",
                        matchPrefix: true,
                        icon: "bi bi-door-open"
                    },
                    {
                        label: "Movimientos",
                        to: "/tesoreria/caja/movimientos",
                        icon: "bi bi-arrow-left-right"
                    },
                    {
                        label: "Arqueo",
                        to: "/tesoreria/caja/arqueo",
                        icon: "bi bi-clipboard2-check"
                    },
                    {
                        label: "Reportes",
                        to: "/tesoreria/caja/reportes",
                        icon: "bi bi-file-earmark-bar-graph"
                    }
                ]
            },
            {
                label: "Nómina",
                icon: "bi bi-people-fill",
                children: [
                    {
                        label: "Catálogos",
                        icon: "bi bi-collection",
                        children: [
                            {
                                label: "Ranchos",
                                to: "/tesoreria/nomina/ranchos",
                                icon: "bi bi-geo-alt"
                            },
                            {
                                label: "Puestos",
                                to: "/tesoreria/nomina/puestos",
                                icon: "bi bi-briefcase"
                            },
                            {
                                label: "Bancos",
                                to: "/tesoreria/nomina/bancos",
                                icon: "bi bi-bank2"
                            },
                            {
                                label: "Empleados",
                                to: "/tesoreria/nomina/empleados",
                                icon: "bi bi-person-badge"
                            }
                        ]
                    },
                    {
                        label: "Nómina semanal",
                        to: "/tesoreria/nomina/semanal",
                        matchPrefix: true,
                        icon: "bi bi-calendar-week"
                    },
                    {
                        label: "Reportes",
                        to: "/tesoreria/nomina/reportes",
                        icon: "bi bi-file-earmark-bar-graph"
                    }
                ]
            }
        ]
    }
];