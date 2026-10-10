import React, { useState } from 'react';
import { useAuth } from '../../shared/auth/AuthContext';
import { useCajaHoy, useMovimientosCaja, useHistorialCajas, useAbrirCaja, useCerrarCaja } from './useCajaApi';
import { useCajaStore } from '../../shared/store/useCajaStore';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

export default function Caja() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { cajaAbierta, caja } = useCajaStore();

  const { isLoading: loadingHoy } = useCajaHoy();
  const { data: rawMovimientos } = useMovimientosCaja();
  const { data: historial } = useHistorialCajas();
  
  const mutAbrir = useAbrirCaja();
  const mutCerrar = useCerrarCaja();

  const [saldoInicialInput, setSaldoInicialInput] = useState('');
  const [modalHistorial, setModalHistorial] = useState(false);

  if (loadingHoy) return <main className="app-container">Cargando caja...</main>;

  const movimientos = rawMovimientos?.movimientos || [];
  const t = rawMovimientos?.totales || { efectivo: 0, digital: 0, cuenta_corriente: 0, devoluciones: 0, egresos: 0 };

  const totalEgresosSumados = t.egresos + t.devoluciones;
  const saldoInicialVal = Number(caja?.saldo_inicial) || 0;
  const granTotal = t.efectivo + t.digital + t.cuenta_corriente - totalEgresosSumados;

  let saldoIterativo = saldoInicialVal;
  const movsInvertidos = [...movimientos].reverse();
  movsInvertidos.forEach(m => {
    if (m.tipo === "VENTA" && m.metodo_pago === "Cuenta Corriente") {
    } else if (m.tipo === "DEVOLUCION" && m.metodo_pago === "Cuenta Corriente") {
    } else {
      saldoIterativo += (m.ingreso - m.egreso);
    }
    m.saldoVisual = saldoIterativo;
  });

  const handleAbrirCaja = async (e) => {
    e.preventDefault();
    await mutAbrir.mutateAsync({
      comercio_id: session.comercio_id,
      saldo_inicial: Number(saldoInicialInput) || 0,
      fecha: new Date().toLocaleDateString('sv-SE')
    });
    navigate('/ventas');
  };

  const handleCerrarCaja = async () => {
    if (!window.confirm("¿Estás seguro de cerrar la caja?")) return;
    
    await mutCerrar.mutateAsync({
      id: caja.id,
      data: {
        total_ventas: t.efectivo + t.digital,
        total_gastos: t.egresos,
        total_devoluciones: t.devoluciones,
        total_resultado: granTotal,
        total_cuenta_corriente: t.cuenta_corriente
      }
    });
    alert("Caja cerrada exitosamente.");
  };

  const fechaHoyStr = new Date().toLocaleDateString('es-AR');
  const estadoStr = cajaAbierta ? "Abierta" : "Sin abrir";

  return (
    <main className="app-container">
      <div className="app-controls" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="app-title" style={{ marginBottom: 0 }}>Caja del Día</h1>
        <button onClick={() => setModalHistorial(true)} className="app-btn-secondary">Ver Historial de Cajas</button>
      </div>

      <div className="caja-card">
        <div className="caja-info">
          <p><strong>Fecha:</strong> <span>{fechaHoyStr}</span></p>
          <p><strong>Estado:</strong> <span>{estadoStr}</span></p>
        </div>

        {!cajaAbierta && (
          <div className="caja-apertura">
            <input
              type="number"
              className="app-input"
              placeholder="Saldo inicial" id="saldoInicial"
              value={saldoInicialInput}
              onChange={e => setSaldoInicialInput(e.target.value)}
              step="0.01"
            />
            <button onClick={handleAbrirCaja} className="app-btn-primary" id="btnAbrirCaja" disabled={mutAbrir.isPending}>
              Abrir Caja
            </button>
          </div>
        )}

        {cajaAbierta && (
          <div className="caja-resumen">
            <div className="dashboard-cards">
              <div className="card-caja card-inicial">
                <h4>Saldo Inicial</h4>
                <p>${saldoInicialVal.toFixed(2)}</p>
              </div>
              <div className="card-caja card-efectivo">
                <h4>Efectivo</h4>
                <p>${t.efectivo.toFixed(2)}</p>
              </div>
              <div className="card-caja card-digital">
                <h4>Digitales</h4>
                <p>${t.digital.toFixed(2)}</p>
              </div>
              <div className="card-caja card-cc">
                <h4>Cta. Corriente</h4>
                <p>${t.cuenta_corriente.toFixed(2)}</p>
              </div>
              <div className="card-caja card-egresos">
                <h4>Egresos</h4>
                <p>${totalEgresosSumados.toFixed(2)}</p>
              </div>
              <div className="card-caja card-resultado">
                <h4>Total</h4>
                <p>${granTotal.toFixed(2)}</p>
              </div>
            </div>

            <h3 className="app-subtitle" style={{ marginTop: '30px', marginBottom: '10px' }}>Movimientos del Turno</h3>
            <div className="tabla-movimientos-container">
              <table className="tabla-movimientos">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Descripción</th>
                    <th>Ingreso</th>
                    <th>Egreso</th>
                    <th>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((m, i) => (
                    <tr key={i}>
                      <td>{m.tipo}</td>
                      <td>{m.descripcion}</td>
                      <td>{m.ingreso > 0 ? `$${m.ingreso.toFixed(2)}` : '-'}</td>
                      <td>{m.egreso > 0 ? `$${m.egreso.toFixed(2)}` : '-'}</td>
                      <td>${m.saldoVisual.toFixed(2)}</td>
                    </tr>
                  ))}
                  {movimientos.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{textAlign:'center', padding:'1rem'}}>No hay movimientos aún</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '25px', textAlign: 'right' }}>
              <button onClick={handleCerrarCaja} className="app-btn-primary" style={{ padding: '15px 30px', fontSize: '1.1em', backgroundColor: '#e07a5f' }} disabled={mutCerrar.isPending}>
                Cerrar Caja
              </button>
            </div>
          </div>
        )}
      </div>

      {modalHistorial && <HistorialModal onClose={() => setModalHistorial(false)} historial={historial} />}
    </main>
  );
}

