import { Button } from '@nextui-org/react'
import * as XLSX from 'xlsx'

export default function ExportarExcelButton({ datos, filtros, estadisticas }) {
    const exportarExcel = () => {
        try {
            // Crear un nuevo libro de trabajo
            const wb = XLSX.utils.book_new()
            
            // Preparar los datos para la hoja principal
            const datosExcel = datos.map(reg => ({
                'ID': reg.idcompra,
                'Fecha': new Date(reg.fecharegistro).toLocaleDateString(),
                'Tipo Documento': reg.tipoCompra?.descripcion || 'N/A',
                'Comprobante': reg.numcomprobante,
                'Descripción': reg.descripcion,
                'Monto': parseFloat(reg.monto).toFixed(2),
                'Estado': reg.estado ? 'Activo' : 'Inactivo',
                'Creado por': reg.createdBy?.username || 'N/A',
                'Fecha Creación': new Date(reg.createdAt).toLocaleDateString()
            }))
            
            // Crear la hoja principal con los datos
            const ws = XLSX.utils.json_to_sheet(datosExcel)
            
            // Ajustar el ancho de las columnas
            const colWidths = [
                { wch: 8 },   // ID
                { wch: 12 },  // Fecha
                { wch: 20 },  // Tipo Documento
                { wch: 15 },  // Comprobante
                { wch: 40 },  // Descripción
                { wch: 12 },  // Monto
                { wch: 10 },  // Estado
                { wch: 15 },  // Creado por
                { wch: 15 }   // Fecha Creación
            ]
            ws['!cols'] = colWidths
            
            // Agregar la hoja principal al libro
            XLSX.utils.book_append_sheet(wb, ws, 'Registros de Compra')
            
            // Crear hoja de resumen
            const resumenData = [
                { 'Concepto': 'Total de Registros', 'Valor': estadisticas.total },
                { 'Concepto': 'Monto Total', 'Valor': `S/. ${estadisticas.totalMonto}` },
                { 'Concepto': 'Registros Activos', 'Valor': estadisticas.activos },
                { 'Concepto': 'Registros Inactivos', 'Valor': estadisticas.inactivos }
            ]
            
            // Agregar filtros aplicados si los hay
            if (filtros.fechaDesde || filtros.fechaHasta || filtros.idtipocompra || filtros.estado !== '' || filtros.descripcion) {
                resumenData.push({ 'Concepto': '', 'Valor': '' })
                resumenData.push({ 'Concepto': 'FILTROS APLICADOS', 'Valor': '' })
                
                if (filtros.fechaDesde) {
                    resumenData.push({ 'Concepto': 'Fecha desde', 'Valor': filtros.fechaDesde })
                }
                if (filtros.fechaHasta) {
                    resumenData.push({ 'Concepto': 'Fecha hasta', 'Valor': filtros.fechaHasta })
                }
                if (filtros.idtipocompra) {
                    const tipoDoc = datos.find(d => d.idtipocompra === parseInt(filtros.idtipocompra))
                    resumenData.push({ 'Concepto': 'Tipo de documento', 'Valor': tipoDoc?.tipoCompra?.descripcion || 'N/A' })
                }
                if (filtros.estado !== '') {
                    resumenData.push({ 'Concepto': 'Estado', 'Valor': filtros.estado === 'true' ? 'Activo' : 'Inactivo' })
                }
                if (filtros.descripcion) {
                    resumenData.push({ 'Concepto': 'Descripción', 'Valor': filtros.descripcion })
                }
            }
            
            const wsResumen = XLSX.utils.json_to_sheet(resumenData)
            wsResumen['!cols'] = [{ wch: 25 }, { wch: 30 }]
            
            // Agregar la hoja de resumen al libro
            XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')
            
            // Generar el nombre del archivo
            const nombreArchivo = `Reporte_Registro_Compra_${new Date().toISOString().split('T')[0]}.xlsx`
            
            // Descargar el archivo
            XLSX.writeFile(wb, nombreArchivo)
            
        } catch (error) {
            console.error('Error exportando a Excel:', error)
            throw new Error('Error al exportar a Excel')
        }
    }
    
    return (
        <Button 
            color="success" 
            variant="flat"
            onPress={exportarExcel}
        >
            Exportar Excel
        </Button>
    )
}

