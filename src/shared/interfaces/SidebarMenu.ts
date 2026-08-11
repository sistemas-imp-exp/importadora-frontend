export type SidebarMenuItem = {
    label: string;
    icon?: string;
    to?: string;
    children?: SidebarMenuItem[];
    matchPrefix?: boolean;
    area?: string;
};