import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../shared/api/client';
import { useAuth } from '../../shared/auth/AuthContext';

export function useClientes() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['clientes', session?.comercio_id],
    queryFn: () => apiFetch(`/clientes?comercio_id=${session.comercio_id}`),
    enabled: !!session?.comercio_id,
  });
}

export function useCrearCliente() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: (data) => apiFetch('/clientes', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes', session?.comercio_id] });
    }
  });
}

export function useActualizarCliente() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: ({ id, data }) => apiFetch(`/clientes/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes', session?.comercio_id] });
    }
  });
}

export function useClienteSaldo(id) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['cliente-saldo', id],
    queryFn: () => apiFetch(`/clientes/${id}/saldo?comercio_id=${session.comercio_id}`),
    enabled: !!session?.comercio_id && !!id,
  });
}

export function useRegistrarPagoCliente() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: ({ id, data }) => apiFetch(`/clientes/${id}/pago`, { method: 'POST', body: data }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['clientes', session?.comercio_id] });
      queryClient.invalidateQueries({ queryKey: ['cliente-saldo', id] });
    }
  });
}

export function useLocalidades() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['clientes-localidades', session?.comercio_id],
    queryFn: () => apiFetch(`/clientes/localidades/lista?comercio_id=${session.comercio_id}`),
    enabled: !!session?.comercio_id,
  });
}

