import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../../layouts/components/PageHeader";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import Modal from "../../../../shared/components/Modal";
import CardCollapseButton from "../../../../shared/components/CardCollapseButton";
import { useToastContext } from "../../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import NominasSemanalesTable from "../../components/nomina/NominasSemanalesTable";
import NominaSemanalForm from "../../components/nomina/NominaSemanalForm";
import type { NominaSemanal } from "../../interfaces/nomina/NominaSemanal";
import { crearNomina, obtenerNominas } from "../../services/nomina/nominaSemanal.service";

function NominaSemanalListView() {
    const [nominas, setNominas] = useState<NominaSemanal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [colapsado, setColapsado] = useState(false);

    const { mostrarToast } = useToastContext();
    const navigate = useNavigate();

    useEffect(() => {
        cargar();
    }, []);

    async function cargar() {
        try {
            const datos = await obtenerNominas();
            setNominas(datos);
            setError(null);
        } catch (err) {
            const mensaje = obtenerMensajeError(err);
            setError(mensaje);
            mostrarToast("Error al cargar", mensaje, "danger");
        } finally {
            setLoading(false);
        }
    }

    async function crear(datos: { fecha_inicio: string; fecha_fin: string; observaciones: string }) {
        try {
            const nueva = await crearNomina({ ...datos, detalles: [] });
            setMostrarModal(false);
            mostrarToast("Nómina creada", "Ahora captura los días trabajados de cada empleado.", "success");
            navigate(`/tesoreria/nomina/semanal/${nueva.id}`);
        } catch (err) {
            mostrarToast("Error al crear", obtenerMensajeError(err), "danger");
            throw err;
        }
    }

    return (
        <>
            <PageHeader
                title="Nómina semanal"
                subtitle="Captura de días trabajados y pagos por rancho"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Tesorería", to: "/tesoreria" },
                    { label: "Nómina semanal" }
                ]}
            />

            <div className="container-fluid">
                <div className="card card-outline card-primary">
                    <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                        <h3 className="card-title mb-0 me-auto">Nóminas registradas</h3>
                        <div className="card-tools d-flex gap-2">
                            <button className="btn btn-success" onClick={() => setMostrarModal(true)}>
                                <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
                                Nueva nómina
                            </button>
                            <CardCollapseButton collapsed={colapsado} onToggle={() => setColapsado((c) => !c)} />
                        </div>
                    </div>

                    {!colapsado && (
                        <div className="card-body p-0">
                            {error ? (
                                <div className="alert alert-danger m-3" role="alert">
                                    <div className="text-center">{error}</div>
                                </div>
                            ) : loading ? (
                                <SkeletonTable columnas={4} filas={5} />
                            ) : (
                                <NominasSemanalesTable nominas={nominas} />
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Modal title="Nueva nómina semanal" show={mostrarModal} onClose={() => setMostrarModal(false)}>
                <NominaSemanalForm onGuardar={crear} onCancelar={() => setMostrarModal(false)} />
            </Modal>
        </>
    );
}

export default NominaSemanalListView;
