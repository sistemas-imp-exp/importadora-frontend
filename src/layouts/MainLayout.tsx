import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";

function MainLayout() {
    const location = useLocation();

    useEffect(() => {
        document.body.classList.add(
            "layout-fixed",
            "sidebar-expand-lg",
            "bg-body-tertiary"
        );
        const resize = () => {
            if (window.innerWidth >= 992) {
                document.body.classList.remove("sidebar-open");
            }
        };
        window.addEventListener("resize", resize);

        return () => {
            document.body.classList.remove(
                "layout-fixed",
                "sidebar-expand-lg",
                "bg-body-tertiary"
            );
            window.removeEventListener("resize", resize);
        };

    }, []);
    useEffect(() => {

        const closeSidebar = () => {

            if (window.innerWidth < 992) {
                document.body.classList.remove("sidebar-open");
            }

        };

        window.addEventListener("click", closeSidebar);

        return () => {
            window.removeEventListener("click", closeSidebar);
        };

    }, []);
    useEffect(() => {
        window.dispatchEvent(new Event("resize"));
    }, [location]);

    return (
        <div className="app-wrapper">
            <Header />
            <Sidebar />

            <main className="app-main">
                <div className="app-content">
                    <div className="container-fluid content-max-width py-3">
                        <Outlet />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default MainLayout;