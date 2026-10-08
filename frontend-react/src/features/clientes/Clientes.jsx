import React, { useState } from 'react';
import { useClientes } from './useClientesApi';
import styles from './Clientes.module.css';

export default function Clientes() {
  const { data: clientes, isLoading, isError } = useClientes();
  const [filtro, setFiltro] = useState('');

  if (isLoading) return <div className="card">Cargando clientes...</div>;
  if (isError) return <div className="card" style={{color: 'red'}}>Error al cargar clientes</div>;

  const filtrados = (clientes || []).filter(c => 
    c.nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className={styles['clientes-container']}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="section-title">Clientes (Modo solo lectura - Fase 3 Inicial)</h2>
          <button className="app-btn-primary">NUEVO CLIENTE</button>
        </div>
        
        <input 
          type="text" 
          placeholder="Buscar cliente por nombre..." 
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="app-input"
          style={{ width: '100%', marginBottom: '1rem' }}
        />

        <div className="table-responsive">
          <table className="app-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Localidad</th>
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
                    <button className="app-btn-secondary">Editar</button>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan="4" style={{textAlign: 'center', padding: '1rem'}}>No hay clientes encontrados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
