import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// type Theme = "light" | "dark";
type Theme = "light" | "dark" | "auto";

interface LayoutContextType {
    collapsed: boolean;
    toggleSidebar: () => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const LayoutContext = createContext<LayoutContextType | null>(null);

export function LayoutProvider({ children }: { children: ReactNode }) {

    const [collapsed, setCollapsed] = useState(
        localStorage.getItem("sidebar") === "true"
    );

    const [theme, setThemeState] = useState<Theme>(
        (localStorage.getItem("theme") as Theme) || "auto"
    );

    useEffect(() => {

        document.body.classList.toggle(
            "sidebar-collapse",
            collapsed
        );

        localStorage.setItem(
            "sidebar",
            String(collapsed)
        );

    }, [collapsed]);

    useEffect(() => {

        const appliedTheme =
            theme === "auto"
                ? (
                    window.matchMedia("(prefers-color-scheme: dark)").matches
                        ? "dark"
                        : "light"
                )
                : theme;

        document.documentElement.setAttribute(
            "data-bs-theme",
            appliedTheme
        );

        localStorage.setItem(
            "theme",
            theme
        );

    }, [theme]);

    return (
        <LayoutContext.Provider
            value={{
                collapsed,
                toggleSidebar: () => {
                    if (window.innerWidth < 992) {
                        document.body.classList.toggle("sidebar-open");
                        return;
                    }
                    setCollapsed(c => !c);
                }, theme,
                setTheme: setThemeState
            }}
        >
            {children}
        </LayoutContext.Provider>
    );
}

export function useLayout() {

    const context = useContext(LayoutContext);

    if (!context)
        throw new Error("LayoutProvider requerido");

    return context;
}