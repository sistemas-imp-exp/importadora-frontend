import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../../../layouts/components/PageHeader";
import SkeletonCallout from "../../../../shared/components/SkeletonCallout";
import { obtenerCajaDia } from "../../services/caja.service";
import SaldosDelDia from "../../components/caja/SaldosDelDia";
import { obtenerNominaAbierta } from "../../services/nomina/nominaSemanal.service";
import { obtenerEmpleados } from "../../services/nomina/empleado.service";
import { obtenerRanchos } from "../../services/nomina/rancho.service";
import { obtenerBancos } from "../../services/nomina/banco.service";
import { obtenerDivisas } from "../../services/divisa.service";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { useToastContext } from "../../../../shared/context/ToastProvider";
import SmallBox from "../../../../shared/components/SmallBox";
import SkeletonCards from "../../../../shared/components/SkeletonCards";
import type { CajaDiaApi } from "../../interfaces/caja/Caja";
import type { NominaSemanal } from "../../interfaces/nomina/NominaSemanal";

function formatearFechaISO(fechaISO: string): string {
    const [anio, mes, dia] = fechaISO.split("-");
    return `${dia}/${mes}/${anio}`;
}

interface AccesoRapido {
    titulo: string;
    descripcion: string;
    icono: string;
    to: string;
}

const accesos: AccesoRapido[] = [
    {
        titulo: "Movimientos",
        descripcion: "Registrar ingresos y egresos, también de hojas atrasadas.",
        icono: "bi bi-arrow-left-right",
        to: "/tesoreria/caja/movimientos",
    },
    {
        titulo: "Caja diaria",
        descripcion: "Saldo y movimientos de cualquier día.",
        icono: "bi bi-calendar3",
        to: "/tesoreria/caja/diaria",
    },
    {
        titulo: "Arqueo",
        descripcion: "Conteo de efectivo por denominación.",
        icono: "bi bi-cash-stack",
        to: "/tesoreria/caja/arqueo",
    },
    {
        titulo: "Divisas",
        descripcion: "Administrar las monedas disponibles para caja.",
        icono: "bi bi-currency-exchange",
        to: "/tesoreria/divisas",
    },
    {
        titulo: "Empleados",
        descripcion: "Catálogo de empleados por rancho y puesto.",
        icono: "bi bi-person-badge",
        to: "/tesoreria/nomina/empleados",
    },
    {
        titulo: "Nómina semanal",
        descripcion: "Capturar días trabajados y descuentos de la semana.",
        icono: "bi bi-calendar-week",
        to: "/tesoreria/nomina/semanal",
    },
    {
        titulo: "Reportes de nómina",
        descripcion: "Reportes de nómina por rango de fechas, rancho o banco.",
        icono: "bi bi-file-earmark-bar-graph",
        to: "/tesoreria/nomina/reportes",
    },
];

interface Kpis {
    empleadosActivos: number;
    ranchosActivos: number;
    bancosActivos: number;
    divisasActivas: number;
}

