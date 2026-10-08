import { create } from 'zustand';

export const useCajaStore = create((set) => ({
  caja: null, // { id, estado, saldo_inicial, ... }
  setCaja: (caja) => set({ caja }),
  cajaAbierta: false,
  setCajaAbierta: (isOpen) => set({ cajaAbierta: isOpen })
}));
