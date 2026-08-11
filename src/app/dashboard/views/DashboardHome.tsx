import PageHeader from "../../../layouts/components/PageHeader";
// import { useAuth } from "../../../shared/hooks/useAuth";

function DashboardHome() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Panel principal de administración"
        breadcrumbs={[{ label: "Inicio", to: "/" }]}
      />

      <div className="container-fluid">
      </div>
    </>
  );
}

export default DashboardHome;
