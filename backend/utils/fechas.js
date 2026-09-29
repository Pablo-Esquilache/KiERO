import { DateTime } from "luxon";

/**
 * Devuelve null si el movimiento es "de hoy" en Argentina (el INSERT/UPDATE
 * debe usar NOW()/CURRENT_TIMESTAMP), o un timestamp UTC fijo al mediodía
 * argentino si es una carga retroactiva explícita.
 */
export function resolverFechaMovimiento(fechaCliente) {
  if (!fechaCliente) return null;

  const hoyArg = DateTime.now().setZone("America/Argentina/Buenos_Aires").toISODate();
  if (fechaCliente === hoyArg) return null;

  return DateTime.fromFormat(fechaCliente, "yyyy-MM-dd", { zone: "America/Argentina/Buenos_Aires" })
    .set({ hour: 12 })
    .toUTC()
    .toISO();
}
