import { Route } from "react-router-dom";
import DashboardHome from "./views/DashboardHome";

export const dashboardRoutes = (
    <>
        <Route path="/" element={<DashboardHome />} />
    </>
);
