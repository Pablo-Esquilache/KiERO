import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../shared/auth/AuthContext';
import { useProductos, useCrearProducto } from '../productos/useProductosApi';
import { useClientes, useCrearCliente } from '../clientes/useClientesApi';
import { useCajaStore } from '../../shared/store/useCajaStore';
import { useCajaHoy } from '../caja/useCajaApi';
import { useMetodosPago, useDescuentos, useVentas, useDevoluciones, useCrearVenta, useCrearDevolucion } from './useVentasApi';
import { Link, useNavigate } from 'react-router-dom';
import './Ventas.css';

export default function Ventas() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { cajaAbierta } = useCajaStore();
  useCajaHoy(); // Ensure caja status is fresh

  const { data: productos = [] } = useProductos();
  const { data: clientes = [] } = useClientes();
  const { data: metodosPagoData = [] } = useMetodosPago();
  const { data: descuentosData = [] } = useDescuentos();
  const { data: ventasHistorial = [] } = useVentas();
  const { data: devolucionesHistorial = [] } = useDevoluciones();

  const mutCrearVenta = useCrearVenta();
  const mutCrearDevolucion = useCrearDevolucion();
  const mutCrearCliente = useCrearCliente();

  // POS State
  const [vistaHistorial, setVistaHistorial] = useState(false);
  const [carrito, setCarrito] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [clienteInputText, setClienteInputText] = useState('');
  const [showClienteAutocomplete, setShowClienteAutocomplete] = useState(false);

  // Producto actual para agregar
  const [barcodeInput, setBarcodeInput] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [productoInputText, setProductoInputText] = useState('');
  const [showProductoAutocomplete, setShowProductoAutocomplete] = useState(false);
  const [cantidadInput, setCantidadInput] = useState(1);
  const [precioCustomInput, setPrecioCustomInput] = useState('');

  // Checkout State
  const [descuentoPorc, setDescuentoPorc] = useState(0);
  const [metodoPago, setMetodoPago] = useState('Efectivo');

  // Modales
  const [modalBuscarCliente, setModalBuscarCliente] = useState(false);
  const [modalBuscarProducto, setModalBuscarProducto] = useState(false);
  const [modalNuevoCliente, setModalNuevoCliente] = useState(false);
  const [modalTicketExito, setModalTicketExito] = useState(false);
  const [ticketData, setTicketData] = useState(null);

  // Modales de DevoluciÃ³n
  const [modalVerDevoluciones, setModalVerDevoluciones] = useState(false);
  const [modalCrearDevolucion, setModalCrearDevolucion] = useState(false);
  const [carritoDevolucion, setCarritoDevolucion] = useState([]);
  const [devolucionProdSeleccionado, setDevolucionProdSeleccionado] = useState(null);
  const [devolucionProdTexto, setDevolucionProdTexto] = useState('');
  const [devolucionCant, setDevolucionCant] = useState(1);
  const [devolucionMetodo, setDevolucionMetodo] = useState('Efectivo');

  // Filtros Historial Ventas
  const [filtroHistorialTexto, setFiltroHistorialTexto] = useState('');
  const [filtroHistorialFecha, setFiltroHistorialFecha] = useState(new Date().toLocaleDateString('sv-SE'));

  // Form Nuevo Cliente RÃ¡pido
  const [nuevoCliData, setNuevoCliData] = useState({ nombre: '', telefono: '', email: '', localidad: '' });

  const barcodeRef = useRef(null);

  // Seleccionar "Consumidor Final" por defecto
  useEffect(() => {
    if (!clienteSeleccionado && clientes.length > 0) {
      const cf = clientes.find(c => c.nombre && c.nombre.toLowerCase().includes('consumidor'));
      if (cf) {
        setClienteSeleccionado(cf);
        setClienteInputText(cf.nombre);
      } else {
        setClienteSeleccionado(clientes[0]);
        setClienteInputText(clientes[0].nombre);
      }
    }
  }, [clientes]);

  // Autofocus lector de cÃ³digo de barras
  useEffect(() => {
    if (cajaAbierta && !vistaHistorial) {
      barcodeRef.current?.focus();
    }
  }, [cajaAbierta, vistaHistorial]);

  // CÃ¡lculos del Carrito
  const subtotal = carrito.reduce((acc, item) => acc + item.subtotal, 0);
  const totalFinal = subtotal - (subtotal * descuentoPorc) / 100;

  // Manejo de Agregar Producto al Carrito
  const agregarAlCarrito = (prod, cant = 1, precioPersonalizado = null) => {
    if (!prod) return;
    const precio = precioPersonalizado !== null ? Number(precioPersonalizado) : Number(prod.precio);
    
    // Verificar si ya estÃ¡ en el carrito
    setCarrito(prev => {
      const idx = prev.findIndex(item => item.producto_id === prod.id && !prod.precio_abierto);
      if (idx !== -1) {
        const copy = [...prev];
        const newCant = copy[idx].cantidad + cant;
        copy[idx] = {
          ...copy[idx],
          cantidad: newCant,
          subtotal: newCant * copy[idx].precio_unitario
        };
        return copy;
      }
      return [...prev, {
        producto_id: prod.id,
        nombre: prod.nombre,
        precio_unitario: precio,
        cantidad: cant,
        subtotal: precio * cant,
        precio_abierto: !!prod.precio_abierto
      }];
    });

    // Reset inputs
    setProductoSeleccionado(null);
    setProductoInputText('');
    setBarcodeInput('');
    setCantidadInput(1);
    setPrecioCustomInput('');
    barcodeRef.current?.focus();
  };

  // Manejo de lector / Barcode enter
  const handleBarcodeSubmit = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = barcodeInput.trim();
      if (!code) return;
      
      const found = productos.find(p => p.codigo_barras && p.codigo_barras.trim() === code);
      if (found) {
        if (found.precio_abierto) {
          setProductoSeleccionado(found);
          setProductoInputText(found.nombre);
          document.getElementById('precioCustomVenta')?.focus();
        } else {
          agregarAlCarrito(found, 1);
        }
      } else {
        alert('Producto no encontrado con el cÃ³digo: ' + code);
      }
      setBarcodeInput('');
    }
  };

  // Cobrar Venta
  const handleCobrarVenta = async (e) => {
    e.preventDefault();
    if (carrito.length === 0) {
      alert('Debe agregar al menos un producto al carrito.');
      return;
    }
    if (!clienteSeleccionado) {
      alert('Debe seleccionar un cliente.');
      return;
    }

    const payload = {
      cliente_id: clienteSeleccionado.id,
      metodo_pago: metodoPago,
      descuento_porcentaje: Number(descuentoPorc),
      comercio_id: session.comercio_id,
      items: carrito.map(i => ({
        producto_id: i.producto_id,
        cantidad: i.cantidad,
        precio_unitario: i.precio_unitario,
        producto_nombre: i.nombre
      }))
    };

    try {
      const res = await mutCrearVenta.mutateAsync(payload);
      setTicketData({
        cliente: clienteSeleccionado.nombre,
        metodo_pago: metodoPago,
        subtotal,
        descuento: descuentoPorc,
        total: totalFinal,
        items: [...carrito]
      });
      setModalTicketExito(true);
      setCarrito([]);
      setDescuentoPorc(0);
      setMetodoPago('Efectivo');
    } catch (err) {
      alert('Error al cobrar venta: ' + err.message);
    }
  };

  // Si la caja estÃ¡ cerrada, mostrar aviso obligatorio
  if (!cajaAbierta) {
    return (
      <main className="app-container">
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', maxWidth: '500px', margin: '40px auto' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '15px' }}>ðŸ”’ Caja Cerrada</h2>
          <p style={{ color: '#64748b', marginBottom: '25px', fontSize: '1.1em' }}>Debes abrir la caja para poder operar en el Punto de Venta.</p>
          <Link to="/caja" className="app-btn-primary" style={{ textDecoration: 'none', padding: '12px 25px', display: 'inline-block' }}>
            Ir a Abrir Caja
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="app-container">
      {/* VISTA POS */}
      {!vistaHistorial && (`n        <>`n          <div className="pos-header"><h1 className="app-title">Punto de Venta</h1></div>
        <div id="pos-container" className="pos-layout">
          <form className="app-form-venta" onSubmit={handleCobrarVenta}>
            
            {/* LEFT COLUMN (20%) */}
            <div className="pos-left">
              <div className="pos-info-box">
                <label>Fecha de hoy</label>
                <input type="text" className="app-input" value={new Date().toLocaleDateString('es-AR')} readOnly />
                <button type="button" onClick={() => setVistaHistorial(true)} className="app-btn-secondary" style={{ width: '100%', marginTop: '15px' }}>
                  Historial de Ventas
                </button>
              </div>

              <div className="pos-info-box">
                <label>Cliente</label>
                <div style={{ position: 'relative', width: '100%', marginBottom: '10px' }}>
                  <input
                    type="text"
                    className="app-input"
                    style={{ width: '100%' }}
                    placeholder="Buscar cliente..."
                    value={clienteInputText}
                    onChange={(e) => {
                      setClienteInputText(e.target.value);
                      setShowClienteAutocomplete(true);
                    }}
                    onFocus={() => setShowClienteAutocomplete(true)}
                  />
                  {showClienteAutocomplete && (
                    <ul className="app-autocomplete-list" style={{ display: 'block' }}>
                      {clientes
                        .filter(c => c.nombre.toLowerCase().includes(clienteInputText.toLowerCase()))
                        .slice(0, 8)
                        .map(c => (
                          <li key={c.id} onClick={() => {
                            setClienteSeleccionado(c);
                            setClienteInputText(c.nombre);
                            setShowClienteAutocomplete(false);
                          }}>
                            {c.nombre} {c.telefono ? `(${c.telefono})` : ''}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => setModalBuscarCliente(true)} className="app-btn-secondary" style={{ flex: 1, padding: '10px' }}>
                    ðŸ” Buscar
                  </button>
                  <button type="button" onClick={() => setModalNuevoCliente(true)} className="app-btn-primary" style={{ flex: 1, padding: '10px', margin: 0 }}>
                    + Nuevo
                  </button>
                </div>
              </div>

              {/* BOTONES DEVOLUCION AL PISO */}
              <div className="pos-info-box" style={{ marginTop: 'auto', border: '1px dashed #f59e0b', background: '#fffbeb', padding: '10px' }}>
                <div style={{ display: 'flex', gap: '8px', flexDirection: 'row' }}>
                  <button type="button" onClick={() => setModalVerDevoluciones(true)} className="app-btn-secondary" style={{ flex: 1, padding: '10px', color: '#b45309', borderColor: '#fcd34d', fontSize: '0.9em' }}>
                    Historial DevoluciÃ³n
                  </button>
                  <button type="button" onClick={() => setModalCrearDevolucion(true)} className="app-btn-primary" style={{ flex: 1, padding: '10px', backgroundColor: '#f59e0b', border: 'none', fontWeight: 'bold', fontSize: '0.9em' }}>
                    Generar DevoluciÃ³n
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (80%) */}
            <div className="pos-right">
              {/* TOP: Product Search */}
              <div className="pos-right-top">
                <input
                  type="text"
                  ref={barcodeRef}
                  className="app-input"
                  placeholder="ðŸ” Escanear con pistola..."
                  value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeSubmit}
                  style={{ flex: 3, borderColor: '#3fd18c', height: '38px' }}
                />

                <div style={{ position: 'relative', flex: 2, minWidth: '200px' }}>
                  <input
                    type="text"
                    className="app-input"
                    style={{ width: '100%', height: '38px' }}
                    placeholder="Buscar producto..."
                    value={productoInputText}
                    onChange={(e) => {
                      setProductoInputText(e.target.value);
                      setShowProductoAutocomplete(true);
                    }}
                    onFocus={() => setShowProductoAutocomplete(true)}
                  />
                  {showProductoAutocomplete && (
                    <ul className="app-autocomplete-list" style={{ display: 'block', width: '100%' }}>
                      {productos
                        .filter(p => p.nombre.toLowerCase().includes(productoInputText.toLowerCase()) || (p.codigo_barras && p.codigo_barras.includes(productoInputText)))
                        .slice(0, 10)
                        .map(p => (
                          <li key={p.id} onClick={() => {
                            setProductoSeleccionado(p);
                            setProductoInputText(p.nombre);
                            setShowProductoAutocomplete(false);
                            if (p.precio_abierto) {
                              document.getElementById('precioCustomVenta')?.focus();
                            }
                          }}>
                            {p.nombre} - ${Number(p.precio).toLocaleString('es-AR')} {p.precio_abierto ? '(Precio Abierto)' : ''}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>

                <button type="button" onClick={() => setModalBuscarProducto(true)} className="app-btn-secondary" style={{ padding: '0 15px' }} title="BÃºsqueda Avanzada">
                  ðŸ”
                </button>

                <input
                  type="number"
                  min="1"
                  className="app-input"
                  placeholder="Cant."
                  value={cantidadInput}
                  onChange={e => setCantidadInput(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{ flex: 0.5, maxWidth: '80px', textAlign: 'center' }}
                />

                {productoSeleccionado?.precio_abierto && (
                  <input
                    type="number"
                    step="0.01"
                    id="precioCustomVenta"
                    className="app-input"
                    placeholder="Precio $"
                    value={precioCustomInput}
                    onChange={e => setPrecioCustomInput(e.target.value)}
                    style={{ flex: 0.5, maxWidth: '90px', textAlign: 'center', borderColor: '#f59e0b' }}
                    required
                  />
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (productoSeleccionado) {
                      agregarAlCarrito(productoSeleccionado, cantidadInput, productoSeleccionado.precio_abierto ? precioCustomInput : null);
                    }
                  }}
                  className="app-btn-secondary"
                  style={{ padding: '0 10px' }}
                >
                  Agregar
                </button>
              </div>

              {/* MIDDLE: Cart Table */}
              <div className="app-carrito-container pos-right-middle">
                <table className="app-tabla">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th style={{ width: '80px' }}>Cant.</th>
                      <th style={{ width: '120px' }}>Precio</th>
                      <th style={{ width: '120px' }}>Subtotal</th>
                      <th style={{ width: '50px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {carrito.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.nombre}</td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={(e) => {
                              const n = Math.max(1, parseInt(e.target.value) || 1);
                              setCarrito(prev => {
                                const copy = [...prev];
                                copy[idx] = { ...copy[idx], cantidad: n, subtotal: n * copy[idx].precio_unitario };
                                return copy;
                              });
                            }}
                            className="app-input"
                            style={{ width: '60px', padding: '4px', textAlign: 'center' }}
                          />
                        </td>
                        <td>${Number(item.precio_unitario).toFixed(2)}</td>
                        <td>${Number(item.subtotal).toFixed(2)}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => setCarrito(prev => prev.filter((_, i) => i !== idx))}
                            className="app-btn-danger"
                            style={{ padding: '2px 8px' }}
                          >
                            Ã—
                          </button>
                        </td>
                      </tr>
                    ))}
                    {carrito.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                          El carrito estÃ¡ vacÃ­o. Escanee un producto o bÃºsquelo arriba.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* BOTTOM: Totals Grid */}
              <div className="pos-right-bottom">
                <div className="pos-totals-grid">
                  <div className="pos-tot-col">
                    <label>Subtotal</label>
                    <div className="pos-val">${subtotal.toFixed(2)}</div>
                  </div>
                  <div className="pos-tot-col">
                    <label>Descuento</label>
                    <select
                      className="app-input"
                      value={descuentoPorc}
                      onChange={e => setDescuentoPorc(Number(e.target.value))}
                    >
                      <option value="0">0%</option>
                      {descuentosData.filter(d => d.activo && Number(d.porcentaje) > 0).map(d => (
                        <option key={d.id} value={d.porcentaje}>{Number(d.porcentaje)}%</option>
                      ))}
                    </select>
                  </div>
                  <div className="pos-tot-col">
                    <label>MÃ©todo de pago</label>
                    <select
                      className="app-input"
                      value={metodoPago}
                      onChange={e => setMetodoPago(e.target.value)}
                      required
                    >
                      <option value="Efectivo">Efectivo</option>
                      {metodosPagoData.filter(m => m.activo && m.nombre !== 'Efectivo').map(m => (
                        <option key={m.id} value={m.nombre}>{m.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="pos-tot-col pos-final">
                    <label>Total Final</label>
                    <div className="pos-val-final">${totalFinal.toFixed(2)}</div>
                  </div>
                </div>
                <button type="submit" className="app-btn-primary app-btn-guardar" disabled={mutCrearVenta.isPending || carrito.length === 0}>
                  {mutCrearVenta.isPending ? 'Cobrando...' : 'COBRAR VENTA'}
                </button>
              </div>

            </div>
          </form>
        </div>
      </>`n      )}`n`n      {/* VISTA HISTORIAL VENTAS */}
      {vistaHistorial && (
        <div id="history-container">
          <div className="app-controls" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <button onClick={() => setVistaHistorial(false)} className="app-btn-secondary">
              â† Volver al Punto de Venta
            </button>
            <input
              type="text"
              placeholder="Buscar por ID o cliente..."
              value={filtroHistorialTexto}
              onChange={e => setFiltroHistorialTexto(e.target.value)}
              className="app-input"
              style={{ flex: 1, marginBottom: 0 }}
            />
            <input
              type="date"
              value={filtroHistorialFecha}
              onChange={e => setFiltroHistorialFecha(e.target.value)}
              className="app-input"
              style={{ width: 'auto', marginBottom: 0 }}
            />
          </div>

          <div className="app-tabla-container" style={{ marginTop: '20px' }}>
            <table className="app-tabla">
              <thead>
                <tr>
                  <th>NÂ° Venta</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>MÃ©todo Pago</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {ventasHistorial
                  .filter(v => {
                    const matchText = String(v.id).includes(filtroHistorialTexto) || (v.cliente_nombre && v.cliente_nombre.toLowerCase().includes(filtroHistorialTexto.toLowerCase()));
                    const matchDate = filtroHistorialFecha ? (v.fecha && v.fecha.startsWith(filtroHistorialFecha)) : true;
                    return matchText && matchDate;
                  })
                  .map(v => (
                    <tr key={v.id}>
                      <td>#{v.id}</td>
                      <td>{v.fecha ? new Date(v.fecha).toLocaleString('es-AR') : '-'}</td>
                      <td>{v.cliente_nombre || 'Consumidor Final'}</td>
                      <td>{v.metodo_pago}</td>
                      <td><strong>${Number(v.total).toFixed(2)}</strong></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL TICKET EXITOSO */}
      {modalTicketExito && ticketData && (
        <div className="app-modal" style={{ display: 'flex', zIndex: 12000 }}>
          <div className="app-modal-content" style={{ maxWidth: '400px', padding: 0 }}>
            <div style={{ padding: '15px', borderBottom: '1px dashed #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: '8px 8px 0 0' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#10b981' }}>Â¡Venta Exitosa!</h2>
              <button
                type="button"
                onClick={() => {
                  const ventana = window.open('', '_blank', 'width=300,height=500');
                  ventana.document.write('<html><head><title>Ticket de Venta</title></head><body style="font-family: monospace;">');
                  ventana.document.write(document.getElementById('ticketExitoContenido')?.innerHTML || '');
                  ventana.document.write('</body></html>');
                  ventana.document.close();
                  ventana.print();
                }}
                className="app-btn-secondary"
                style={{ padding: '5px 10px', fontSize: '0.9em' }}
              >
                ðŸ–¨ï¸ Imprimir
              </button>
            </div>

            <div id="ticketExitoContenido" style={{ padding: '20px', maxHeight: '50vh', overflowY: 'auto', fontFamily: 'monospace', fontSize: '14px' }}>
              <div style={{ marginBottom: '5px' }}><strong>Cliente:</strong> {ticketData.cliente}</div>
              <div style={{ marginBottom: '5px' }}><strong>MÃ©todo de pago:</strong> {ticketData.metodo_pago}</div>
              <div style={{ borderTop: '1px dashed #ccc', margin: '10px 0' }}></div>
              {ticketData.items.map((it, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>{it.cantidad}x {it.nombre}</span>
                  <span>${Number(it.subtotal).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px dashed #ccc', margin: '10px 0' }}></div>
              <div style={{ textAlign: 'right' }}>Subtotal: ${Number(ticketData.subtotal).toFixed(2)}</div>
              {ticketData.descuento > 0 && <div style={{ textAlign: 'right' }}>Descuento: {ticketData.descuento}%</div>}
              <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.2em', marginTop: '5px' }}>
                Total: ${Number(ticketData.total).toFixed(2)}
              </div>
            </div>

            <div style={{ padding: '15px', textAlign: 'center', borderTop: '1px dashed #ccc', background: '#f8fafc', borderRadius: '0 0 8px 8px' }}>
              <button type="button" onClick={() => setModalTicketExito(false)} className="app-btn-primary" style={{ width: '100%', padding: '12px', fontSize: '1.1em' }}>
                Aceptar y Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BUSCAR PRODUCTO */}
      {modalBuscarProducto && (
        <div className="app-modal" style={{ display: 'flex', zIndex: 10000 }}>
          <div className="app-modal-content" style={{ maxWidth: '800px' }}>
            <div className="app-modal-header">
              <h2 className="app-subtitle">Buscar Producto</h2>
              <button onClick={() => setModalBuscarProducto(false)} className="app-close">Cerrar</button>
            </div>
            <div className="app-tabla-container" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <table className="app-tabla">
                <thead>
                  <tr><th>CÃ³d.</th><th>Nombre</th><th>Precio</th><th>Stock</th><th></th></tr>
                </thead>
                <tbody>
                  {productos.map(p => (
                    <tr key={p.id}>
                      <td>{p.codigo_barras || '-'}</td>
                      <td>{p.nombre}</td>
                      <td>${Number(p.precio).toFixed(2)}</td>
                      <td>{p.stock}</td>
                      <td>
                        <button
                          onClick={() => {
                            setProductoSeleccionado(p);
                            setProductoInputText(p.nombre);
                            setModalBuscarProducto(false);
                            if (p.precio_abierto) {
                              document.getElementById('precioCustomVenta')?.focus();
                            } else {
                              agregarAlCarrito(p, 1);
                            }
                          }}
                          className="app-btn-primary"
                          style={{ padding: '4px 8px' }}
                        >
                          Seleccionar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BUSCAR CLIENTE */}
      {modalBuscarCliente && (
        <div className="app-modal" style={{ display: 'flex', zIndex: 10000 }}>
          <div className="app-modal-content" style={{ maxWidth: '700px' }}>
            <div className="app-modal-header">
              <h2 className="app-subtitle">Buscar Cliente</h2>
              <button onClick={() => setModalBuscarCliente(false)} className="app-close">Cerrar</button>
            </div>
            <div className="app-tabla-container" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <table className="app-tabla">
                <thead>
                  <tr><th>Nombre</th><th>TelÃ©fono</th><th>Localidad</th><th></th></tr>
                </thead>
                <tbody>
                  {clientes.map(c => (
                    <tr key={c.id}>
                      <td>{c.nombre}</td>
                      <td>{c.telefono || '-'}</td>
                      <td>{c.localidad || '-'}</td>
                      <td>
                        <button
                          onClick={() => {
                            setClienteSeleccionado(c);
                            setClienteInputText(c.nombre);
                            setModalBuscarCliente(false);
                          }}
                          className="app-btn-primary"
                          style={{ padding: '4px 8px' }}
                        >
                          Seleccionar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR CLIENTE RAPIDO */}
      {modalNuevoCliente && (
        <div className="app-modal" style={{ display: 'flex', zIndex: 11000 }}>
          <div className="app-modal-content" style={{ maxWidth: '500px' }}>
            <div className="app-modal-header">
              <h2 className="app-subtitle">Nuevo Cliente RÃ¡pido</h2>
              <button onClick={() => setModalNuevoCliente(false)} className="app-close">Cerrar</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await mutCrearCliente.mutateAsync(nuevoCliData);
                setClienteSeleccionado(res);
                setClienteInputText(res.nombre);
                setModalNuevoCliente(false);
                setNuevoCliData({ nombre: '', telefono: '', email: '', localidad: '' });
              } catch (err) {
                alert('Error al crear cliente: ' + err.message);
              }
            }} className="app-form">
              <div className="app-form-group">
                <label>Nombre *</label>
                <input required type="text" className="app-input" value={nuevoCliData.nombre} onChange={e => setNuevoCliData({...nuevoCliData, nombre: e.target.value})} />
              </div>
              <div className="app-form-group">
                <label>TelÃ©fono</label>
                <input type="text" className="app-input" value={nuevoCliData.telefono} onChange={e => setNuevoCliData({...nuevoCliData, telefono: e.target.value})} />
              </div>
              <div className="app-form-group">
                <label>Localidad</label>
                <input type="text" className="app-input" value={nuevoCliData.localidad} onChange={e => setNuevoCliData({...nuevoCliData, localidad: e.target.value})} />
              </div>
              <button type="submit" className="app-btn-primary app-btn-guardar" disabled={mutCrearCliente.isPending}>
                Guardar Cliente
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HISTORIAL DEVOLUCIONES */}
      {modalVerDevoluciones && (
        <div className="app-modal" style={{ display: 'flex', zIndex: 10000 }}>
          <div className="app-modal-content" style={{ maxWidth: '800px' }}>
            <div className="app-modal-header">
              <h2 className="app-subtitle">Historial de Devoluciones</h2>
              <button onClick={() => setModalVerDevoluciones(false)} className="app-close">Cerrar</button>
            </div>
            <div className="app-tabla-container" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <table className="app-tabla">
                <thead>
                  <tr><th>Fecha</th><th>Cliente</th><th>Total</th><th>Motivo</th></tr>
                </thead>
                <tbody>
                  {devolucionesHistorial.map(d => (
                    <tr key={d.id}>
                      <td>{d.fecha ? new Date(d.fecha).toLocaleString('es-AR') : '-'}</td>
                      <td>{d.cliente_nombre || 'Consumidor Final'}</td>
                      <td>${Number(d.total).toFixed(2)}</td>
                      <td>{d.motivo || '-'}</td>
                    </tr>
                  ))}
                  {devolucionesHistorial.length === 0 && (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '1rem' }}>No hay devoluciones registradas</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GENERAR DEVOLUCION */}
      {modalCrearDevolucion && (
        <div className="app-modal" style={{ display: 'flex', zIndex: 10000 }}>
          <div className="app-modal-content" style={{ maxWidth: '750px' }}>
            <div className="app-modal-header">
              <h2 className="app-subtitle">Generar DevoluciÃ³n</h2>
              <button onClick={() => setModalCrearDevolucion(false)} className="app-close">Cerrar</button>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <select
                className="app-input"
                style={{ flex: 2 }}
                onChange={e => {
                  const p = productos.find(x => x.id === parseInt(e.target.value));
                  setDevolucionProdSeleccionado(p || null);
                }}
              >
                <option value="">Seleccionar producto a devolver...</option>
                {productos.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} (${Number(p.precio).toFixed(2)})</option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                className="app-input"
                value={devolucionCant}
                onChange={e => setDevolucionCant(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ width: '80px', textAlign: 'center' }}
              />
              <button
                type="button"
                onClick={() => {
                  if (!devolucionProdSeleccionado) return;
                  setCarritoDevolucion(prev => [...prev, {
                    producto_id: devolucionProdSeleccionado.id,
                    nombre: devolucionProdSeleccionado.nombre,
                    precio_unitario: Number(devolucionProdSeleccionado.precio),
                    cantidad: devolucionCant,
                    subtotal: Number(devolucionProdSeleccionado.precio) * devolucionCant
                  }]);
                  setDevolucionCant(1);
                }}
                className="app-btn-secondary"
              >
                Agregar
              </button>
            </div>

            <div className="app-tabla-container" style={{ maxHeight: '30vh', overflowY: 'auto', marginBottom: '15px' }}>
              <table className="app-tabla">
                <thead>
                  <tr><th>Producto</th><th>Cant.</th><th>Subtotal</th><th></th></tr>
                </thead>
                <tbody>
                  {carritoDevolucion.map((it, idx) => (
                    <tr key={idx}>
                      <td>{it.nombre}</td>
                      <td>{it.cantidad}</td>
                      <td>${it.subtotal.toFixed(2)}</td>
                      <td>
                        <button onClick={() => setCarritoDevolucion(prev => prev.filter((_, i) => i !== idx))} className="app-btn-danger" style={{ padding: '2px 8px' }}>
                          Ã—
                        </button>
                      </td>
                    </tr>
                  ))}
                  {carritoDevolucion.length === 0 && (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '1rem' }}>No hay items seleccionados</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>Total a Devolver: </strong>
                ${carritoDevolucion.reduce((acc, x) => acc + x.subtotal, 0).toFixed(2)}
              </div>
              <button
                onClick={async () => {
                  if (carritoDevolucion.length === 0) return alert('Agregue productos a la devoluciÃ³n');
                  try {
                    await mutCrearDevolucion.mutateAsync({
                      cliente_id: clienteSeleccionado?.id || null,
                      metodo_pago: 'Efectivo',
                      comercio_id: session.comercio_id,
                      items: carritoDevolucion.map(i => ({
                        producto_id: i.producto_id,
                        cantidad: i.cantidad,
                        precio_unitario: i.precio_unitario,
                        producto_nombre: i.nombre
                      }))
                    });
                    alert('DevoluciÃ³n registrada con Ã©xito');
                    setCarritoDevolucion([]);
                    setModalCrearDevolucion(false);
                  } catch (e) {
                    alert('Error en devoluciÃ³n: ' + e.message);
                  }
                }}
                className="app-btn-primary"
                style={{ backgroundColor: '#f59e0b' }}
                disabled={carritoDevolucion.length === 0 || mutCrearDevolucion.isPending}
              >
                Confirmar DevoluciÃ³n
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}


