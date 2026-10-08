import React, { useState } from 'react';
import { useAuth } from '../../shared/auth/AuthContext';
import { useCajaHoy, useMovimientosCaja, useHistorialCajas, useAbrirCaja, useCerrarCaja } from './useCajaApi';
import { useCajaStore } from '../../shared/store/useCajaStore';
import { useNavigate } from 'react-router-dom';

export default function Caja() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { cajaAbierta, caja } = useCajaStore();

  const { isLoading: loadingHoy } = useCajaHoy(); // Llama a useQuery y actualiza Zustand
  const { data: rawMovimientos } = useMovimientosCaja();
  const { data: historial } = useHistorialCajas();
  
  const mutAbrir = useAbrirCaja();
  const mutCerrar = useCerrarCaja();

  const [saldoInicialInput, setSaldoInicialInput] = useState('');
  const [modalHistorial, setModalHistorial] = useState(false);

  if (loadingHoy) return <main className="app-container">Cargando caja...</main>;

  const movimientos = rawMovimientos?.movimientos || [];
  const t = rawMovimientos?.totales || { efectivo: 0, digital: 0, cuenta_corriente: 0, devoluciones: 0, egresos: 0 };

  // Cálculo de totales y saldo iterativo para la tabla
  const totalEgresosSumados = t.egresos + t.devoluciones;
  const saldoInicialVal = Number(caja?.saldo_inicial) || 0;
  const granTotal = t.efectivo + t.digital + t.cuenta_corriente - totalEgresosSumados;

  let saldoIterativo = saldoInicialVal;
  const movsInvertidos = [...movimientos].reverse();
  movsInvertidos.forEach(m => {
    if (m.tipo === "VENTA" && m.metodo_pago === "Cuenta Corriente") {
      // No suma al físico
    } else if (m.tipo === "DEVOLUCION" && m.metodo_pago === "Cuenta Corriente") {
      // No resta al físico
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
    // Redirigir a ventas después de abrir
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

  // VISTA: CAJA CERRADA
  if (!cajaAbierta) {
    return (
      <main className="app-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ background: '#fff', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
          <h2 style={{ fontSize: '2rem', color: '#1e293b', marginBottom: '10px' }}>Caja Cerrada</h2>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>Ingresá el saldo inicial para comenzar a operar.</p>
          <form onSubmit={handleAbrirCaja}>
            <input 
              type="number" 
              step="0.01" 
              className="app-input" 
              placeholder="$ 0.00" 
              value={saldoInicialInput} 
              onChange={e => setSaldoInicialInput(e.target.value)} 
              required
              style={{ fontSize: '1.5rem', textAlign: 'center', padding: '15px' }}
            />
            <button type="submit" className="app-btn-primary" style={{ width: '100%', marginTop: '15px', padding: '15px', fontSize: '1.2rem' }} disabled={mutAbrir.isPending}>
              {mutAbrir.isPending ? 'Abriendo...' : 'Abrir Caja'}
            </button>
          </form>
          <button onClick={() => setModalHistorial(true)} className="app-btn-secondary" style={{ width: '100%', marginTop: '10px' }}>Ver Historial</button>
        </div>

        {/* MODAL HISTORIAL (Reusable) */}
        {modalHistorial && <HistorialModal onClose={() => setModalHistorial(false)} historial={historial} />}
      </main>
    );
  }

  // VISTA: CAJA ABIERTA
  return (
    <main className="app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="app-title">Caja</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setModalHistorial(true)} className="app-btn-secondary">Historial</button>
          <button onClick={handleCerrarCaja} className="app-btn-danger" disabled={mutCerrar.isPending}>Cerrar Caja</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '30px' }}>
        <div className="card" style={{ flex: 1, minWidth: '150px', background: '#e0f2fe', borderColor: '#bae6fd' }}>
          <h4 style={{ margin: 0, color: '#0369a1' }}>Efectivo</h4>
          <h2 style={{ margin: '10px 0 0 0', color: '#0c4a6e' }}>${t.efectivo.toLocaleString('es-AR', {minimumFractionDigits:2})}</h2>
        </div>
        <div className="card" style={{ flex: 1, minWidth: '150px', background: '#fce7f3', borderColor: '#fbcfe8' }}>
          <h4 style={{ margin: 0, color: '#be185d' }}>Digitales</h4>
          <h2 style={{ margin: '10px 0 0 0', color: '#831843' }}>${t.digital.toLocaleString('es-AR', {minimumFractionDigits:2})}</h2>
        </div>
        <div className="card" style={{ flex: 1, minWidth: '150px', background: '#fef3c7', borderColor: '#fde68a' }}>
          <h4 style={{ margin: 0, color: '#b45309' }}>Cta. Corriente</h4>
          <h2 style={{ margin: '10px 0 0 0', color: '#78350f' }}>${t.cuenta_corriente.toLocaleString('es-AR', {minimumFractionDigits:2})}</h2>
        </div>
        <div className="card" style={{ flex: 1, minWidth: '150px', background: '#fee2e2', borderColor: '#fecaca' }}>
          <h4 style={{ margin: 0, color: '#b91c1c' }}>Gastos/Dev.</h4>
          <h2 style={{ margin: '10px 0 0 0', color: '#7f1d1d' }}>${totalEgresosSumados.toLocaleString('es-AR', {minimumFractionDigits:2})}</h2>
        </div>
        <div className="card" style={{ flex: 1, minWidth: '150px', background: '#dcfce7', borderColor: '#bbf7d0', borderLeft: '4px solid #22c55e' }}>
          <h4 style={{ margin: 0, color: '#15803d' }}>Total Neto</h4>
          <h2 style={{ margin: '10px 0 0 0', color: '#14532d' }}>${granTotal.toLocaleString('es-AR', {minimumFractionDigits:2})}</h2>
        </div>
      </div>

      <div className="app-tabla-container">
        <h3 style={{ padding: '15px', margin: 0, borderBottom: '1px solid #eee' }}>Movimientos del Día</h3>
        <table className="app-tabla">
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
            <tr style={{ background: '#f8fafc' }}>
              <td>APERTURA</td>
              <td>Saldo inicial de caja</td>
              <td>${saldoInicialVal.toLocaleString('es-AR', {minimumFractionDigits:2})}</td>
              <td>-</td>
              <td>${saldoInicialVal.toLocaleString('es-AR', {minimumFractionDigits:2})}</td>
            </tr>
            {movimientos.map((m, i) => (
              <tr key={i}>
                <td>{m.tipo}</td>
                <td>{m.descripcion}</td>
                <td style={{ color: m.ingreso > 0 ? '#10b981' : 'inherit' }}>{m.ingreso > 0 ? `$${m.ingreso.toLocaleString('es-AR', {minimumFractionDigits:2})}` : '-'}</td>
                <td style={{ color: m.egreso > 0 ? '#ef4444' : 'inherit' }}>{m.egreso > 0 ? `$${m.egreso.toLocaleString('es-AR', {minimumFractionDigits:2})}` : '-'}</td>
                <td><strong>${m.saldoVisual.toLocaleString('es-AR', {minimumFractionDigits:2})}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalHistorial && <HistorialModal onClose={() => setModalHistorial(false)} historial={historial} />}
    </main>
  );
}

function HistorialModal({ onClose, historial }) {
  return (
    <div className="app-modal" style={{ display: 'flex', zIndex: 10000 }}>
      <div className="app-modal-content" style={{ maxWidth: '900px' }}>
        <div className="app-modal-header">
          <h2 className="app-subtitle">Historial de Cajas</h2>
          <button onClick={onClose} className="app-close">Cerrar</button>
        </div>
        <div className="app-tabla-container" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <table className="app-tabla">
            <thead>
              <tr>
                <th>Fecha Cierre</th>
                <th>Estado</th>
                <th>S. Inicial</th>
                <th>Ventas</th>
                <th>Cta. Cte.</th>
                <th>Gastos/Dev.</th>
                <th>Resultado Final</th>
              </tr>
            </thead>
            <tbody>
              {(historial || []).map((c, i) => {
                const fechaLocalArray = c.fecha ? c.fecha.split("T")[0].split("-") : null;
                const dateAperturaStr = fechaLocalArray ? `${fechaLocalArray[2]}/${fechaLocalArray[1]}/${fechaLocalArray[0]}` : "";
                const fechaCierre = c.hora_cierre ? new Date(c.hora_cierre).toLocaleDateString("es-AR") : `Sin Cerrar (${dateAperturaStr})`;
                
                const egresosSumados = Number(c.total_gastos || 0) + Number(c.total_devoluciones || 0);

                return (
                  <tr key={i}>
                    <td>{fechaCierre}</td>
                    <td>{c.estado.toUpperCase()}</td>
                    <td>${Number(c.saldo_inicial).toLocaleString('es-AR')}</td>
                    <td>${Number(c.total_ventas || 0).toLocaleString('es-AR')}</td>
                    <td>${Number(c.total_cuenta_corriente || 0).toLocaleString('es-AR')}</td>
                    <td>${egresosSumados.toLocaleString('es-AR')}</td>
                    <td><strong>${Number(c.total_resultado || 0).toLocaleString('es-AR')}</strong></td>
                  </tr>
                );
              })}
              {(!historial || historial.length === 0) && (
                <tr><td colSpan="7" style={{textAlign:'center', padding:'1rem'}}>No hay historial</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
