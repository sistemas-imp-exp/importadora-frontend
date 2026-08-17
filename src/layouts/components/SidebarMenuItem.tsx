import { NavLink, useLocation } from "react-router-dom";
import type { SidebarMenuItem as MenuItem } from "../../shared/interfaces/SidebarMenu";
import { useState } from "react";

function isItemActive(item: MenuItem, pathname: string): boolean {
    if (item.to) {
        if (item.matchPrefix && (pathname === item.to || pathname.startsWith(`${item.to}/`))) {
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
                    end={!item.matchPrefix}
                    className={({ isActive }) =>
                        `nav-link${isActive || (item.matchPrefix && isItemActive(item, location.pathname)) ? " active" : ""}`
                    }
                >
                    <i className={`nav-icon ${item.icon ?? "bi bi-circle"}`} />
                    <p>{item.label}</p>
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