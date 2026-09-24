// api.js - Servicio Centralizado para Llamadas a la API

export const API_BASE_URL = "/api";

/**
 * Función base para realizar peticiones fetch
 * @param {string} endpoint - La ruta después de /api (ej: "/ventas")
 * @param {object} options - Opciones de fetch (method, body, headers, etc)
 * @returns {Promise<any>} Promesa con la respuesta en JSON
 */
export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const session = JSON.parse(localStorage.getItem("session"));

  const defaultHeaders = {
    "Content-Type": "application/json",
    "Authorization": session?.token ? `Bearer ${session.token}` : "",
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  if (config.body && typeof config.body !== "string") {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);

    if (response.status === 401) {
      localStorage.removeItem("session");
      window.location.href = "/index.html";
      return;
    }

    // Si la respuesta es NO-CONTENT (204) no intentar parsear JSON
    if (response.status === 204) {
      return null;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || data.message || `Error HTTP: ${response.status}`,
      );
    }

    return data;
  } catch (error) {
    console.error(`Error en apiFetch a ${endpoint}:`, error);
    throw error;
  }
}

// ==========================================
// SERVICIOS ESPECÍFICOS POR MÓDULO
// ==========================================

export const ComercioAPI = {
  getByUid: (uid) => apiFetch(`/comercios/uid/${uid}`),
};

export const VentasAPI = {
  getAll: (comercioId) => apiFetch(`/ventas?comercio_id=${comercioId}`),
  getDetalle: (ventaId) => apiFetch(`/ventas/${ventaId}/detalle`),
  create: async (data) => {
    const res = await apiFetch("/ventas", { method: "POST", body: data });
    const comercioId = JSON.parse(localStorage.getItem("session"))?.comercio_id;
    localStorage.removeItem(`productos_cache_${comercioId}`);
    localStorage.removeItem(`clientes_cache_${comercioId}`);
    return res;
  },
  update: async (id, data) => {
    const res = await apiFetch(`/ventas/${id}`, { method: "PUT", body: data });
    const comercioId = JSON.parse(localStorage.getItem("session"))?.comercio_id;
    localStorage.removeItem(`productos_cache_${comercioId}`);
    localStorage.removeItem(`clientes_cache_${comercioId}`);
    return res;
  },
  delete: async (id, comercioId) => {
    const res = await apiFetch(`/ventas/${id}?comercio_id=${comercioId}`, { method: "DELETE" });
    localStorage.removeItem(`productos_cache_${comercioId}`);
    localStorage.removeItem(`clientes_cache_${comercioId}`);
    return res;
  },
};

export const ClientesAPI = {
  getAll: async (comercioId) => {
    const cacheKey = `clientes_cache_${comercioId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 300000) return data;
    }
    const data = await apiFetch(`/clientes?comercio_id=${comercioId}`);
    localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
    return data;
  },
  create: async (data) => {
    const res = await apiFetch("/clientes", { method: "POST", body: data });
    localStorage.removeItem(`clientes_cache_${JSON.parse(localStorage.getItem("session"))?.comercio_id}`);
    return res;
  },
  update: async (id, data) => {
    const res = await apiFetch(`/clientes/${id}`, { method: "PUT", body: data });
    localStorage.removeItem(`clientes_cache_${JSON.parse(localStorage.getItem("session"))?.comercio_id}`);
    return res;
  },
  getLocalidades: (comercioId) =>
    apiFetch(`/clientes/localidades/lista?comercio_id=${comercioId}`),
  getSaldo: (id, comercioId) =>
    apiFetch(`/clientes/${id}/saldo?comercio_id=${comercioId}`),
  getCuentaCorriente: (id, comercioId) =>
    apiFetch(`/clientes/${id}/cuenta-corriente?comercio_id=${comercioId}`),
  registrarPago: async (id, data) => {
    const res = await apiFetch(`/clientes/${id}/pago`, { method: "POST", body: data });
    localStorage.removeItem(`clientes_cache_${JSON.parse(localStorage.getItem("session"))?.comercio_id}`);
    return res;
  },
};

export const ProductosAPI = {
  getAll: async (comercioId) => {
    const cacheKey = `productos_cache_${comercioId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 300000) return data;
    }
    const data = await apiFetch(`/productos?comercio_id=${comercioId}`);
    localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
    return data;
  },
  getCategorias: (comercioId) =>
    apiFetch(`/productos/categorias/lista?comercio_id=${comercioId}`),
  create: async (data) => {
    const res = await apiFetch("/productos", { method: "POST", body: data });
    localStorage.removeItem(`productos_cache_${JSON.parse(localStorage.getItem("session"))?.comercio_id}`);
    return res;
  },
  update: async (id, data) => {
    const res = await apiFetch(`/productos/${id}`, { method: "PUT", body: data });
    localStorage.removeItem(`productos_cache_${JSON.parse(localStorage.getItem("session"))?.comercio_id}`);
    return res;
  },
  importar: async (data) => {
    const res = await apiFetch("/productos/importar", { method: "POST", body: data });
    localStorage.removeItem(`productos_cache_${JSON.parse(localStorage.getItem("session"))?.comercio_id}`);
    return res;
  },
};

