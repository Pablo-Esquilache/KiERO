import React, { useState } from 'react';
import { useProductos } from './useProductosApi';
import styles from './Productos.module.css';

export default function Productos() {
  const { data: productos, isLoading, isError } = useProductos();
  const [filtro, setFiltro] = useState('');

  if (isLoading) return <div className="card">Cargando productos...</div>;
  if (isError) return <div className="card" style={{color: 'red'}}>Error al cargar productos</div>;

  const filtrados = (productos || []).filter(p => 
    p.nombre.toLowerCase().includes(filtro.toLowerCase()) || 
    (p.codigo_barras && p.codigo_barras.includes(filtro))
  );

  return (
    <div className={styles['productos-container']}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="section-title">Productos (Modo solo lectura - Fase 3 Inicial)</h2>
          <button className="app-btn-primary">NUEVO PRODUCTO</button>
        </div>
        
        <input 
          type="text" 
          placeholder="Buscar producto por nombre o código..." 
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="app-input"
          style={{ width: '100%', marginBottom: '1rem' }}
        />

        <div className="table-responsive">
          <table className="app-table">
            <thead>
              <tr>
                <th>Cód. Barras</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(p => (
                <tr key={p.id}>
                  <td>{p.codigo_barras || '-'}</td>
                  <td>{p.nombre} {p.precio_abierto ? '(Precio Abierto)' : ''}</td>
                  <td>{p.categoria || 'Sin Categoría'}</td>
                  <td>${Number(p.precio).toLocaleString('es-AR')}</td>
                  <td>{p.stock}</td>
                  <td>
                    <button className="app-btn-secondary">Editar</button>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center', padding: '1rem'}}>No hay productos encontrados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
