const CALIDADES = [0.8, 0.6, 0.4, 0.25];
const ESCALAS = [1, 0.75, 0.5];

function cargarImagen(archivo: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(archivo);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("No se pudo leer la imagen."));
        };
        img.src = url;
    });
}

function canvasABlob(canvas: HTMLCanvasElement, calidad: number): Promise<Blob | null> {
    return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", calidad));
}

/**
 * Si la imagen pesa más que `limiteBytes`, la reduce (menor resolución y/o
 * calidad JPEG) probando combinaciones hasta que quepa en el límite. Si no
 * es una imagen, o ya pesa menos del límite, la regresa tal cual.
 * PDF/XLSX no se tocan aquí -- no se pueden comprimir sin perder contenido,
 * así que si exceden el límite se dejan que el backend los rechace.
 */
export async function comprimirImagenSiEsNecesaria(archivo: File, limiteBytes: number): Promise<File> {
    if (!archivo.type.startsWith("image/") || archivo.size <= limiteBytes) {
        return archivo;
    }

    const img = await cargarImagen(archivo);
    const canvas = document.createElement("canvas");
    const contexto = canvas.getContext("2d");
    if (!contexto) return archivo;

    let mejorBlob: Blob | null = null;

    for (const escala of ESCALAS) {
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        contexto.clearRect(0, 0, canvas.width, canvas.height);
        contexto.drawImage(img, 0, 0, canvas.width, canvas.height);

        for (const calidad of CALIDADES) {
            const blob = await canvasABlob(canvas, calidad);
            if (!blob) continue;
            mejorBlob = blob;
            if (blob.size <= limiteBytes) {
                const nombre = archivo.name.replace(/\.[^.]+$/, "") + ".jpg";
                return new File([blob], nombre, { type: "image/jpeg" });
            }
        }
    }

    // No se logró bajar del límite; se manda el mejor intento (el más
    // comprimido) y que el backend decida -- mejor que no ofrecer nada.
    if (mejorBlob) {
        const nombre = archivo.name.replace(/\.[^.]+$/, "") + ".jpg";
        return new File([mejorBlob], nombre, { type: "image/jpeg" });
    }
    return archivo;
}
