export function numeroALetras(numero) {
  const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
  
  let entero = Math.floor(numero);
  let decimal = Math.round((numero - entero) * 100);
  let letras = '';
  
  if (entero === 0) {
    letras = 'cero';
  } else if (entero < 10) {
    letras = unidades[entero];
  } else if (entero >= 10 && entero < 20) {
    letras = especiales[entero - 10];
  } else if (entero < 100) {
    letras = decenas[Math.floor(entero / 10)];
    if (entero % 10 !== 0) {
      letras += ' y ' + unidades[entero % 10];
    }
  } else if (entero < 1000) {
    letras = centenas[Math.floor(entero / 100)];
    if (entero % 100 !== 0) {
      letras += ' ' + numeroALetras(entero % 100);
    }
  } else if (entero === 1000) {
    letras = 'mil';
  } else if (entero < 2000) {
    letras = 'mil ' + numeroALetras(entero % 1000);
  } else if (entero < 1000000) {
    letras = numeroALetras(Math.floor(entero / 1000)) + ' mil';
    if (entero % 1000 !== 0) {
      letras += ' ' + numeroALetras(entero % 1000);
    }
  } else if (entero === 1000000) {
    letras = 'un millón';
  } else if (entero < 2000000) {
    letras = 'un millón ' + numeroALetras(entero % 1000000);
  } else if (entero < 1000000000) {
    letras = numeroALetras(Math.floor(entero / 1000000)) + ' millones';
    if (entero % 1000000 !== 0) {
      letras += ' ' + numeroALetras(entero % 1000000);
    }
  }
  
  // Capitalizar la primera letra
  if (letras.length > 0) {
    letras = letras.charAt(0).toUpperCase() + letras.slice(1);
  }
  
  return letras + (decimal ? ` con ${decimal.toString().padStart(2, '0')}/100` : ' con 00/100');
}