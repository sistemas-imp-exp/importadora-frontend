import { NavLink, useLocation } from "react-router-dom";
import type { SidebarMenuItem as MenuItem } from "../../shared/interfaces/SidebarMenu";
import { useState } from "react";
import { useNotificaciones } from "../../shared/hooks/useNotificaciones";

/** Pendientes de la opción (por su ruta) más los de todas sus hijas. */
function pendientesDe(item: MenuItem, puntos: Record<string, number>): number {
    const propios = item.to ? puntos[item.to] ?? 0 : 0;
    return propios + (item.children ?? []).reduce((acc, hijo) => acc + pendientesDe(hijo, puntos), 0);
}

function isItemActive(item: MenuItem, pathname: string): boolean {
    if (item.to) {
        const prefijo = typeof item.matchPrefix === "string" ? item.matchPrefix : item.to;
        if (item.matchPrefix && (pathname === item.to || pathname.startsWith(`${prefijo}/`))) {
            return true;
        }
        if (item.to === pathname) {
            return true;
        }
    }
    return item.children?.some(child => isItemActive(child, pathname)) ?? false;
}

interface Props {
    item: MenuItem;
    level?: number;
}

export default function SidebarMenuItem({
    item,
    level = 0,
}: Props) {
    const location = useLocation();
    const { resumen } = useNotificaciones();
    const pendientes = pendientesDe(item, resumen.puntos);

    const active = isItemActive(item, location.pathname);
    const [open, setOpen] = useState(active);

    // Al navegar: si el destino cae dentro de esta rama, se expande (para que
    // el usuario vea dónde está); si no, se colapsa. Ajustado durante el
    // render (no en un efecto) siguiendo el patrón de React para "resetear
    // estado cuando cambia una prop" — un clic para colapsar/expandir
    // mientras se sigue en la misma página no dispara este ajuste, así que
    // el toggle manual siempre funciona, incluso en la rama activa (antes
    // "open" se forzaba a true mientras active fuera true, y el clic no
    // tenía efecto alguno).
    const [rutaPrevia, setRutaPrevia] = useState(location.pathname);
    if (location.pathname !== rutaPrevia) {
        setRutaPrevia(location.pathname);
        setOpen(active);
    }

    if (!item.children?.length) {
        return (
            <li className="nav-item">
                <NavLink
                    to={item.to ?? "#"}
                    end={item.matchPrefix !== true}
                    className={({ isActive }) =>
                        `nav-link${isActive || (item.matchPrefix && isItemActive(item, location.pathname)) ? " active" : ""}`
                    }
                >
                    <i className={`nav-icon ${item.icon ?? "bi bi-circle"}`} />
                    <p>
                        {item.label}
                        {pendientes > 0 && (
                            <span className="nav-badge badge text-bg-danger rounded-pill menu-pendiente"
                                title={`${pendientes} pendiente(s) por atender`}>
                                {pendientes}
                            </span>
                        )}
                    </p>
                </NavLink>
            </li>
        );
    }

    return (
        <li className={`nav-item ${open ? "menu-open" : ""}`}>
            <a
                href="#"
                className={`nav-link ${active ? "active" : ""}`}
                onClick={(e) => {
                    e.preventDefault();
                    setOpen(!open);
                }}
            >
                <i className={`nav-icon ${item.icon ?? "bi bi-folder"}`} />
                <p>
                    {item.label}
                    {pendientes > 0 && (
                        <span className="menu-punto" title={`${pendientes} pendiente(s) por atender`}>
                            <span className="visually-hidden">{pendientes} pendientes</span>
                        </span>
                    )}
                    <i className="nav-arrow bi bi-chevron-right" />
                </p>
            </a>

            <ul className="nav nav-treeview">
                {item.children.map(child => (
                    <SidebarMenuItem
                        key={child.to ?? child.label}
                        item={child}
                        level={level + 1}
                    />
                ))}
            </ul>
        </li>
    );
}