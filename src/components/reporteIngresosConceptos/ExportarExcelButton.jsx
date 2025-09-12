import { Button } from '@nextui-org/react'
import * as XLSX from 'xlsx'

export default function ExportarExcelButton({ datos, filtros, estadisticas, conceptos }) {
    const exportarExcel = () => {
        try {
            // Crear un nuevo libro de trabajo
            const wb = XLSX.utils.book_new()
            
            // Preparar los datos para la hoja principal
            const datosExcel = datos.map(recibo => {
                // Construir información de Stand/Cliente
                let standCliente = ''
                if (recibo.stand) {
                    standCliente = `Stand ${recibo.stand.descripcion}`
                    if (recibo.stand.nivel) {
                        standCliente += ` - Piso ${recibo.stand.nivel}`
                    }
                    if (recibo.stand.client) {
                        standCliente += ` - ${recibo.stand.client.nombre}`
                    }
                } else {
                    // Si no hay stand directo, buscar en los detalles
                    const standsDetalles = recibo.detalles
                        .map(detalle => {
                            if (detalle.detalleDeuda?.stand) {
                                let standInfo = `Stand ${detalle.detalleDeuda.stand.descripcion}`
                                if (detalle.detalleDeuda.stand.nivel) {
                                    standInfo += ` - Piso ${detalle.detalleDeuda.stand.nivel}`
                                }
                                if (detalle.detalleDeuda.stand.client) {
                                    standInfo += ` - ${detalle.detalleDeuda.stand.client.nombre}`
                                }
                                return standInfo
                            }
                            return null
                        })
                        .filter(Boolean)
                    standCliente = standsDetalles.join('; ')
                }

                return {
                    'N° Recibo': recibo.numerorecibo,
                    'Fecha': new Date(recibo.fecharecibo).toLocaleDateString(),
                    'Stand/Cliente': standCliente,
                    'Total': parseFloat(recibo.total).toFixed(2),
                    'Estado': recibo.estado ? 'Activo' : 'Inactivo',
                    'Creado por': recibo.createdBy?.username || 'N/A',
                    'Fecha Creación': new Date(recibo.createdAt).toLocaleDateString()
                }
            })
            
            // Crear la hoja principal con los datos
            const ws = XLSX.utils.json_to_sheet(datosExcel)
            
            // Ajustar el ancho de las columnas
            const colWidths = [
                { wch: 12 },  // N° Recibo
                { wch: 12 },  // Fecha
                { wch: 30 },  // Stand/Cliente
                { wch: 12 },  // Total
                { wch: 10 },  // Estado
                { wch: 15 },  // Creado por
                { wch: 15 }   // Fecha Creación
            ]
            ws['!cols'] = colWidths
            
            // Agregar la hoja principal al libro
            XLSX.utils.book_append_sheet(wb, ws, 'Recibos de Ingreso')
            
            // Crear hoja de detalles
            const detallesData = []
            datos.forEach(recibo => {
                recibo.detalles.forEach(detalle => {
                    detallesData.push({
                        'N° Recibo': recibo.numerorecibo,
                        'Fecha': new Date(recibo.fecharecibo).toLocaleDateString(),
                        'Concepto': conceptos.find(c => c.idconcepto === detalle.idconcepto)?.descripcion || 'N/A',
                        'Descripción': detalle.descripcion || '',
                        'Monto': parseFloat(detalle.monto).toFixed(2),
                        'Estado': recibo.estado ? 'Activo' : 'Inactivo'
                    })
                })
            })
            
            const wsDetalles = XLSX.utils.json_to_sheet(detallesData)
            wsDetalles['!cols'] = [
                { wch: 12 },  // N° Recibo
                { wch: 12 },  // Fecha
                { wch: 25 },  // Concepto
                { wch: 40 },  // Descripción
                { wch: 12 },  // Monto
                { wch: 10 }   // Estado
            ]
            
            // Agregar la hoja de detalles al libro
            XLSX.utils.book_append_sheet(wb, wsDetalles, 'Detalles por Concepto')
            
            // Crear hoja de resumen por conceptos
            const resumenConceptosData = Object.values(estadisticas.totalPorConcepto)
                .filter(concepto => concepto.cantidad > 0)
                .sort((a, b) => b.total - a.total)
                .map(concepto => ({
                    'Concepto': concepto.descripcion,
                    'Cantidad': concepto.cantidad,
                    'Monto Total': concepto.total.toFixed(2)
                }))
            
            const wsResumenConceptos = XLSX.utils.json_to_sheet(resumenConceptosData)
            wsResumenConceptos['!cols'] = [
                { wch: 30 },  // Concepto
                { wch: 12 },  // Cantidad
                { wch: 15 }   // Monto Total
            ]
            
            // Agregar la hoja de resumen por conceptos al libro
            XLSX.utils.book_append_sheet(wb, wsResumenConceptos, 'Resumen por Conceptos')
            
            // Crear hoja de resumen general
            const resumenData = [
                { 'Concepto': 'Total de Recibos', 'Valor': estadisticas.total },
                { 'Concepto': 'Recibos Activos', 'Valor': estadisticas.activos },
                { 'Concepto': 'Recibos Inactivos', 'Valor': estadisticas.inactivos },
                { 'Concepto': 'Monto Total', 'Valor': `S/. ${estadisticas.totalMonto}` }
            ]
            
            // Agregar filtros aplicados si los hay
            if (filtros.fechaDesde || filtros.fechaHasta || filtros.idconcepto_deuda || filtros.estado !== '' || filtros.piso !== '') {
                resumenData.push({ 'Concepto': '', 'Valor': '' })
                resumenData.push({ 'Concepto': 'FILTROS APLICADOS', 'Valor': '' })
                
                if (filtros.fechaDesde) {
                    resumenData.push({ 'Concepto': 'Fecha desde', 'Valor': filtros.fechaDesde })
                }
                if (filtros.fechaHasta) {
                    resumenData.push({ 'Concepto': 'Fecha hasta', 'Valor': filtros.fechaHasta })
                }
                if (filtros.idconcepto_deuda) {
                    const concepto = conceptos.find(c => c.idconcepto === parseInt(filtros.idconcepto_deuda))
                    resumenData.push({ 'Concepto': 'Concepto de deuda', 'Valor': concepto?.descripcion || 'N/A' })
                }
                if (filtros.estado !== '') {
                    resumenData.push({ 'Concepto': 'Estado', 'Valor': filtros.estado === 'true' ? 'Activo' : 'Inactivo' })
                }
                if (filtros.piso !== '') {
                    resumenData.push({ 'Concepto': 'Piso', 'Valor': filtros.piso === '' ? 'Todos los pisos' : `Piso ${filtros.piso}` })
                }
            }
            
            const wsResumen = XLSX.utils.json_to_sheet(resumenData)
            wsResumen['!cols'] = [{ wch: 25 }, { wch: 30 }]
            
            // Agregar la hoja de resumen al libro
            XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen General')
            
            // Generar el nombre del archivo
            const nombreArchivo = `Reporte_Ingresos_Conceptos_${new Date().toISOString().split('T')[0]}.xlsx`
            
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
