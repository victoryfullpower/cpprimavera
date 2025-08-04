import * as XLSX from 'xlsx';
import { Button } from '@nextui-org/react';
import DownloadIcon from '@/components/iconos/DownloadIcon';
import { format } from 'date-fns';

const ExportarExcelButton = ({ data, fechaInicio, fechaFin, tipo = 'ingreso' }) => {
  const exportToExcel = () => {
    let excelData = [];
    
    if (tipo === 'ingreso') {
      excelData = data.flatMap(recibo =>
        recibo.detalles.map(detalle => ({
          'N° Recibo': recibo.numerorecibo,
          'Fecha Recibo': new Date(recibo.fecharecibo).toLocaleDateString(),
          'Cliente': recibo.stand?.client?.nombre || 'Otro ingreso',
          'Stand': recibo.stand?.descripcion || '-',
          'Método Pago': recibo.metodoPago.descripcion,
          'Entidad Recaudadora': recibo.entidadRecaudadora?.descripcion || '-',
          'N° Operación': recibo.numero_operacion || '-',
          'Concepto': detalle.concepto.descripcion,
          'Descripción': detalle.descripcion || '-',
          'Deuda Relacionada': detalle.detalleDeuda?.cabecera?.concepto.descripcion || '-',
          'Fecha Deuda': detalle.fechadeuda ? new Date(detalle.fechadeuda).toLocaleDateString() : '-',
          'Monto Pagado': Number(detalle.monto).toFixed(2),
          'Usuario': recibo.createdBy.username
        }))
      );
    } else { // egreso
      excelData = data.flatMap(recibo =>
        recibo.detalles.map(detalle => ({
          'N° Recibo': recibo.numerorecibo_egreso,
          'Fecha Recibo': new Date(recibo.fecharecibo_egreso).toLocaleDateString(),
          'Concepto': detalle.concepto.descripcion,
          'Descripción': detalle.descripcion || '-',
          'Monto': Number(detalle.monto).toFixed(2),
          'Usuario': recibo.createdBy.username
        }))
      );
    }

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, tipo === 'ingreso' ? 'RecibosIngreso' : 'RecibosEgreso');

    const fileName = tipo === 'ingreso' 
      ? `Recibos_Ingreso_${formatDate(fechaInicio)}_a_${formatDate(fechaFin)}.xlsx`
      : `Recibos_Egreso_${formatDate(fechaInicio)}_a_${formatDate(fechaFin)}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  return (
    <Button 
      color="success" 
      startContent={<DownloadIcon className="w-4 h-4" />}
      onPress={exportToExcel}
    >
      Exportar a Excel
    </Button>
  );
};

export default ExportarExcelButton;