export const DevolucionesAPI = {
  getAll: (comercioId) =>
    apiFetch(`/devoluciones?comercio_id=${comercioId}`),
  create: async (data) => {
    const res = await apiFetch("/devoluciones", { method: "POST", body: data });
    const comercioId = JSON.parse(localStorage.getItem("session"))?.comercio_id;
    localStorage.removeItem(`productos_cache_${comercioId}`);
    localStorage.removeItem(`clientes_cache_${comercioId}`);
    return res;
  },
  getDetalle: (devolucionId) =>
    apiFetch(`/devoluciones/${devolucionId}/detalle`),
};

export const HistorialAPI = {
  getVentasPorCliente: (clienteId, comercioId) =>
    apiFetch(`/clientes/${clienteId}/historial?comercio_id=${comercioId}`),
};

export const AuthAPI = {
  login: (data) => apiFetch("/auth/login", { method: "POST", body: data }),
  logout: (data) => apiFetch("/auth/logout", { method: "POST", body: data }),
};

export const ReportesAPI = {
  getVentasGastosTiempo: (comercioId, desde, hasta) => {
    let url = `/reportes/ventas-gastos-tiempo?comercio_id=${comercioId}&agrupacion=dia`;
    if (desde) url += `&desde=${desde}`;
    if (hasta) url += `&hasta=${hasta}`;
    return apiFetch(url);
  },
  getTopProductos: (comercioId, desde, hasta) => {
    let url = `/reportes/top-productos?comercio_id=${comercioId}&limit=10`;
    if (desde) url += `&desde=${desde}`;
    if (hasta) url += `&hasta=${hasta}`;
    return apiFetch(url);
  },
  getCategoriasVendidas: (comercioId, desde, hasta) => {
    let url = `/reportes/categorias-vendidas?comercio_id=${comercioId}`;
    if (desde) url += `&desde=${desde}`;
    if (hasta) url += `&hasta=${hasta}`;
    return apiFetch(url);
  },
  getEdadEtarioGenero: (comercioId, desde, hasta) => {
    let url = `/reportes/edad-etario-genero?comercio_id=${comercioId}`;
    if (desde) url += `&desde=${desde}`;
    if (hasta) url += `&hasta=${hasta}`;
    return apiFetch(url);
  },
  getMetodosPago: (comercioId, desde, hasta) => {
    let url = `/reportes/metodos-pago?comercio_id=${comercioId}`;
    if (desde) url += `&desde=${desde}`;
    if (hasta) url += `&hasta=${hasta}`;
    return apiFetch(url);
  },
  getGastosDescripcionTipo: (comercioId, desde, hasta) => {
    let url = `/reportes/gastos-descripcion-tipo?comercio_id=${comercioId}`;
    if (desde) url += `&desde=${desde}`;
    if (hasta) url += `&hasta=${hasta}`;
    return apiFetch(url);
  },
  getVentasPorLocalidad: (comercioId, desde, hasta) => {
    let url = `/reportes/ventas-por-localidad?comercio_id=${comercioId}`;
    if (desde) url += `&desde=${desde}`;
    if (hasta) url += `&hasta=${hasta}`;
    return apiFetch(url);
  },
  getTopClientesFrecuenciaTicket: (comercioId, desde, hasta) => {
    let url = `/reportes/top-clientes-frecuencia-ticket?comercio_id=${comercioId}&limit=10`;
    if (desde) url += `&desde=${desde}`;
    if (hasta) url += `&hasta=${hasta}`;
    return apiFetch(url);
  },
};

export const ExportarAPI = {
  getTablaExcel: (tabla) => apiFetch(`/exportar-tabla?tabla=${tabla}`),
};

export const GastosAPI = {
  getAll: (comercioId) => apiFetch(`/gastos?comercio_id=${comercioId}`),
  create: (data) => apiFetch("/gastos", { method: "POST", body: data }),
  update: (id, data) =>
    apiFetch(`/gastos/${id}`, { method: "PUT", body: data }),
  delete: (id, comercioId) =>
    apiFetch(`/gastos/${id}?comercio_id=${comercioId}`, { method: "DELETE" }),
};

export const CajasAPI = {
  getHoy: (comercioId) => apiFetch(`/cajas/hoy/${comercioId}?fecha=${new Date().toLocaleDateString("sv-SE")}`),
  getMovimientos: (comercioId) => apiFetch(`/cajas/movimientos/${comercioId}`),
  getHistorial: (comercioId) => apiFetch(`/cajas/historial/${comercioId}`),
  abrir: (data) => apiFetch("/cajas/abrir", { method: "POST", body: data }),
  cerrar: (id, data) =>
    apiFetch(`/cajas/cerrar/${id}`, { method: "PUT", body: data }),
};

export const TurnosAPI = {
  getAll: (fecha, comercioId) => apiFetch(`/turnos?fecha=${fecha}&comercio_id=${comercioId}`),
  create: (data) => apiFetch("/turnos", { method: "POST", body: data }),
  update: (id, data) => apiFetch(`/turnos/${id}`, { method: "PUT", body: data }),
  delete: (id, comercioId) => apiFetch(`/turnos/${id}?comercio_id=${comercioId}`, { method: "DELETE" })
};

export const SystemAPI = {
  refreshDb: () => apiFetch("/system/refresh-db"),
};