function DashboardTesoreria() {
    const [caja, setCaja] = useState<CajaDiaApi | null>(null);
    const [nomina, setNomina] = useState<NominaSemanal | null>(null);
    const [kpis, setKpis] = useState<Kpis | null>(null);
    const [loading, setLoading] = useState(true);
    const { mostrarToast } = useToastContext();

    useEffect(() => {
        cargar();
    }, []);

    async function cargar() {
        try {
            const [cajaHoy, nominaActual, empleados, ranchos, bancos, divisas] = await Promise.all([
                obtenerCajaDia(),
                obtenerNominaAbierta(),
                obtenerEmpleados(),
                obtenerRanchos(),
                obtenerBancos(),
                obtenerDivisas(),
            ]);
            setCaja(cajaHoy);
            setNomina(nominaActual);
            setKpis({
                empleadosActivos: empleados.filter((e) => e.activo).length,
                ranchosActivos: ranchos.filter((r) => r.activo).length,
                bancosActivos: bancos.filter((b) => b.activo).length,
                divisasActivas: divisas.filter((d) => d.activa).length,
            });
        } catch (error) {
            mostrarToast("Error al cargar", obtenerMensajeError(error), "danger");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <PageHeader
                title="Tesorería"
                subtitle="Resumen área"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Tesorería" }
                ]}
            />

            <div className="container-fluid">
                {loading && <SkeletonCards cantidad={4} columnas="col-sm-6 col-lg-3 mb-3" />}

                {!loading && kpis && (
                    <div className="row">
                        <div className="col-sm-6 col-lg-3 mb-3">
                            <SmallBox titulo="Empleados activos" valor={kpis.empleadosActivos} icono="bi bi-person-badge" color="success" />
                        </div>
                        <div className="col-sm-6 col-lg-3 mb-3">
                            <SmallBox titulo="Ranchos activos" valor={kpis.ranchosActivos} icono="bi bi-geo-alt" color="info" />
                        </div>
                        <div className="col-sm-6 col-lg-3 mb-3">
                            <SmallBox titulo="Bancos activos" valor={kpis.bancosActivos} icono="bi bi-bank2" color="warning" />
                        </div>
                        <div className="col-sm-6 col-lg-3 mb-3">
                            <SmallBox titulo="Divisas activas" valor={kpis.divisasActivas} icono="bi bi-currency-exchange" color="primary" />
                        </div>
                    </div>
                )}

                {loading && <SkeletonCallout />}
                {!loading && caja && (
                    <div className="mb-4">
                        <div className="d-flex align-items-center mb-2">
                            <h6 className="text-uppercase small fw-semibold text-body-secondary mb-0 me-auto">Saldo de caja hoy</h6>
                            <Link className="btn btn-outline-primary btn-sm" to="/tesoreria/caja/diaria">
                                <i className="bi bi-calendar3 me-1"></i>Caja diaria
                            </Link>
                        </div>
                        <SaldosDelDia caja={caja} />
                    </div>
                )}

                {!loading && (
                    nomina ? (
                        <div className="callout callout-success mb-4 shadow-sm">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <h6 className="mb-0 fw-bold">Nómina semanal</h6>
                                <span className="badge bg-success px-2 py-1">Abierta</span>
                            </div>
                            <div className="text-muted" style={{ fontSize: "0.9rem" }}>
                                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                                    <p className="mb-0">
                                        <span className="fw-semibold">Semana:</span>{" "}
                                        {formatearFechaISO(nomina.fecha_inicio)} - {formatearFechaISO(nomina.fecha_fin)}
                                    </p>
                                    <Link className="btn btn-primary" to={`/tesoreria/nomina/semanal/${nomina.id}`}>
                                        <i className="bi bi-box-arrow-up-right me-1"></i>
                                        Ir a la nómina
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="callout callout-warning mb-4 shadow-sm">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <h6 className="mb-0 fw-bold">Nómina semanal</h6>
                                <span className="badge bg-secondary px-2 py-1">Sin abrir</span>
                            </div>
                            <div className="text-muted d-flex flex-wrap justify-content-between align-items-center gap-2" style={{ fontSize: "0.9rem" }}>
                                <p className="mb-0">Todavía no hay una nómina semanal sin cerrar.</p>
                                <Link className="btn btn-success" to="/tesoreria/nomina/semanal">
                                    <i className="bi bi-plus-lg me-1"></i>
                                    Ver nóminas
                                </Link>
                            </div>
                        </div>
                    )
                )}

                <div className="row">
                    {accesos.map((acceso) => (
                        <div className="col-sm-12 col-md-6 col-lg-3 mb-3" key={acceso.to}>
                            <Link to={acceso.to} className="text-decoration-none">
                                <div className="card h-100 shadow-sm">
                                    <div className="card-body">
                                        <i className={`${acceso.icono} fs-2 text-primary mb-2 d-block`}></i>
                                        <h3 className="fs-6 fw-bold mb-1 text-body">{acceso.titulo}</h3>
                                        <small className="text-muted">{acceso.descripcion}</small>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

export default DashboardTesoreria;
