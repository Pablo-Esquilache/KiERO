import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../shared/api/client';
import { useAuth } from '../../shared/auth/AuthContext';

export function useMetodosPago() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['ajustes-metodos-pago', session?.comercio_id],
    queryFn: () => apiFetch(`/ajustes/metodos_pago/${session.comercio_id}`),
    enabled: !!session?.comercio_id,
  });
}

export function useDescuentos() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['ajustes-descuentos', session?.comercio_id],
    queryFn: () => apiFetch(`/ajustes/descuentos/${session.comercio_id}`),
    enabled: !!session?.comercio_id,
  });
}

export function useVentas() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['ventas', session?.comercio_id],
    queryFn: () => apiFetch(`/ventas?comercio_id=${session.comercio_id}`),
    enabled: !!session?.comercio_id,
  });
}

export function useDevoluciones() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['devoluciones', session?.comercio_id],
    queryFn: () => apiFetch(`/devoluciones?comercio_id=${session.comercio_id}`),
    enabled: !!session?.comercio_id,
  });
}

export function useCrearVenta() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: (data) => apiFetch('/ventas', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventas', session?.comercio_id] });
      queryClient.invalidateQueries({ queryKey: ['productos', session?.comercio_id] });
      queryClient.invalidateQueries({ queryKey: ['caja-hoy', session?.comercio_id] });
      queryClient.invalidateQueries({ queryKey: ['caja-movimientos', session?.comercio_id] });
    }
  });
}

export function useCrearDevolucion() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: (data) => apiFetch('/devoluciones', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devoluciones', session?.comercio_id] });
      queryClient.invalidateQueries({ queryKey: ['productos', session?.comercio_id] });
      queryClient.invalidateQueries({ queryKey: ['caja-hoy', session?.comercio_id] });
      queryClient.invalidateQueries({ queryKey: ['caja-movimientos', session?.comercio_id] });
    }
  });
}
