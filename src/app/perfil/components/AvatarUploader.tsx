import { useRef, useState } from "react";
import ImageCropperModal from "../../../shared/components/ImageCropperModal";
import { comprimirImagenSiEsNecesaria } from "../../../shared/utils/comprimirImagen";

const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

interface AvatarUploaderProps {
    foto: string | null;
    inicial: string;
    onSubir: (archivo: File) => Promise<void>;
    onEliminar: () => Promise<void>;
}

function AvatarUploader({ foto, inicial, onSubir, onEliminar }: AvatarUploaderProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);

    const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
    const [mostrarCropper, setMostrarCropper] = useState(false);
    const [eliminando, setEliminando] = useState(false);

    function seleccionarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
        const archivo = e.target.files?.[0];
        e.target.value = "";
        if (!archivo) return;

        setArchivoSeleccionado(archivo);
        setMostrarCropper(true);
    }

    async function confirmarRecorte(archivoRecortado: File) {
        const archivoFinal = await comprimirImagenSiEsNecesaria(archivoRecortado, TAMANO_MAXIMO_BYTES);
        await onSubir(archivoFinal);
        setMostrarCropper(false);
        setArchivoSeleccionado(null);
    }

    async function eliminarFoto() {
        setEliminando(true);
        try {
            await onEliminar();
        } finally {
            setEliminando(false);
        }
    }

    return (
        <div className="d-flex flex-column align-items-center">
            <span
                className="rounded-circle shadow bg-secondary text-white d-inline-flex align-items-center justify-content-center overflow-hidden"
                style={{ width: 120, height: 120, fontSize: "2.5rem" }}
            >
                {foto ? (
                    <img src={foto} alt="Foto de perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                    inicial.toUpperCase()
                )}
            </span>

            <div className="d-flex gap-2 mt-3">
                <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => inputRef.current?.click()}
                >
                    <i className="bi bi-camera me-1"></i>
                    Cambiar foto
                </button>

                {foto && (
                    <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={eliminarFoto}
                        disabled={eliminando}
                    >
                        <i className="bi bi-trash me-1"></i>
                        Quitar
                    </button>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/png, image/jpeg"
                className="d-none"
                onChange={seleccionarArchivo}
            />

            <ImageCropperModal
                show={mostrarCropper}
                archivo={archivoSeleccionado}
                aspect={1}
                onCancelar={() => {
                    setMostrarCropper(false);
                    setArchivoSeleccionado(null);
                }}
                onConfirmar={confirmarRecorte}
            />
        </div>
    );
}

export default AvatarUploader;
