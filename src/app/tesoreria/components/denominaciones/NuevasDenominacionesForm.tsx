import { useState } from "react";
import LoadingButton from "../../../../shared/components/LoadingButton";
import type { CrearDenominacionRequest, TipoDenominacion } from "../../interfaces/denominaciones/Denominacion";
import { crearDenominacion } from "../../services/denominacion.service";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";

interface FilaBorrador {
    clave: number;
    tipo: TipoDenominacion;
    valor: string;
}

interface NuevasDenominacionesFormProps {
    divisaId: number;
    onGuardado: () => void;
}

let contadorClaves = 0;

function filaVacia(): FilaBorrador {
    contadorClaves += 1;
    return { clave: contadorClaves, tipo: "B", valor: "" };
}

function NuevasDenominacionesForm({ divisaId, onGuardado }: NuevasDenominacionesFormProps) {
    const [filas, setFilas] = useState<FilaBorrador[]>([]);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function agregarFila() {
        setFilas((actual) => [...actual, filaVacia()]);
    }

    function actualizarFila(clave: number, cambios: Partial<Omit<FilaBorrador, "clave">>) {
        setFilas((actual) => actual.map((fila) => (fila.clave === clave ? { ...fila, ...cambios } : fila)));
    }

    function quitarFila(clave: number) {
        setFilas((actual) => actual.filter((fila) => fila.clave !== clave));
    }

    function validar(): string | null {
        if (filas.length === 0) return "Agrega al menos una denominación nueva.";
        for (const fila of filas) {
            const valor = Number(fila.valor);
            if (!fila.valor.trim() || Number.isNaN(valor) || valor <= 0) {
                return "Cada fila necesita un valor válido mayor que cero.";
            }
        }
        return null;
    }

    async function guardarTodo() {
        const mensaje = validar();
        if (mensaje) {
            setError(mensaje);
            return;
        }
        setError(null);
        setGuardando(true);
        try {
            const solicitudes: CrearDenominacionRequest[] = filas.map((fila) => ({
                divisa: divisaId,
                valor: fila.valor,
                tipo: fila.tipo,
                activa: true,
            }));
            await Promise.all(solicitudes.map((solicitud) => crearDenominacion(solicitud)));
            setFilas([]);
            onGuardado();
        } catch (err) {
            setError(obtenerMensajeError(err));
        } finally {
            setGuardando(false);
        }
    }

    return (
        <div className="border-top pt-3 mt-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">Agregar denominaciones</h6>
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={agregarFila}>
                    <i className="bi bi-plus-lg me-1"></i>Nueva
                </button>
            </div>

            {error && <div className="alert alert-danger py-2">{error}</div>}

            {filas.length > 0 && (
                <>
                    <div className="table-responsive mb-2">
                        <table className="table table-sm align-middle mb-0">
                            <thead>
                                <tr>
                                    <th style={{ width: 160 }}>Tipo</th>
                                    <th>Valor</th>
                                    <th style={{ width: 40 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filas.map((fila) => (
                                    <tr key={fila.clave}>
                                        <td>
                                            <select
                                                className="form-select form-select-sm"
                                                value={fila.tipo}
                                                onChange={(e) => actualizarFila(fila.clave, { tipo: e.target.value as TipoDenominacion })}
                                            >
                                                <option value="B">Billete</option>
                                                <option value="M">Moneda</option>
                                            </select>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="form-control form-control-sm"
                                                placeholder="0.00"
                                                value={fila.valor}
                                                onChange={(e) => actualizarFila(fila.clave, { valor: e.target.value })}
                                            />
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger"
                                                title="Quitar fila"
                                                onClick={() => quitarFila(fila.clave)}
                                            >
                                                <i className="bi bi-x-lg"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="d-flex justify-content-end">
                        <LoadingButton
                            icon="bi bi-save"
                            isLoading={guardando}
                            text={`Guardar ${filas.length > 1 ? `(${filas.length})` : ""}`}
                            onClick={guardarTodo}
                        />
                    </div>
                </>
            )}
        </div>
    );
}

export default NuevasDenominacionesForm;
