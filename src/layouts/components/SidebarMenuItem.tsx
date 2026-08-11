import { NavLink, useLocation } from "react-router-dom";
import type { SidebarMenuItem as MenuItem } from "../../shared/interfaces/SidebarMenu";
import { useState, useEffect } from "react";

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

    const [manualOpen, setManualOpen] = useState(false);

    const active = isItemActive(item, location.pathname);
    const open = active || manualOpen;

    useEffect(() => {
        setManualOpen(false);
    }, [location.pathname]);

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
                    setManualOpen(!open);
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