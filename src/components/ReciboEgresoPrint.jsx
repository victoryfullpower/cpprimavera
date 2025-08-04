'use client'
import { FaPhone, FaWhatsapp, FaEnvelope } from 'react-icons/fa'
import Logo from './Logo'
import { forwardRef } from 'react'

const ReciboEgresoPrint = forwardRef(({
  recibo,
  empresa,
  conceptos
}, ref) => {
  const fechaActual = new Date()
  const fechaFormateada = fechaActual.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  const total = Number(recibo.total)

  // Función para convertir números a letras
  const numeroALetras = (numero) => {
    const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const especiales = ['once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

    let entero = Math.floor(numero);
    let decimal = Math.round((numero - entero) * 100);
    let letras = '';

    if (entero === 0) {
      letras = 'cero';
    } else if (entero < 10) {
      letras = unidades[entero];
    } else if (entero < 20) {
      letras = especiales[entero - 11];
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

    return letras + ' ' + (decimal ? `con ${decimal.toString().padStart(2, '0')}/100` : '00/100');
  };

  const ReciboIndividual = ({ esTestigo = false }) => (
    <div className={`recibo-individual bg-white text-gray-800 p-4 ${esTestigo ? 'border-l-2 border-dashed border-gray-400' : ''}`}>
      <div className="flex items-center mb-4 border-b pb-2">
        <Logo />
        <div className="flex-1">
          {empresa && (
            <>
              <h1 className="text-xl font-bold uppercase">{empresa.nombre_empresa}</h1>
              <p className="text-sm">RUC: {empresa.ruc}</p>
              <p className="text-sm">{empresa.direccion}</p>
              <div className="flex flex-wrap gap-4 mt-1">
                <div className="flex items-center text-sm">
                  <FaPhone className="mr-1 text-gray-600" />
                  <span>{empresa.telefono}</span>
                </div>
                <div className="flex items-center text-sm">
                  <FaWhatsapp className="mr-1 text-green-600" />
                  <span>{empresa.celular}</span>
                </div>
                <div className="flex items-center text-sm">
                  <FaEnvelope className="mr-1 text-blue-600" />
                  <span>{empresa.correo}</span>
                </div>
              </div>
            </>
          )}
          <h2 className="text-lg font-bold mt-2">RECIBO DE EGRESO</h2>
          <div>
            <p className="text-md font-semibold">
              N° {recibo?.numerorecibo_egreso || 'Nuevo'}
              {esTestigo && <span className="text-sm font-bold text-red-600"> COPIA TESTIGO</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 mb-4 text-sm">
        <div className="flex justify-between">
          <span className="font-semibold">Fecha:</span>
          <span>{fechaFormateada}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Registrado por:</span>
          <span>{recibo?.createdBy?.username || 'Usuario no disponible'}</span>
        </div>
      </div>

      <div className="mb-2 text-sm">
        <p className="font-semibold">Recibi de Amepri la cantidad de:</p>
        <p className="font-bold italic">{numeroALetras(total)} SOLES</p>
      </div>

      <table className="w-full border-collapse mb-4 text-sm">
        <thead>
          <tr className="border-b border-t">
            <th className="text-left py-1">CONCEPTO</th>
            <th className="text-left py-1">DESCRIPCIÓN</th>
            <th className="text-right py-1">MONTO</th>
          </tr>
        </thead>
        <tbody>
          {recibo.detalles?.map((detalle, index) => {
            const concepto = conceptos?.find(c => c.idconcepto_egreso === detalle.idconcepto_egreso)
            return (
              <tr key={index} className="border-b">
                <td className="py-1">{concepto?.descripcion || 'Concepto no especificado'}</td>
                <td className="py-1">{detalle.descripcion || '-'}</td>
                <td className="text-right py-1">S/. {Number(detalle.monto).toFixed(2)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="text-right border-t pt-2">
        <p className="font-bold">TOTAL: S/. {total.toFixed(2)}</p>
      </div>

     <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
  {/* Columna del Presidente */}
  <div className="border-t-2 pt-4 text-center">
    <p>_________________________</p>
    <p>Presidente</p>
  </div>

  {/* Columna de Recibo Conforme */}
  <div className="border-t-2 pt-4">
    <div className="text-center">
      <p>_________________________</p>
      <p>Recibi Conforme</p>
    </div>
    <div className="ml-[calc(50%-3.5rem)] text-start mt-2"> {/* Ajusta el 3.5rem según necesidad */}
      <p>Nombre:</p>
      <p>Dni:</p>
    </div>
  </div>
</div>
    </div>
  )

  return (
    <div ref={ref} className="recibo-container">
      <div className="recibos-horizontales">
        <ReciboIndividual />
        <ReciboIndividual esTestigo={true} />
      </div>
    </div>
  )
})

ReciboEgresoPrint.displayName = 'ReciboEgresoPrint'

export default ReciboEgresoPrint