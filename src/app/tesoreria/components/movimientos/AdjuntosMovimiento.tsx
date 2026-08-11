import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { comprimirImagenSiEsNecesaria } from "../../../../shared/utils/comprimirImagen";
import type { ArchivoMovimiento } from "../../interfaces/movimientos/Archivo";
import { EXTENSIONES_PERMITIDAS, TAMANO_MAXIMO_BYTES } from "../../interfaces/movimientos/Archivo";
import {
    eliminarArchivoDeMovimiento,
    obtenerArchivosDeMovimiento,
    subirArchivoDeMovimiento,
} from "../../services/archivosMovimiento.service";

interface Props {
    movimientoId: number;
    onCambio?: () => void;
}

type EstadoSubida = "en-progreso" | "completado" | "error";

interface ArchivoEnCola {
    idLocal: string;
    archivo: File;
    progreso: number;
    estado: EstadoSubida;
    mensajeError?: string;
    controlador: AbortController;
    resultado?: ArchivoMovimiento;
}

const ACCEPT = EXTENSIONES_PERMITIDAS.map((ext) => `.${ext}`).join(",");

function formatearTamano(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extensionDe(nombre: string): string {
    return nombre.split(".").pop()?.toLowerCase() ?? "";
}

function iconoParaArchivo(nombre: string): string {
    const ext = extensionDe(nombre);
    if (ext === "pdf") return "bi-file-earmark-pdf text-danger";
    if (ext === "xlsx") return "bi-file-earmark-excel text-success";
    if (["png", "jpg", "jpeg"].includes(ext)) return "bi-file-earmark-image text-primary";
    return "bi-file-earmark text-secondary";
}

function esImagen(nombre: string): boolean {
    return ["png", "jpg", "jpeg"].includes(extensionDe(nombre));
}

function AdjuntosMovimiento({ movimientoId, onCambio }: Props) {
    const [archivosExistentes, setArchivosExistentes] = useState<ArchivoMovimiento[]>([]);
    const [cargando, setCargando] = useState(true);
    const [cola, setCola] = useState<ArchivoEnCola[]>([]);
    const [arrastrando, setArrastrando] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const colaRef = useRef<ArchivoEnCola[]>([]);

    async function cargarArchivos(idObjetivo: number, estaVigente: () => boolean) {
        setCola([]);
        setCargando(true);
        try {
            const datos = await obtenerArchivosDeMovimiento(idObjetivo);
            if (estaVigente()) setArchivosExistentes(datos);
        } catch {
            if (estaVigente()) setArchivosExistentes([]);
        } finally {
            if (estaVigente()) setCargando(false);
        }
    }

    // Si cambia el movimiento (se reabre el modal para otro, o se navega a
    // otro detalle) recargamos su lista de archivos. La bandera "vigente"
    // descarta la respuesta si para cuando llega ya se pidió otro movimiento.
    useEffect(() => {
        let vigente = true;
        const temporizador = setTimeout(() => cargarArchivos(movimientoId, () => vigente), 0);
        return () => {
            vigente = false;
            clearTimeout(temporizador);
        };
    }, [movimientoId]);

    // colaRef se mantiene al día fuera del render (no se puede leer/escribir
    // un ref durante el render) para que el cleanup de abajo, que solo debe
    // correr al desmontar, pueda ver siempre la cola más reciente.
    useEffect(() => {
        colaRef.current = cola;
    }, [cola]);

    // Si el componente se desmonta (se cierra el modal o se navega a otra
    // página) con subidas en curso, se cancelan en vez de dejarlas colgadas.
    useEffect(() => {
        return () => {
            for (const item of colaRef.current) {
                if (item.estado === "en-progreso") item.controlador.abort();
            }
        };
    }, []);

    function actualizarItem(idLocal: string, cambios: Partial<ArchivoEnCola>) {
        setCola((actual) => actual.map((item) => (item.idLocal === idLocal ? { ...item, ...cambios } : item)));
    }

    async function procesarArchivo(item: ArchivoEnCola) {
        try {
            const archivoFinal = await comprimirImagenSiEsNecesaria(item.archivo, TAMANO_MAXIMO_BYTES);

            const subido = await subirArchivoDeMovimiento(
                movimientoId,
                archivoFinal,
                (porcentaje) => actualizarItem(item.idLocal, { progreso: porcentaje }),
                item.controlador.signal
            );

            // El archivo se queda visible en la cola marcado como "completado"
            // (no desaparece solo) -- así varias subidas simultáneas no
            // duplican filas entre la cola y la lista de guardados.
            actualizarItem(item.idLocal, { estado: "completado", progreso: 100, resultado: subido });
            onCambio?.();
        } catch (err) {
            if (axios.isCancel(err)) {
                return; // cancelado a propósito por el usuario, no es un error
            }
            actualizarItem(item.idLocal, { estado: "error", mensajeError: obtenerMensajeError(err) });
        }
    }

    function agregarArchivos(lista: FileList | null) {
        if (!lista) return;

        const nuevos: ArchivoEnCola[] = [];
        for (const archivo of Array.from(lista)) {
            const ext = extensionDe(archivo.name);
            if (!EXTENSIONES_PERMITIDAS.includes(ext)) {
                nuevos.push({
                    idLocal: crypto.randomUUID(),
                    archivo,
                    progreso: 0,
                    estado: "error",
                    mensajeError: `Formato .${ext || "?"} no permitido. Solo: ${EXTENSIONES_PERMITIDAS.join(", ")}.`,
                    controlador: new AbortController(),
                });
                continue;
            }
            nuevos.push({
                idLocal: crypto.randomUUID(),
                archivo,
                progreso: 0,
                estado: "en-progreso",
                controlador: new AbortController(),
            });
        }

        setCola((actual) => [...actual, ...nuevos]);
        for (const item of nuevos) {
            if (item.estado === "en-progreso") {
                procesarArchivo(item);
            }
        }
    }

    function reintentar(item: ArchivoEnCola) {
        const controlador = new AbortController();
        const actualizado: ArchivoEnCola = { ...item, estado: "en-progreso", progreso: 0, mensajeError: undefined, controlador };
        setCola((actual) => actual.map((i) => (i.idLocal === item.idLocal ? actualizado : i)));
        procesarArchivo(actualizado);
    }

    function cancelarEnCurso(item: ArchivoEnCola) {
        item.controlador.abort();
        setCola((actual) => actual.filter((i) => i.idLocal !== item.idLocal));
    }

    function quitarDeCola(item: ArchivoEnCola) {
        setCola((actual) => actual.filter((i) => i.idLocal !== item.idLocal));
    }

    async function eliminarExistente(archivo: ArchivoMovimiento) {
        if (!window.confirm(`¿Eliminar "${archivo.nombreOriginal}"? Esta acción no se puede deshacer.`)) return;

        try {
            await eliminarArchivoDeMovimiento(archivo.id);
            setArchivosExistentes((actual) => actual.filter((a) => a.id !== archivo.id));
            onCambio?.();
        } catch (err) {
            window.alert(obtenerMensajeError(err));
        }
    }

    async function eliminarDeCola(item: ArchivoEnCola) {
        if (!item.resultado) return;
        if (!window.confirm(`¿Eliminar "${item.resultado.nombreOriginal}"? Esta acción no se puede deshacer.`)) return;

        try {
            await eliminarArchivoDeMovimiento(item.resultado.id);
            setCola((actual) => actual.filter((i) => i.idLocal !== item.idLocal));
            onCambio?.();
        } catch (err) {
            window.alert(obtenerMensajeError(err));
        }
    }

    return (
        <div>
            <div
                className={`d-flex flex-wrap align-items-center gap-2 border border-2 border-dashed rounded px-3 py-2 mb-2 ${arrastrando ? "border-primary bg-primary-subtle" : "border-secondary-subtle"
                    }`}
                onDragOver={(e) => {
                    e.preventDefault();
                    setArrastrando(true);
                }}
                onDragLeave={() => setArrastrando(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setArrastrando(false);
                    agregarArchivos(e.dataTransfer.files);
                }}
            >
                <i className="bi bi-cloud-arrow-up fs-3 text-secondary"></i>
                <span className="text-secondary small">Arrastra archivos aquí, o</span>
                <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => inputRef.current?.click()}>
                    <i className="bi bi-folder2-open me-1"></i>
                    Elegir archivos
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept={ACCEPT}
                    className="d-none"
                    onChange={(e) => {
                        agregarArchivos(e.target.files);
                        e.target.value = "";
                    }}
                />
                <span className="text-muted ms-auto" style={{ fontSize: "0.75rem" }}>
                    PNG, JPG, JPEG, XLSX o PDF — máx. {TAMANO_MAXIMO_BYTES / (1024 * 1024)} MB (las imágenes se comprimen si pesan más)
                </span>
            </div>

            {cola.length > 0 && (
                <ul className="list-group mb-3" style={{ maxHeight: 280, overflowY: "auto" }}>
                    {cola.map((item) => (
                        <li key={item.idLocal} className="list-group-item">
                            <div className="d-flex align-items-center gap-2">
                                <i className={`bi ${iconoParaArchivo(item.archivo.name)} fs-4`}></i>
                                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                    <div className="text-truncate small fw-semibold">{item.archivo.name}</div>
                                    {item.estado === "en-progreso" && (
                                        <div className="progress" style={{ height: 6 }}>
                                            <div
                                                className="progress-bar"
                                                role="progressbar"
                                                style={{ width: `${item.progreso}%` }}
                                            />
                                        </div>
                                    )}
                                    {item.estado === "error" && (
                                        <div className="text-danger small">
                                            <i className="bi bi-exclamation-triangle me-1"></i>
                                            {item.mensajeError}
                                        </div>
                                    )}
                                    {item.estado === "completado" && (
                                        <div className="text-success small">
                                            <i className="bi bi-check-circle me-1"></i>
                                            Subido correctamente
                                        </div>
                                    )}
                                </div>
                                {item.estado === "en-progreso" && (
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => cancelarEnCurso(item)}
                                        title="Cancelar"
                                    >
                                        <i className="bi bi-x-lg"></i>
                                    </button>
                                )}
                                {item.estado === "error" && (
                                    <>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => reintentar(item)}
                                            title="Reintentar"
                                        >
                                            <i className="bi bi-arrow-clockwise"></i>
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={() => quitarDeCola(item)}
                                            title="Quitar de la lista"
                                        >
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </>
                                )}
                                {item.estado === "completado" && item.resultado && (
                                    <>
                                        <a
                                            href={item.resultado.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-sm btn-outline-secondary"
                                            title="Ver / descargar"
                                        >
                                            <i className="bi bi-download"></i>
                                        </a>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => eliminarDeCola(item)}
                                            title="Eliminar"
                                        >
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <h6 className="text-muted small fw-bold text-uppercase mb-2 border-top pt-3">
                Archivos guardados {archivosExistentes.length > 0 && `(${archivosExistentes.length})`}
            </h6>

            {cargando ? (
                <p className="text-muted small">Cargando...</p>
            ) : archivosExistentes.length === 0 ? (
                <p className="text-muted small">Este movimiento todavía no tiene archivos adjuntos.</p>
            ) : (
                <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 g-2" style={{ maxHeight: 320, overflowY: "auto" }}>
                    {archivosExistentes.map((archivo) => (
                        <div className="col" key={archivo.id}>
                            <div className="card h-100">
                                {esImagen(archivo.nombreOriginal) ? (
                                    <img
                                        src={archivo.url}
                                        alt={archivo.nombreOriginal}
                                        className="card-img-top"
                                        style={{ height: 90, objectFit: "cover" }}
                                    />
                                ) : (
                                    <div
                                        className="d-flex align-items-center justify-content-center bg-body-secondary"
                                        style={{ height: 90 }}
                                    >
                                        <i className={`bi ${iconoParaArchivo(archivo.nombreOriginal)}`} style={{ fontSize: "2.5rem" }}></i>
                                    </div>
                                )}
                                <div className="card-body p-2">
                                    <div className="text-truncate small fw-semibold" title={archivo.nombreOriginal}>
                                        {archivo.nombreOriginal}
                                    </div>
                                    <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                                        {formatearTamano(archivo.tamano)}
                                    </div>
                                    <div className="d-flex gap-1 mt-1">
                                        <a
                                            href={archivo.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-outline-secondary btn-sm flex-grow-1"
                                            title="Ver / descargar"
                                        >
                                            <i className="bi bi-download"></i>
                                        </a>
                                        <button
                                            type="button"
                                            className="btn btn-outline-danger btn-sm flex-grow-1"
                                            onClick={() => eliminarExistente(archivo)}
                                            title="Eliminar"
                                        >
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AdjuntosMovimiento;
