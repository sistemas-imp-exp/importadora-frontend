import PageHeader from "../../../layouts/components/PageHeader";
import { useAuth } from "../../../shared/hooks/useAuth";
import { useToastContext } from "../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import { actualizarMe, cambiarPassword, eliminarFoto, subirFoto } from "../../../shared/services/auth.service";
import AvatarUploader from "../components/AvatarUploader";
import DatosForm from "../components/DatosForm";
import PasswordForm from "../components/PasswordForm";

function PerfilView() {
    const { user, updateUser } = useAuth();
    const { mostrarToast } = useToastContext();

    if (!user) return null;

    const inicial = user.first_name?.charAt(0) || user.username.charAt(0);

    async function guardarDatos(datos: { first_name: string; last_name: string; email: string }) {
        try {
            const actualizado = await actualizarMe(datos);
            updateUser(actualizado);
            mostrarToast("Datos actualizados", "Tus datos fueron guardados correctamente.", "success");
        } catch (error) {
            mostrarToast("Error al guardar", obtenerMensajeError(error), "danger");
            throw error;
        }
    }

    async function guardarPassword(datos: { password_actual: string; password_nueva: string; password_nueva2: string }) {
        try {
            await cambiarPassword(datos);
            mostrarToast("Contraseña actualizada", "Tu contraseña fue cambiada correctamente.", "success");
        } catch (error) {
            mostrarToast("Error al cambiar contraseña", obtenerMensajeError(error), "danger");
            throw error;
        }
    }

    async function subirFotoPerfil(archivo: File) {
        try {
            const { foto } = await subirFoto(archivo);
            updateUser({ ...user!, foto });
            mostrarToast("Foto actualizada", "Tu foto de perfil fue actualizada.", "success");
        } catch (error) {
            mostrarToast("Error al subir la foto", obtenerMensajeError(error), "danger");
            throw error;
        }
    }

    async function quitarFotoPerfil() {
        try {
            await eliminarFoto();
            updateUser({ ...user!, foto: null });
            mostrarToast("Foto eliminada", "Tu foto de perfil fue eliminada.", "success");
        } catch (error) {
            mostrarToast("Error al eliminar la foto", obtenerMensajeError(error), "danger");
        }
    }

    return (
        <>
            <PageHeader
                title="Mi perfil"
                subtitle="Administra tus datos, tu contraseña y tu foto de perfil"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Mi perfil" },
                ]}
            />

            <div className="container-fluid">
                <div className="row">
                    <div className="col-md-4 mb-3">
                        <div className="card card-outline card-primary h-100">
                            <div className="card-header">
                                <h3 className="card-title mb-0">Foto de perfil</h3>
                            </div>
                            <div className="card-body">
                                <AvatarUploader
                                    foto={user.foto}
                                    inicial={inicial}
                                    onSubir={subirFotoPerfil}
                                    onEliminar={quitarFotoPerfil}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="col-md-8 mb-3">
                        <div className="card card-outline card-primary mb-3">
                            <div className="card-header">
                                <h3 className="card-title mb-0">Mis datos</h3>
                            </div>
                            <div className="card-body">
                                <DatosForm user={user} onGuardar={guardarDatos} />
                            </div>
                        </div>

                        <div className="card card-outline card-primary">
                            <div className="card-header">
                                <h3 className="card-title mb-0">Contraseña</h3>
                            </div>
                            <div className="card-body">
                                <PasswordForm onGuardar={guardarPassword} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default PerfilView;
