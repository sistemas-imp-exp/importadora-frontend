import { useEffect, useState } from "react";
import PageHeader from "../../../../layouts/components/PageHeader";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import TablaResponsive from "../../../../shared/components/TablaResponsive";
import { useAuth } from "../../../../shared/hooks/useAuth";
import { useToastContext } from "../../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import { getFullName } from "../../../../shared/utils/userUtils";
import type { SaldoInicialApi } from "../../interfaces/caja/Caja";
import { guardarSaldosIniciales, obtenerSaldosIniciales } from "../../services/caja.service";

function dinero(simbolo: string, valor: string): string {
    return `${simbolo}${Number(valor).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Saldo inicial de caja por divisa, sin fecha: se suma a todos los saldos
 * calculados (cualquier día = saldo inicial + movimientos hasta ese día).
 * Tesorería lo consulta; solo el superusuario lo modifica.
 */
function SaldosInicialesView() {
    const { mostrarToast } = useToastContext();
    const { user } = useAuth();
    const esSuperusuario = !!user?.is_superuser;
    const [saldos, setSaldos] = useState<SaldoInicialApi[]>([]);
    // Monto capturado por divisa (texto del input).
    const [montos, setMontos] = useState<Record<number, string>>({});
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    function aplicar(datos: SaldoInicialApi[]) {
        setSaldos(datos);
        setMontos(Object.fromEntries(datos.map((s) => [s.divisa.id, s.monto])));
    }

    useEffect(() => {
        obtenerSaldosIniciales()
            .then(aplicar)
            .catch((err) => mostrarToast("Error al cargar", obtenerMensajeError(err), "danger"))
            .finally(() => setCargando(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cambios = saldos.filter((s) => Number(montos[s.divisa.id] || 0) !== Number(s.monto));

    async function guardar(e: React.FormEvent) {
        e.preventDefault();
        if (cambios.some((s) => Number(montos[s.divisa.id] || 0) < 0)) {
            mostrarToast("Monto inválido", "El saldo inicial no puede ser negativo.", "warning");
            return;
        }
        setGuardando(true);
        try {
            aplicar(await guardarSaldosIniciales(
                cambios.map((s) => ({ divisa_id: s.divisa.id, monto: montos[s.divisa.id] || "0" })),
            ));
            mostrarToast("Saldos iniciales guardados", "Todos los saldos de caja se recalculan con los nuevos montos.", "success");
        } catch (err) {
            mostrarToast("Error al guardar", obtenerMensajeError(err), "danger");
        } finally {
            setGuardando(false);
        }
    }

    return (
        <>
            <PageHeader
                title="Saldos iniciales"
                subtitle="Saldo de caja por divisa antes de cualquier movimiento"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Tesorería", to: "/tesoreria" },
                    { label: "Saldos iniciales" },
                ]}
            />

            <div className="container-fluid">
                {!esSuperusuario && (
                    <div className="alert alert-light border d-flex align-items-center gap-2 py-2 small" role="status">
                        <i className="bi bi-eye text-body-secondary" aria-hidden="true"></i>
                        <span>Solo el <strong>superusuario</strong> puede modificar los saldos iniciales.</span>
                    </div>
                )}

                <form className="card card-outline card-primary" onSubmit={guardar}>
                    <div className="card-body p-0">
                        {cargando ? (
                            <SkeletonTable columnas={3} filas={3} />
                        ) : (
                            <TablaResponsive>
                                <table className="table table-sm table-hover align-middle mb-0 tabla-datos">
                                    <thead>
                                        <tr>
                                            <th>Divisa</th>
                                            <th className="num">Saldo inicial</th>
                                            <th>Última modificación</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {saldos.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="text-center text-body-secondary py-4">
                                                    No hay divisas activas.
                                                </td>
                                            </tr>
                                        ) : (
                                            saldos.map((s) => (
                                                <tr key={s.divisa.id}>
                                                    <td>
                                                        <span className="fw-semibold">{s.divisa.codigo}</span>{" "}
                                                        <span className="text-body-secondary">{s.divisa.nombre}</span>
                                                    </td>
                                                    <td className="num" style={{ width: "14rem" }}>
                                                        {esSuperusuario ? (
                                                            <div className="input-group input-group-sm">
                                                                <span className="input-group-text">{s.divisa.simbolo}</span>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    className="form-control text-end"
                                                                    aria-label={`Saldo inicial ${s.divisa.codigo}`}
                                                                    value={montos[s.divisa.id] ?? ""}
                                                                    onChange={(e) => setMontos({ ...montos, [s.divisa.id]: e.target.value })}
                                                                />
                                                            </div>
                                                        ) : (
                                                            dinero(s.divisa.simbolo, s.monto)
                                                        )}
                                                    </td>
                                                    <td className="small text-body-secondary">
                                                        {s.editado_por && s.editado_en
                                                            ? `${getFullName(s.editado_por)} · ${formatearFechaNumerica(new Date(s.editado_en), "numerico-hora")}`
                                                            : "—"}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </TablaResponsive>
                        )}
                        <p className="small text-body-secondary m-3">
                            <i className="bi bi-info-circle me-1" aria-hidden="true"></i>
                            El saldo de cualquier día es el saldo inicial más todos los ingresos y menos todos los egresos
                            hasta ese día. Cambiarlo recalcula todos los saldos de caja.
                        </p>
                    </div>
                    {esSuperusuario && (
                        <div className="card-footer d-flex justify-content-end">
                            <button type="submit" className="btn btn-primary btn-sm" disabled={guardando || cambios.length === 0}>
                                {guardando && <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>}
                                Guardar saldos iniciales
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </>
    );
}

export default SaldosInicialesView;
