import * as XLSX from 'xlsx';
import { Button } from '@nextui-org/react';
import DownloadIcon from '@/components/iconos/DownloadIcon';

const ArqueoCajaExcel = ({ reporte }) => {
  const exportToExcel = () => {
    // Crear un nuevo libro de trabajo
    const workbook = XLSX.utils.book_new();
    
    // Hoja de resumen
    const summaryData = [
      ['REPORTE DE ARQUEO DE CAJA'],
      ['Fecha de corte:', reporte.fechaCorte],
      [],
      ['RESUMEN'],
      ['Total Ingresos:', reporte.totalIngresos],
      ['Total Egresos:', reporte.totalEgresos],
      ['Saldo Final:', reporte.saldo],
      [],
      ['INGRESOS POR MÉTODO DE PAGO'],
      ['Método de Pago', 'Monto']
    ];

    // Agregar datos de ingresos por método
    reporte.ingresosPorMetodo.forEach(item => {
      summaryData.push([item.metodo, item.monto]);
    });

    // Crear hoja de resumen
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen");

    // Hoja de detalle de ingresos
    const ingresosData = [
      ['DETALLE DE INGRESOS'],
      [],
      ['N° Recibo', 'Fecha', 'Método Pago', 'Entidad Recaudadora', 'N° Operación', 'Total']
    ];

    reporte.detalleIngresos.forEach(ingreso => {
      ingresosData.push([
        ingreso.numerorecibo,
        new Date(ingreso.fecharecibo).toLocaleDateString(),
        ingreso.metodoPago.descripcion,
        ingreso.entidadRecaudadora?.descripcion || '-',
        ingreso.numero_operacion || '-',
        ingreso.total
      ]);
    });

    const ingresosSheet = XLSX.utils.aoa_to_sheet(ingresosData);
    XLSX.utils.book_append_sheet(workbook, ingresosSheet, "Ingresos");

    // Hoja de detalle de egresos
    const egresosData = [
      ['DETALLE DE EGRESOS'],
      [],
      ['N° Recibo', 'Fecha', 'Total']
    ];

    reporte.detalleEgresos.forEach(egreso => {
      egresosData.push([
        egreso.numerorecibo_egreso,
        new Date(egreso.fecharecibo_egreso).toLocaleDateString(),
        egreso.total
      ]);
    });

    const egresosSheet = XLSX.utils.aoa_to_sheet(egresosData);
    XLSX.utils.book_append_sheet(workbook, egresosSheet, "Egresos");

    // Estilos para las celdas
    if (workbook.Sheets["Resumen"]) {
      // Estilo para los títulos
      workbook.Sheets["Resumen"]["A1"].s = { font: { bold: true, sz: 16 } };
      workbook.Sheets["Resumen"]["A4"].s = { font: { bold: true } };
      workbook.Sheets["Resumen"]["A9"].s = { font: { bold: true } };
      
      // Estilo para los encabezados de tabla
      if (workbook.Sheets["Resumen"]["A10"]) {
        workbook.Sheets["Resumen"]["A10"].s = { font: { bold: true } };
        workbook.Sheets["Resumen"]["B10"].s = { font: { bold: true } };
      }

      // Formato de moneda para montos
      const range = XLSX.utils.decode_range(workbook.Sheets["Resumen"]["!ref"]);
      for (let i = 4; i <= range.e.r; i++) {
        const cellB = XLSX.utils.encode_cell({ r: i, c: 1 });
        if (workbook.Sheets["Resumen"][cellB]) {
          workbook.Sheets["Resumen"][cellB].z = '"S/"#,##0.00';
        }
      }
    }

    // Aplicar formato a las hojas de detalle
    [ingresosSheet, egresosSheet].forEach(sheet => {
      if (sheet["!ref"]) {
        const range = XLSX.utils.decode_range(sheet["!ref"]);
        
        // Formato para encabezados
        for (let c = 0; c <= range.e.c; c++) {
          const cell = XLSX.utils.encode_cell({ r: 2, c });
          if (sheet[cell]) {
            sheet[cell].s = { font: { bold: true } };
          }
        }
        
        // Formato de moneda para columnas de total
        const totalCol = sheet === ingresosSheet ? 5 : 2;
        for (let r = 3; r <= range.e.r; r++) {
          const cell = XLSX.utils.encode_cell({ r, c: totalCol });
          if (sheet[cell]) {
            sheet[cell].z = '"S/"#,##0.00';
          }
        }
      }
    });

    // Generar el archivo Excel
    const fileName = `Arqueo_Caja_${reporte.fechaCorte.replace(/-/g, '')}.xlsx`;
    XLSX.writeFile(workbook, fileName, { compression: true });
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

export default ArqueoCajaExcel;