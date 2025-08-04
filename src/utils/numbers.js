export const formatDecimal = (value, decimals = 4) => {
  if (value === null || value === undefined) return '0.00'
  const num = typeof value === 'number' ? value : parseFloat(value)
  return isNaN(num) ? '0.00' : num.toFixed(2)
}

const formatCurrency = (value) => {
  if (value === undefined || value === null) return "0.00";
  const num = Number(value);
  return isNaN(num) ? "0.00" : num.toFixed(2);
};