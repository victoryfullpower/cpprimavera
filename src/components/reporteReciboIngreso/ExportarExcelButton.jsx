// components/ExportarExcelButton.js
import * as XLSX from 'xlsx';
import { Button } from '@nextui-org/react';
import DownloadIcon from '@/components/iconos/DownloadIcon'; // Cambiado a import default

const ExportarExcelButton = ({ data, fechaInicio, fechaFin }) => {
  const exportToExcel = () => {
    const excelData = data.flatMap(recibo =>
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

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'RecibosIngreso');

    const wscols = [
      { wch: 8 }, { wch: 10 }, { wch: 20 }, { wch: 15 },
      { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 20 },
      { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 12 },
      { wch: 15 }
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(
      workbook,
      `Recibos_Ingreso_${formatDate(fechaInicio)}_a_${formatDate(fechaFin)}.xlsx`
    );
  };

  // Función auxiliar para formatear fecha
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