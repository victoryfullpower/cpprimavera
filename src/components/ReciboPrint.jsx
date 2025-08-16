'use client'
import { FaPhone, FaWhatsapp, FaEnvelope } from 'react-icons/fa'
import Logo from './Logo'
import { forwardRef } from 'react'
import {numeroALetras} from '@/utils/numerosletras'

const ReciboPrint = forwardRef(({ 
  recibo, 
  empresa, 
  metodosPago, 
  entidadesRecaudadoras, 
  detalles 
}, ref) => {
  const fechaActual = new Date();
  const fechaFormateada = fechaActual.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  console.log("=== DEBUG RECIBO PRINT ===");
  console.log("recibo:", recibo);
  console.log("detalles:", detalles);
  console.log("detalles con inquilino:", detalles?.map(det => ({
    concepto: det.concepto?.descripcion,
    inquilino_activo: det.inquilino_activo,
    detalleDeuda: det.detalleDeuda,
    idregdeuda_detalle: det.idregdeuda_detalle
  })));
  
  const total = detalles.reduce((sum, det) => sum + (Number(det.montoPago) || 0), 0)

  // Función para convertir números a letras
  

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
          <h2 className="text-lg font-bold mt-2">RECIBO DE INGRESO</h2>
          <div>
            <p className="text-md font-semibold">
              N° {recibo?.numerorecibo || 'Nuevo'}
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
        {recibo?.stand?.descripcion && (<div className="flex justify-between">
          <span className="font-semibold">Stand:</span>
          <span>
            {recibo?.stand?.descripcion || ''} 
            {recibo?.stand?.nivel && ` - Piso ${recibo.stand.nivel}`}
          </span>
        </div>)}
        {recibo?.stand?.client?.nombre && (<div className="flex justify-between">
          <span className="font-semibold">Cliente:</span>
          <span>{recibo?.stand?.client?.nombre || ''}</span>
        </div>)}

        <div className="flex justify-between">
          <span className="font-semibold">Método Pago:</span>
          <span>
            {metodosPago?.find(m => m.idmetodo_pago === recibo?.idmetodo_pago)?.descripcion || ''}
          </span>
        </div>
        {recibo?.identidad_recaudadora && (
          <div className="flex justify-between">
            <span className="font-semibold">Entidad Financiera:</span>
            <span>
              {entidadesRecaudadoras?.find(m => m.identidad_recaudadora === recibo.identidad_recaudadora)?.descripcion || ''}
            </span>
          </div>
        )}
        {recibo?.numero_operacion && (
          <div className="flex justify-between">
            <span className="font-semibold">N° Operación:</span>
            <span>{recibo.numero_operacion}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="font-semibold">Registrado por:</span>
          <span>{recibo?.createdBy.username || 'Usuario no disponible'}</span>
        </div>
      </div>
      
      <div className="mb-2 text-sm">
        <p className="font-semibold">
          Recibí de {
            (() => {
              // Buscar si algún detalle tiene inquilino activo
              // Manejar tanto el caso de nuevo recibo como el de recibo existente
              const detalleConInquilino = detalles?.find(det => {
                // Caso 1: Nuevo recibo - inquilino está directamente en el detalle
                if (det.inquilino_activo) {
                  return det.inquilino_activo;
                }
                // Caso 2: Recibo existente - inquilino está en detalleDeuda
                if (det.detalleDeuda?.inquilino_activo) {
                  return det.detalleDeuda.inquilino_activo;
                }
                return false;
              });
              
              console.log("detalleConInquilino", detalleConInquilino);
              
              if (detalleConInquilino?.inquilino_activo) {
                // Caso 1: Nuevo recibo
                return detalleConInquilino.inquilino_activo.nombre;
              } else if (detalleConInquilino?.detalleDeuda?.inquilino_activo) {
                // Caso 2: Recibo existente
                return detalleConInquilino.detalleDeuda.inquilino_activo.nombre;
              } else {
                // Si no hay inquilino, mostrar el cliente
                return recibo?.stand?.client?.nombre || 'el cliente';
              }
            })()
          } la cantidad de:
        </p>
        <p className="font-bold italic">{numeroALetras(total)} SOLES</p>
      </div>
      
      <table className="w-full border-collapse mb-4 text-sm">
        <thead>
          <tr className="border-b border-t">
            <th className="text-left py-1">CONCEPTO</th>
            <th className="text-right py-1">FECHA</th>
            <th className="text-right py-1">MORA</th>
            <th className="text-right py-1">MONTO</th>
          </tr>
        </thead>
        <tbody>
          {detalles?.map((detalle, index) => (
            <tr key={index} className="border-b">
              <td className="py-1">{detalle.concepto?.descripcion || 'Concepto'}</td>
              <td className="text-right py-1">
                {new Date(detalle.fechadeuda).toLocaleDateString('es-ES', {
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric'
                })}
              </td>
              <td className="text-right py-1">S/. {(Number(detalle.mora) || 0).toFixed(2)}</td>
              <td className="text-right py-1">S/. {Number(detalle.montoPago).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="text-right border-t pt-2">
        <p className="font-bold">TOTAL: S/. {total.toFixed(2)}</p>
      </div>
      
      <div className="mt-8 grid grid-cols-2 gap-4 text-center text-sm">
        <div className="border-t-2 pt-4">
          <p>_________________________</p>
          <p>Presidente</p>
        </div>
        <div className="border-t-2 pt-4">
          <p>_________________________</p>
          <p>secretario de economía</p>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={ref} className="recibo-container">
      <div className="recibos-horizontales">
        <ReciboIndividual />
        <ReciboIndividual esTestigo={true} />
      </div>
    </div>
  );
})

ReciboPrint.displayName = 'ReciboPrint';

export default ReciboPrint;