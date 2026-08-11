import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/hooks/useAuth";
import { useToastContext } from "../../shared/context/ToastProvider";
import { useLayout } from "../../shared/context/LayoutContext";
import GlobalSearch from "./GlobalSearch";

function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { mostrarToast } = useToastContext();
    const { toggleSidebar, setTheme, theme } = useLayout();
    const [pantallaCompleta, setPantallaCompleta] = useState(false);

    const userInitial = user?.first_name?.charAt(0) || user?.username?.charAt(0) || "U";

    useEffect(() => {
        function sincronizar() {
            setPantallaCompleta(!!document.fullscreenElement);
        }
        document.addEventListener("fullscreenchange", sincronizar);
        return () => document.removeEventListener("fullscreenchange", sincronizar);
    }, []);

    function alternarPantallaCompleta() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen();
        }
    }

    function cerrarSesion() {
        logout();
        mostrarToast(
            "Sesión cerrada",
            "Ha cerrado sesión satisfactoriamente",
            "success"
        )
        navigate("/login", { replace: true });
    }

    return (
        <nav className="app-header navbar navbar-expand bg-body">
            <div className="container-fluid">
                <ul className="navbar-nav">
                    <li className="nav-item">
                        <button
                            className="nav-link"
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleSidebar();
                            }}
                        >
                            <i className="bi bi-list"></i>
                        </button>
                    </li>
                </ul>

                <ul className="navbar-nav ms-auto">
                    <GlobalSearch />
                    <li className="nav-item">
                        <button
                            className="nav-link"
                            type="button"
                            onClick={alternarPantallaCompleta}
                            title={pantallaCompleta ? "Salir de pantalla completa" : "Pantalla completa"}
                        >
                            <i className={`bi ${pantallaCompleta ? "bi-fullscreen-exit" : "bi-arrows-fullscreen"}`}></i>
                        </button>
                    </li>
                    <li className="nav-item dropdown">
                        <a className="nav-link" href="#" id="themeToggle" data-bs-toggle="dropdown" aria-expanded="false">
                            {
                                theme === "light" &&
                                <i className="bi bi-sun-fill"></i>
                            }

                            {
                                theme === "dark" &&
                                <i className="bi bi-moon-fill"></i>
                            }

                            {
                                theme === "auto" &&
                                <i className="bi bi-circle-half"></i>
                            }
                        </a>
                        <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="themeToggle" style={{ minWidth: "8rem" }}>
                            <li>
                                <button
                                    type="button"
                                    className={`dropdown-item d-flex align-items-center ${theme === "light" ? "active" : ""
                                        }`}
                                    onClick={() => setTheme("light")}
                                >
                                    <i className="bi bi-sun-fill me-2"></i>

                                    Light

                                    {
                                        theme === "light" &&
                                        <i className="bi bi-check-lg ms-auto"></i>
                                    }
                                </button>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    className={`dropdown-item d-flex align-items-center ${theme === "dark" ? "active" : ""
                                        }`}
                                    onClick={() => setTheme("dark")}
                                >
                                    <i className="bi bi-moon-fill me-2"></i>

                                    Dark

                                    {
                                        theme === "dark" &&
                                        <i className="bi bi-check-lg ms-auto"></i>
                                    }
                                </button>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    className={`dropdown-item d-flex align-items-center ${theme === "auto" ? "active" : ""
                                        }`}
                                    onClick={() => setTheme("auto")}
                                >
                                    <i className="bi bi-circle-half me-2"></i>

                                    Auto

                                    {
                                        theme === "auto" &&
                                        <i className="bi bi-check-lg ms-auto"></i>
                                    }
                                </button>
                            </li>
                        </ul>
                    </li>
                    <li className="nav-item dropdown user-menu">
                        <a href="#" className="nav-link dropdown-toggle" data-bs-toggle="dropdown">
                            <span className="user-image rounded-circle shadow bg-secondary text-white d-inline-flex align-items-center justify-content-center overflow-hidden" style={{ width: 32, height: 32 }}>
                                {user?.foto ? (
                                    <img src={user.foto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                    userInitial.toUpperCase()
                                )}
                            </span>
                            <span className="d-none d-md-inline ms-2">
                                {user?.first_name || user?.username}
                            </span>
                        </a>
                        <ul className="dropdown-menu dropdown-menu-lg dropdown-menu-end">
                            <li className="user-header text-bg-secondary text-center py-3">
                                <div className="mb-2">
                                    <span className="rounded-circle shadow bg-white text-primary d-inline-flex align-items-center justify-content-center overflow-hidden" style={{ width: 80, height: 80, fontSize: '2rem' }}>
                                        {user?.foto ? (
                                            <img src={user.foto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        ) : (
                                            userInitial.toUpperCase()
                                        )}
                                    </span>
                                </div>
                                <p className="mb-0">
                                    {user?.first_name && user?.last_name ? (
                                        <span>{user.first_name} {user.last_name}</span>
                                    ) : (
                                        <span>{user?.username}</span>
                                    )}
                                </p>
                            </li>
                            <li className="user-footer">
                                <div className="d-flex flex-wrap justify-content-between">
                                    <Link to="/perfil" className="btn btn-outline-secondary">Mi perfil</Link>
                                    <a href="#" className="btn btn-outline-danger" onClick={(e) => {
                                        e.preventDefault();
                                        cerrarSesion();
                                    }}>
                                        Cerrar sesión
                                    </a>
                                </div>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
        </nav>
    );
}

export default Header;
