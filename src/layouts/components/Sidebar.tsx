import { Link } from "react-router-dom";
import { sidebarMenu } from "../menu";
import SidebarMenuItem from "./SidebarMenuItem";
import { useAuth } from "../../shared/hooks/useAuth";

function Sidebar() {
    const { hasArea } = useAuth();
    return (
        <aside className="app-sidebar bg-body-secondary shadow" data-bs-theme="dark" onClick={(e) => e.stopPropagation()}>
            <div className="sidebar-brand">
                <Link to="/" className="brand-link">
                    <img
                        src="/logo.png"
                        alt="Importadora y Exportadora de Mariscos"
                        className="brand-image"
                        style={{ objectFit: "contain" }}
                    />
                    <span className="brand-text fw-light">
                        Importadora ERP
                    </span>
                </Link>
            </div>

            <div className="sidebar-wrapper">
                <nav className="mt-2">
                    <div className="px-3 pb-2">
                        <Link
                            to="/"
                            className="btn btn-sm btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
                        >
                            <i className="bi bi-speedometer"></i>
                            Inicio
                        </Link>
                    </div>

                    <ul
                        className="nav sidebar-menu flex-column"
                        data-lte-toggle="treeview"
                        role="navigation"
                        aria-label="Main navigation"
                        data-accordion="false"
                    >
                        {sidebarMenu
                            .filter(item => !item.area || hasArea(item.area))
                            .map((item) => (
                                <SidebarMenuItem
                                    key={item.to ?? item.label}
                                    item={item}
                                />
                            ))}
                    </ul>
                </nav>
            </div>
        </aside>
    );
}

export default Sidebar;