function HistorialModal({ onClose, historial }) {
  const exportarExcel = () => {
    if (!historial || historial.length === 0) {
      alert("No hay datos para exportar");
      return;
    }
    const datosExcel = historial.map(c => {
      const fechaLocalArray = c.fecha ? c.fecha.split("T")[0].split("-") : null;
      const dateAperturaStr = fechaLocalArray ? `${fechaLocalArray[2]}/${fechaLocalArray[1]}/${fechaLocalArray[0]}` : "";
      const fechaCierre = c.hora_cierre ? new Date(c.hora_cierre).toLocaleDateString("es-AR") : `Sin Cerrar (${dateAperturaStr})`;
      return {
        "Fecha": fechaCierre,
        "Estado": c.estado.toUpperCase(),
        "Saldo Inicial": Number(c.saldo_inicial),
        "Ventas": Number(c.total_ventas || 0),
        "Cuenta Corri.": Number(c.total_cuenta_corriente || 0),
        "Gastos": Number(c.total_gastos || 0),
        "Devoluciones": Number(c.total_devoluciones || 0),
        "Resultado Final": Number(c.total_resultado || 0)
      };
    });

    const ws = XLSX.utils.json_to_sheet(datosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historial_Cajas");
    XLSX.writeFile(wb, `Historial_Cajas_${new Date().toLocaleDateString("es-AR").replace(/\//g,'-')}.xlsx`);
  };

  return (
    <div className="app-modal" style={{ display: 'flex' }}>
      <div className="app-modal-content">
        <div className="app-modal-header">
          <h2 className="app-subtitle">Historial de Cajas</h2>
          <button onClick={onClose} className="app-close">Cerrar</button>
        </div>

        <div className="app-controls" style={{ marginBottom: '15px', justifyContent: 'flex-end', display: 'flex' }}>
          <button onClick={exportarExcel} className="app-btn-primary" style={{ backgroundColor: '#217346', color: 'white', borderColor: '#1e6b40' }}>
            📥 Descargar Excel
          </button>
        </div>

        <div className="app-tabla-container">
          <table className="app-tabla" id="tablaHistorialCajas" style={{ fontSize: '0.9em' }}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Sal. Inicial</th>
                <th>Ventas</th>
                <th>Cuenta Corri.</th>
                <th>Gastos</th>
                <th>Devol.</th>
                <th>Resultado Final</th>
              </tr>
            </thead>
            <tbody>
              {(historial || []).map((c, i) => {
                const fechaLocalArray = c.fecha ? c.fecha.split("T")[0].split("-") : null;
                const dateAperturaStr = fechaLocalArray ? `${fechaLocalArray[2]}/${fechaLocalArray[1]}/${fechaLocalArray[0]}` : "";
                const fechaCierre = c.hora_cierre ? new Date(c.hora_cierre).toLocaleDateString("es-AR") : `Sin Cerrar (${dateAperturaStr})`;
                return (
                  <tr key={i}>
                    <td>{fechaCierre}</td>
                    <td>{c.estado.toUpperCase()}</td>
                    <td>${Number(c.saldo_inicial).toFixed(2)}</td>
                    <td>${Number(c.total_ventas || 0).toFixed(2)}</td>
                    <td>${Number(c.total_cuenta_corriente || 0).toFixed(2)}</td>
                    <td>${Number(c.total_gastos || 0).toFixed(2)}</td>
                    <td>${Number(c.total_devoluciones || 0).toFixed(2)}</td>
                    <td>${Number(c.total_resultado || 0).toFixed(2)}</td>
                  </tr>
                );
              })}
              {(!historial || historial.length === 0) && (
                <tr><td colSpan="8" style={{textAlign:'center', padding:'1rem'}}>No hay historial de cajas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

