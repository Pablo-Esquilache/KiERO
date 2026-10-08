import React, { useState } from 'react';
import { useClientes, useLocalidades, useCrearCliente, useActualizarCliente } from './useClientesApi';
import styles from './Clientes.module.css';

export default function Clientes() {
  const { data: clientes, isLoading, isError } = useClientes();
  const { data: localidades } = useLocalidades(); // Array of strings
  
  const mutCrear = useCrearCliente();
  const mutActualizar = useActualizarCliente();

  const [filtro, setFiltro] = useState('');
  const [filtroLocalidad, setFiltroLocalidad] = useState('');
  
  // Estado del Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  
  // Formulario
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    localidad: '',
    nueva_localidad: '',
    fecha_nacimiento: '',
    genero: '',
    comentarios: ''
  });

  if (isLoading) return <main className="app-container">Cargando clientes...</main>;
  if (isError) return <main className="app-container" style={{color: 'red'}}>Error al cargar clientes</main>;

  const filtrados = (clientes || []).filter(c => {
    const matchNombre = c.nombre.toLowerCase().includes(filtro.toLowerCase());
    const matchLoc = filtroLocalidad ? c.localidad === filtroLocalidad : true;
    return matchNombre && matchLoc;
  });

  const abrirModalNuevo = () => {
    setModoEdicion(false);
    setClienteEditando(null);
    setFormData({ nombre: '', telefono: '', email: '', localidad: '', nueva_localidad: '', fecha_nacimiento: '', genero: '', comentarios: '' });
    setModalAbierto(true);
  };

  const abrirModalEditar = (cli) => {
    setModoEdicion(true);
    setClienteEditando(cli);
    setFormData({
      nombre: cli.nombre,
      telefono: cli.telefono || '',
      email: cli.email || '',
      localidad: cli.localidad || '',
      nueva_localidad: '',
      fecha_nacimiento: cli.fecha_nacimiento ? cli.fecha_nacimiento.split('T')[0] : '',
      genero: cli.genero || '',
      comentarios: cli.comentarios || ''
    });
    setModalAbierto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const locFinal = formData.localidad === 'NUEVA' ? formData.nueva_localidad.trim() : formData.localidad;
    
    const dataToSend = { ...formData, localidad: locFinal };
    delete dataToSend.nueva_localidad;

    // Convertir campos vacíos a null
    Object.keys(dataToSend).forEach(k => {
      if (dataToSend[k] === '') dataToSend[k] = null;
    });

    if (modoEdicion) {
      await mutActualizar.mutateAsync({ id: clienteEditando.id, data: dataToSend });
    } else {
      await mutCrear.mutateAsync(dataToSend);
    }
    setModalAbierto(false);
  };

  return (
    <main className="app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="app-title">Gestión de Clientes</h1>
        <button onClick={abrirModalNuevo} className="app-btn-primary">Nuevo Cliente</button>
      </div>

      <div className="app-controls" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '15px', alignItems: 'center', justifyContent: 'flex-start' }}>
        <input 
          type="text" 
          placeholder="Buscar cliente por nombre..." 
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="app-input"
          style={{ marginBottom: 0 }}
        />
        
        <select 
          className="app-input" 
          value={filtroLocalidad} 
          onChange={(e) => setFiltroLocalidad(e.target.value)}
          style={{ marginBottom: 0 }}
        >
          <option value="">Todas las localidades</option>
          {(localidades || []).map((loc, i) => (
            <option key={i} value={loc}>{loc}</option>
          ))}
        </select>

        <button className="app-btn-secondary" onClick={() => {setFiltro(''); setFiltroLocalidad('');}} style={{ marginBottom: 0 }}>
          Limpiar filtros
        </button>
      </div>

      <div className="app-tabla-container">
        <table className="app-tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Localidad</th>
              <th>Saldo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map(c => (
              <tr key={c.id}>
                <td>{c.nombre}</td>
                <td>{c.telefono || '-'}</td>
                <td>{c.localidad || '-'}</td>
                <td>
                  <span className={`app-badge ${parseFloat(c.saldo) < 0 ? 'app-badge-danger' : 'app-badge-success'}`}>
                    ${Number(c.saldo || 0).toLocaleString('es-AR')}
                  </span>
                </td>
                <td>
                  <button onClick={() => abrirModalEditar(c)} className="app-btn-secondary">Editar</button>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan="5" style={{textAlign: 'center', padding: '1rem'}}>No hay clientes encontrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL CLIENTE */}
      {modalAbierto && (
        <div className="app-modal" style={{ display: 'flex', zIndex: 10000 }}>
          <div className="app-modal-content">
            <div className="app-modal-header">
              <h2 className="app-subtitle">{modoEdicion ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <button onClick={() => setModalAbierto(false)} className="app-close">Cerrar</button>
            </div>
            
            <form onSubmit={handleSubmit} className="app-form">
              <div className="app-form-group">
                <label>Nombre</label>
                <input required type="text" className="app-input" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="app-form-group" style={{ flex: 1 }}>
                  <label>Teléfono</label>
                  <input type="text" className="app-input" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                </div>
                <div className="app-form-group" style={{ flex: 1 }}>
                  <label>Localidad</label>
                  <select className="app-input" value={formData.localidad} onChange={e => setFormData({...formData, localidad: e.target.value})}>
                    <option value="">Seleccionar Localidad</option>
                    {(localidades || []).map((loc, i) => (
                      <option key={i} value={loc}>{loc}</option>
                    ))}
                    <option value="NUEVA">+ Nueva Localidad...</option>
                  </select>
                  {formData.localidad === 'NUEVA' && (
                    <input 
                      type="text" 
                      className="app-input" 
                      placeholder="Escribí la nueva localidad" 
                      value={formData.nueva_localidad} 
                      onChange={e => setFormData({...formData, nueva_localidad: e.target.value})} 
                      style={{ marginTop: '10px' }}
                      required 
                    />
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="app-form-group" style={{ flex: 1 }}>
                  <label>Fecha de Nacimiento</label>
                  <input type="date" className="app-input" value={formData.fecha_nacimiento} onChange={e => setFormData({...formData, fecha_nacimiento: e.target.value})} />
                </div>
                <div className="app-form-group" style={{ flex: 1 }}>
                  <label>Género</label>
                  <select className="app-input" value={formData.genero} onChange={e => setFormData({...formData, genero: e.target.value})}>
                    <option value="">Seleccionar</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>
              <div className="app-form-group">
                <label>Email</label>
                <input type="email" className="app-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="app-form-group">
                <label>Comentarios</label>
                <textarea className="app-input" rows="2" value={formData.comentarios} onChange={e => setFormData({...formData, comentarios: e.target.value})}></textarea>
              </div>
              <button type="submit" className="app-btn-primary app-btn-guardar" disabled={mutCrear.isPending || mutActualizar.isPending}>
                {modoEdicion ? 'Guardar Cambios' : 'Crear Cliente'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
