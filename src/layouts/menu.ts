import { tesoreriaMenu } from "../app/tesoreria/menu/menu";
import { usuariosMenu } from "../app/usuarios/menu/menu";
import { inventarioMenu } from "../app/inventario/menu/menu";

export const sidebarMenu = [
    ...usuariosMenu,
    ...inventarioMenu,
    ...tesoreriaMenu,
];