import React, { useState } from 'react';
import { useGastos, useCategoriasGastos, useCrearGasto, useActualizarGasto, useEliminarGasto } from './useGastosApi';
import styles from './Gastos.module.css';

function formatFecha(fechaISO) {
  if (!fechaISO) return "-";
  const soloFecha = fechaISO.substring(0, 10);
  const [y, m, d] = soloFecha.split("-");
  return `${d}/${m}/${y}`;
}

export default function Gastos() {
  const { data: gastos, isLoading, isError } = useGastos();
  const { data: categoriasData } = useCategoriasGastos();
  
  const mutCrear = useCrearGasto();
  const mutActualizar = useActualizarGasto();
  const mutEliminar = useEliminarGasto();

  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');

  // Estado del Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [gastoEditando, setGastoEditando] = useState(null);

  // Formulario
  const [formData, setFormData] = useState({
    fecha: '',
    descripcion: '',
    tipo: '',
    importe: ''
  });

  if (isLoading) return <main className="app-container">Cargando gastos...</main>;
  if (isError) return <main className="app-container" style={{color: 'red'}}>Error al cargar gastos</main>;

  const categoriasActivas = (categoriasData || []).filter(c => c.activo);

  const filtrados = (gastos || []).filter(g => {
    const texto = filtroTexto.toLowerCase();
    const okTexto = g.descripcion.toLowerCase().includes(texto) || String(g.id).includes(texto);
    const okTipo = !filtroTipo || g.tipo === filtroTipo;
    const okFecha = (!filtroDesde || g.fecha >= filtroDesde) && (!filtroHasta || g.fecha <= filtroHasta);
    return okTexto && okTipo && okFecha;
  }).sort((a, b) => b.id - a.id);

  const limpiarFiltros = () => {
    setFiltroTexto('');
    setFiltroTipo('');
    setFiltroDesde('');
    setFiltroHasta('');
  };

  const abrirModalNuevo = () => {
    setModoEdicion(false);
    setGastoEditando(null);
    setFormData({ fecha: new Date().toISOString().split('T')[0], descripcion: '', tipo: '', importe: '' });
    setModalAbierto(true);
  };

  const abrirModalEditar = (g) => {
    setModoEdicion(true);
    setGastoEditando(g);
    setFormData({
      fecha: g.fecha ? g.fecha.substring(0, 10) : '',
      descripcion: g.descripcion,
      tipo: g.tipo,
      importe: g.importe
    });
    setModalAbierto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSend = {
      ...formData,
      importe: parseFloat(formData.importe)
    };

    if (modoEdicion) {
      await mutActualizar.mutateAsync({ id: gastoEditando.id, data: dataToSend });
    } else {
      await mutCrear.mutateAsync(dataToSend);
    }
    setModalAbierto(false);
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Eliminar gasto?')) {
      await mutEliminar.mutateAsync(id);
    }
  };

  return (
    <main className="app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="app-title">Gestión de Gastos</h1>
        <button onClick={abrirModalNuevo} className="app-btn-primary">Registrar Gasto</button>
      </div>

      <div className="app-controls" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '15px', alignItems: 'center', justifyContent: 'flex-start' }}>
        <input 
          type="text" 
          placeholder="Buscar descripción o n°..." 
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
          className="app-input"
          style={{ marginBottom: 0 }}
        />
        <select 
          className="app-input" 
          value={filtroTipo} 
          onChange={(e) => setFiltroTipo(e.target.value)}
          style={{ marginBottom: 0 }}
        >
          <option value="">Todos los tipos</option>
          {categoriasActivas.map(c => (
            <option key={c.id} value={c.nombre}>{c.nombre}</option>
          ))}
        </select>
        <input 
          type="date" 
          className="app-input" 
          value={filtroDesde} 
          onChange={e => setFiltroDesde(e.target.value)} 
          style={{ marginBottom: 0 }}
        />
        <input 
          type="date" 
          className="app-input" 
          value={filtroHasta} 
          onChange={e => setFiltroHasta(e.target.value)} 
          style={{ marginBottom: 0 }}
        />
        <button className="app-btn-secondary" onClick={limpiarFiltros} style={{ marginBottom: 0 }}>
          Limpiar filtros
        </button>
      </div>

      <div className="app-tabla-container">
        <table className="app-tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Descripción</th>
              <th>Tipo</th>
              <th>Importe</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map(g => (
              <tr key={g.id}>
                <td>{formatFecha(g.fecha)}</td>
                <td>{g.descripcion}</td>
                <td>{g.tipo}</td>
                <td>${parseFloat(g.importe).toLocaleString('es-AR')}</td>
                <td>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={() => abrirModalEditar(g)} className="app-btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Editar</button>
                    <button onClick={() => handleEliminar(g.id)} className="app-btn-danger" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan="5" style={{textAlign: 'center', padding: '1rem'}}>No hay gastos encontrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL GASTO */}
      {modalAbierto && (
        <div className="app-modal" style={{ display: 'flex', zIndex: 10000 }}>
          <div className="app-modal-content">
            <div className="app-modal-header">
              <h2 className="app-subtitle">{modoEdicion ? 'Editar Gasto' : 'Registrar Gasto'}</h2>
              <button onClick={() => setModalAbierto(false)} className="app-close">Cerrar</button>
            </div>
            
            <form onSubmit={handleSubmit} className="app-form">
              <div className="app-form-group">
                <label>Fecha</label>
                <input required type="date" className="app-input" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} />
              </div>
              <div className="app-form-group">
                <label>Descripción</label>
                <input required type="text" className="app-input" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} />
              </div>
              <div className="app-form-group">
                <label>Tipo</label>
                <select required className="app-input" value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                  <option value="">Seleccionar</option>
                  {categoriasActivas.map(c => (
                    <option key={c.id} value={c.nombre}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="app-form-group">
                <label>Importe</label>
                <input required type="number" step="0.01" className="app-input" value={formData.importe} onChange={e => setFormData({...formData, importe: e.target.value})} />
              </div>
              <button type="submit" className="app-btn-primary app-btn-guardar" disabled={mutCrear.isPending || mutActualizar.isPending}>
                {modoEdicion ? 'Guardar Cambios' : 'Registrar Gasto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
