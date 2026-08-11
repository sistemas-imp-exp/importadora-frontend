import PageHeader from "../../../layouts/components/PageHeader";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { actualizarUsuario, crearUsuario, obtenerUsuarios } from "../services/usuario.service";
import { obtenerAreas } from "../services/area.service";
import type { Usuario } from "../interfaces/Usuario";
import type { Area } from "../interfaces/Area";
import UsuariosTable from "../components/UsuariosTable";
import UsuarioForm from "../components/UsuarioForm";
import SkeletonTable from "../../../shared/components/SkeletonTable";
import Modal from "../../../shared/components/Modal";
import SmallBox from "../../../shared/components/SmallBox";
import CardCollapseButton from "../../../shared/components/CardCollapseButton";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import { useToastContext } from "../../../shared/context/ToastProvider";

function UsuariosView() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [mostrarModal, setMostrarModal] = useState(false);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
    const [colapsado, setColapsado] = useState(false);

    const { mostrarToast } = useToastContext();

    useEffect(() => {
        cargar();
    }, []);

    async function cargar() {
        try {
            const [datosUsuarios, datosAreas] = await Promise.all([
                obtenerUsuarios(),
                obtenerAreas(),
            ]);

            setUsuarios(datosUsuarios);
            setAreas(datosAreas);
            setError(null);
        } catch (error) {
            const mensaje = obtenerMensajeError(error);
            setError(mensaje);
            mostrarToast("Error al cargar", mensaje, "danger");
        } finally {
            setLoading(false);
        }
    }

    async function guardarUsuario(usuario: Usuario) {
        try {
            if (usuario.id === 0) {
                await crearUsuario(usuario);
                mostrarToast("Usuario creado", "El usuario fue registrado correctamente.", "success");
            } else {
                await actualizarUsuario(usuario);
                mostrarToast("Usuario actualizado", "Los cambios fueron guardados correctamente.", "success");
            }

            await cargar();

            setMostrarModal(false);
            setUsuarioSeleccionado(null);
        } catch (error) {
            mostrarToast("Error del servidor", obtenerMensajeError(error), "danger");
            setUsuarioSeleccionado(usuario);
            throw error;
        }
    }

    async function alternarActivo(usuario: Usuario) {
        try {
            await actualizarUsuario({ ...usuario, is_active: !usuario.is_active });
            await cargar();
            mostrarToast(
                usuario.is_active ? "Usuario desactivado" : "Usuario activado",
                `El usuario ${usuario.username} fue ${usuario.is_active ? "desactivado" : "activado"} correctamente.`,
                "success"
            );
        } catch (error) {
            mostrarToast("Error del servidor", obtenerMensajeError(error), "danger");
        }
    }

    return (
        <>
            <PageHeader
                title="Usuarios"
                subtitle="Catálogo de usuarios y asignación de áreas de acceso"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Usuarios" },
                ]}
            />

            <div className="container-fluid">
                <div className="row mb-3">
                    <div className="col-md-3 col-6">
                        <SmallBox titulo="Usuarios activos" valor={usuarios.filter((u) => u.is_active).length} icono="bi bi-person-gear" color="success" />
                    </div>
                    <div className="col-md-3 col-6">
                        <SmallBox titulo="Usuarios en total" valor={usuarios.length} icono="bi bi-person-gear" color="primary" />
                    </div>
                </div>

                <div className="card card-outline card-primary">
                    <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                        <h3 className="card-title mb-0 me-auto">Lista de usuarios</h3>

                        <div className="card-tools d-flex gap-2">
                            <Link className="btn btn-outline-secondary" to="/usuarios/roles">
                                <i className="bi bi-shield-check me-1" aria-hidden="true"></i>
                                Gestionar roles
                            </Link>
                            <button
                                className="btn btn-success"
                                onClick={() => {
                                    setUsuarioSeleccionado(null);
                                    setMostrarModal(true);
                                }}
                            >
                                <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
                                Nuevo usuario
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
                                <SkeletonTable columnas={6} filas={5} />
                            ) : (
                                <UsuariosTable
                                    usuarios={usuarios}
                                    onEditar={(usuario) => {
                                        setUsuarioSeleccionado(usuario);
                                        setMostrarModal(true);
                                    }}
                                    onToggleActivo={alternarActivo}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Modal
                title={usuarioSeleccionado ? "Editar usuario" : "Nuevo usuario"}
                show={mostrarModal}
                onClose={() => {
                    setMostrarModal(false);
                    setUsuarioSeleccionado(null);
                }}
            >
                <UsuarioForm
                    usuario={usuarioSeleccionado}
                    areas={areas}
                    onGuardar={guardarUsuario}
                    onCancelar={() => {
                        setMostrarModal(false);
                        setUsuarioSeleccionado(null);
                    }}
                />
            </Modal>
        </>
    );
}

export default UsuariosView;
