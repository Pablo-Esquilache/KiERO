import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../shared/api/client';
import { useAuth } from '../../shared/auth/AuthContext';

export function useGastos() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['gastos', session?.comercio_id],
    queryFn: () => apiFetch(`/gastos?comercio_id=${session.comercio_id}`),
    enabled: !!session?.comercio_id,
  });
}

export function useCategoriasGastos() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['gastos-categorias', session?.comercio_id],
    queryFn: () => apiFetch(`/ajustes/gastos_categorias/${session.comercio_id}`),
    enabled: !!session?.comercio_id,
  });
}

export function useCrearGasto() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: (data) => apiFetch('/gastos', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gastos', session?.comercio_id] });
    }
  });
}

export function useActualizarGasto() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: ({ id, data }) => apiFetch(`/gastos/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gastos', session?.comercio_id] });
    }
  });
}

export function useEliminarGasto() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: (id) => apiFetch(`/gastos/${id}?comercio_id=${session.comercio_id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gastos', session?.comercio_id] });
    }
  });
}
