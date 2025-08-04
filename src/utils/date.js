export const ensureValidDate = (date) => {
  // Si ya es un Date válido, retornarlo
  if (date instanceof Date && !isNaN(date)) return date
  
  // Si es string o número, intentar convertirlo
  if (typeof date === 'string' || typeof date === 'number') {
    const newDate = new Date(date)
    if (!isNaN(newDate)) return newDate
  }
  
  // Si viene del servidor con formato ISO (como "2023-10-15T00:00:00.000Z")
  if (typeof date === 'string' && date.includes('T')) {
    const newDate = new Date(date)
    if (!isNaN(newDate)) return newDate
  }
  
  // Fallback a fecha actual
  return new Date()
}

export function getPeruTime() {
  const now = new Date();
  // Ajuste manual para UTC-5 (Perú)
  return new Date(new Date().setHours(new Date().getHours() - 5));
}