import React, { useState } from 'react';
import { useProductos, useCategorias, useCrearProducto, useActualizarProducto } from './useProductosApi';
import './Productos.css';

export default function Productos() {
  const { data: productos, isLoading, isError } = useProductos();
  const { data: categorias } = useCategorias(); // Array of strings
  
  const mutCrear = useCrearProducto();
  const mutActualizar = useActualizarProducto();

  const [filtro, setFiltro] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  
  // Estado del Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  
  // Formulario
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    nueva_categoria: '',
    codigo_barras: '',
    precio: '',
    stock: '',
    precio_abierto: false
  });

  if (isLoading) return <main className="app-container">Cargando productos...</main>;
  if (isError) return <main className="app-container" style={{color: 'red'}}>Error al cargar productos</main>;

  // Filtrado
  const filtrados = (productos || []).filter(p => {
    const matchNombre = p.nombre.toLowerCase().includes(filtro.toLowerCase()) || (p.codigo_barras && p.codigo_barras.includes(filtro));
    const matchCat = filtroCategoria ? p.categoria === filtroCategoria : true;
    return matchNombre && matchCat;
  });

  const abrirModalNuevo = () => {
    setModoEdicion(false);
    setProductoEditando(null);
    setFormData({ nombre: '', categoria: '', nueva_categoria: '', codigo_barras: '', precio: '', stock: '', precio_abierto: false });
    setModalAbierto(true);
  };

  const abrirModalEditar = (prod) => {
    setModoEdicion(true);
    setProductoEditando(prod);
    setFormData({
      nombre: prod.nombre,
      categoria: prod.categoria || '',
      nueva_categoria: '',
      codigo_barras: prod.codigo_barras || '',
      precio: prod.precio,
      stock: prod.stock,
      precio_abierto: prod.precio_abierto || false
    });
    setModalAbierto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const categoriaFinal = formData.categoria === 'NUEVA' ? formData.nueva_categoria.trim() : formData.categoria;

    const dataToSend = {
      ...formData,
      categoria: categoriaFinal,
      precio: parseFloat(formData.precio),
      stock: parseInt(formData.stock)
    };

    if (modoEdicion) {
      await mutActualizar.mutateAsync({ id: productoEditando.id, data: dataToSend });
    } else {
      await mutCrear.mutateAsync(dataToSend);
    }
    setModalAbierto(false);
  };

  return (
    <main className="app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="app-title">Gestión de Productos</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="app-btn-secondary">Importar Excel</button>
          <button onClick={abrirModalNuevo} className="app-btn-primary">Nuevo Producto</button>
        </div>
      </div>

      <div className="app-controls" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '15px', alignItems: 'center', justifyContent: 'flex-start' }}>
        <input 
          type="text" 
          placeholder="Buscar producto..." 
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="app-input"
          style={{ marginBottom: 0 }}
        />
        
        <select 
          className="app-input" 
          value={filtroCategoria} 
          onChange={(e) => setFiltroCategoria(e.target.value)}
          style={{ marginBottom: 0 }}
        >
          <option value="">Todas las categorías</option>
          {(categorias || []).map((cat, i) => (
            <option key={i} value={cat}>{cat}</option>
          ))}
        </select>
        
        <button className="app-btn-secondary" onClick={() => {setFiltro(''); setFiltroCategoria('');}} style={{ marginBottom: 0 }}>
          Limpiar filtros
        </button>
      </div>

      <div className="app-tabla-container">
        <table className="app-tabla">
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
                <td>
                  <span className={`app-badge ${p.stock <= (p.umbral_stock || 3) ? 'app-badge-danger' : 'app-badge-success'}`}>
                    {p.stock}
                  </span>
                </td>
                <td>
                  <button onClick={() => abrirModalEditar(p)} className="app-btn-secondary">Editar</button>
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

      {/* MODAL PRODUCTO */}
      {modalAbierto && (
        <div className="app-modal" style={{ display: 'flex' }}>
          <div className="app-modal-content">
            <div className="app-modal-header">
              <h2 className="app-subtitle">{modoEdicion ? 'Editar Producto' : 'Nuevo Producto'}</h2>
              <button onClick={() => setModalAbierto(false)} className="app-close">Cerrar</button>
            </div>
            
            <form onSubmit={handleSubmit} className="app-form">
              <div className="app-form-group">
                <label>Nombre</label>
                <input required type="text" className="app-input" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
              </div>
              <div className="app-form-group">
                <label>Código de Barras</label>
                <input type="text" className="app-input" value={formData.codigo_barras} onChange={e => setFormData({...formData, codigo_barras: e.target.value})} />
              </div>
              <div className="app-form-group">
                <label>Categoría</label>
                <select className="app-input" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})}>
                  <option value="">Sin categoría</option>
                  {(categorias || []).map((cat, i) => (
                    <option key={i} value={cat}>{cat}</option>
                  ))}
                  <option value="NUEVA">+ Nueva Categoría...</option>
                </select>
                {formData.categoria === 'NUEVA' && (
                  <input 
                    type="text" 
                    className="app-input" 
                    placeholder="Escribí la nueva categoría" 
                    value={formData.nueva_categoria} 
                    onChange={e => setFormData({...formData, nueva_categoria: e.target.value})} 
                    style={{ marginTop: '10px' }}
                    required 
                  />
                )}
              </div>
              <div className="app-form-group">
                <label>Precio</label>
                <input required type="number" step="0.01" className="app-input" value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})} />
              </div>
              <div className="app-form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" id="precio_abierto" checked={formData.precio_abierto} onChange={e => setFormData({...formData, precio_abierto: e.target.checked})} />
                <label htmlFor="precio_abierto" style={{ margin: 0 }}>Precio Abierto (se define en la venta)</label>
              </div>
              <div className="app-form-group">
                <label>Stock</label>
                <input required type="number" className="app-input" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
              </div>
              <button type="submit" className="app-btn-primary app-btn-guardar" disabled={mutCrear.isPending || mutActualizar.isPending}>
                {modoEdicion ? 'Guardar Cambios' : 'Crear Producto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

