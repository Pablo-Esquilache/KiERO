import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../shared/api/client';
import { useAuth } from '../../shared/auth/AuthContext';
import { useCajaStore } from '../../shared/store/useCajaStore';

export function useCajaHoy() {
  const { session } = useAuth();
  const setCaja = useCajaStore(state => state.setCaja);
  const setCajaAbierta = useCajaStore(state => state.setCajaAbierta);
  
  return useQuery({
    queryKey: ['caja-hoy', session?.comercio_id],
    queryFn: async () => {
      // Usar la misma fecha que usaba Vanilla JS (sv-SE = YYYY-MM-DD local)
      const data = await apiFetch(`/cajas/hoy/${session.comercio_id}?fecha=${new Date().toLocaleDateString("sv-SE")}`);
      if (data && data.estado === 'ABIERTA') {
        setCaja(data);
        setCajaAbierta(true);
      } else {
        setCaja(data || null);
        setCajaAbierta(false);
      }
      return data;
    },
    enabled: !!session?.comercio_id,
  });
}

export function useMovimientosCaja() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['caja-movimientos', session?.comercio_id],
    queryFn: () => apiFetch(`/cajas/movimientos/${session.comercio_id}`),
    enabled: !!session?.comercio_id,
  });
}

export function useHistorialCajas() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['caja-historial', session?.comercio_id],
    queryFn: () => apiFetch(`/cajas/historial/${session.comercio_id}`),
    enabled: !!session?.comercio_id,
  });
}

export function useAbrirCaja() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: (data) => apiFetch('/cajas/abrir', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caja-hoy', session?.comercio_id] });
      queryClient.invalidateQueries({ queryKey: ['caja-movimientos', session?.comercio_id] });
    }
  });
}

export function useCerrarCaja() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: ({ id, data }) => apiFetch(`/cajas/cerrar/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caja-hoy', session?.comercio_id] });
      queryClient.invalidateQueries({ queryKey: ['caja-historial', session?.comercio_id] });
    }
  });
}
