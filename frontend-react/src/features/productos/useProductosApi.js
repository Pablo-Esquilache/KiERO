import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../shared/api/client';
import { useAuth } from '../../shared/auth/AuthContext';

export function useProductos() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['productos', session?.comercio_id],
    queryFn: () => apiFetch(`/productos?comercio_id=${session.comercio_id}`),
    enabled: !!session?.comercio_id,
  });
}

export function useCategorias() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['productos-categorias', session?.comercio_id],
    queryFn: () => apiFetch(`/productos/categorias/lista?comercio_id=${session.comercio_id}`),
    enabled: !!session?.comercio_id,
  });
}

export function useCrearProducto() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: (data) => apiFetch('/productos', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos', session?.comercio_id] });
      queryClient.invalidateQueries({ queryKey: ['productos-categorias', session?.comercio_id] });
    }
  });
}

export function useActualizarProducto() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: ({ id, data }) => apiFetch(`/productos/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos', session?.comercio_id] });
      queryClient.invalidateQueries({ queryKey: ['productos-categorias', session?.comercio_id] });
    }
  });
}

export function useImportarProductos() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: (data) => apiFetch('/productos/importar', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos', session?.comercio_id] });
      queryClient.invalidateQueries({ queryKey: ['productos-categorias', session?.comercio_id] });
    }
  });
}
