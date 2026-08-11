import { useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import Modal from "./Modal";
import LoadingButton from "./LoadingButton";

interface ImageCropperModalProps {
    show: boolean;
    archivo: File | null;
    aspect?: number;
    onCancelar: () => void;
    onConfirmar: (archivoRecortado: File) => Promise<void> | void;
}

function cargarImagenDesdeUrl(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("No se pudo leer la imagen."));
        img.src = url;
    });
}

async function recortarImagen(imageSrc: string, area: Area, nombreArchivo: string): Promise<File> {
    const img = await cargarImagenDesdeUrl(imageSrc);
    const canvas = document.createElement("canvas");
    canvas.width = area.width;
    canvas.height = area.height;

    const contexto = canvas.getContext("2d");
    if (!contexto) throw new Error("No se pudo procesar la imagen.");

    contexto.drawImage(
        img,
        area.x, area.y, area.width, area.height,
        0, 0, area.width, area.height
    );

    const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9)
    );
    if (!blob) throw new Error("No se pudo procesar la imagen.");

    const nombre = nombreArchivo.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], nombre, { type: "image/jpeg" });
}

function ImageCropperModal({ show, archivo, aspect = 1, onCancelar, onConfirmar }: ImageCropperModalProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [areaRecorte, setAreaRecorte] = useState<Area | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!archivo) {
            setImageSrc(null);
            return;
        }

        const url = URL.createObjectURL(archivo);
        setImageSrc(url);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setAreaRecorte(null);

        return () => URL.revokeObjectURL(url);
    }, [archivo]);

    async function confirmar() {
        if (!imageSrc || !areaRecorte || !archivo) return;

        setIsLoading(true);
        try {
            const archivoRecortado = await recortarImagen(imageSrc, areaRecorte, archivo.name);
            await onConfirmar(archivoRecortado);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Modal title="Ajustar imagen" show={show} onClose={onCancelar} closeDisabled={isLoading}>
            {imageSrc && (
                <>
                    <div className="position-relative bg-dark" style={{ width: "100%", height: 320 }}>
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={aspect}
                            cropShape="round"
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={(_area, areaPixeles) => setAreaRecorte(areaPixeles)}
                        />
                    </div>

                    <div className="mt-3">
                        <label className="form-label small text-secondary">Zoom</label>
                        <input
                            type="range"
                            className="form-range"
                            min={1}
                            max={3}
                            step={0.05}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                        />
                    </div>

                    <div className="d-flex justify-content-between mt-3">
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={onCancelar}
                            disabled={isLoading}
                        >
                            Cancelar
                        </button>

                        <LoadingButton
                            isLoading={isLoading}
                            text="Guardar foto"
                            icon="bi bi-check-lg"
                            onClick={confirmar}
                        />
                    </div>
                </>
            )}
        </Modal>
    );
}

export default ImageCropperModal;
