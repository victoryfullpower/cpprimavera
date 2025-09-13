import React from 'react'
import { Button } from '@nextui-org/react'
import { FaDownload } from 'react-icons/fa'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const ExportarExcelButton = ({ datos }) => {
    const exportarExcel = () => {
        try {
            // Preparar datos para Excel
            const datosExcel = datos.map((detalle, index) => {
                const total = parseFloat(detalle.monto) + parseFloat(detalle.mora || 0)
                const pagado = parseFloat(detalle.totalPagado || 0)
                const saldo = total - pagado

                return {
                    'N°': index + 1,
                    'Fecha': format(new Date(detalle.fechadeudaStand), 'dd/MM/yyyy', { locale: es }),
                    'Stand': detalle.stand?.descripcion || 'N/A',
                    'Nivel': detalle.stand?.nivel || 'N/A',
                    'Cliente': detalle.stand?.client?.nombre || 'Sin cliente',
                    'Concepto': detalle.concepto?.descripcion || 'Sin concepto',
                    'Inquilino': detalle.inquilino_activo?.nombre || 'Sin inquilino',
                    'Monto': parseFloat(detalle.monto),
                    'Mora': parseFloat(detalle.mora || 0),
                    'Total': total,
                    'Pagado': pagado,
                    'Saldo': saldo,
                    'Estado': detalle.estado ? 'Pagado' : 'Pendiente',
                    'Fecha Creación': format(new Date(detalle.createdAt), 'dd/MM/yyyy HH:mm', { locale: es }),
                    'Creado Por': detalle.createdBy?.username || 'N/A'
                }
            })

            // Crear libro de trabajo
            const wb = XLSX.utils.book_new()
            
            // Crear hoja de datos
            const ws = XLSX.utils.json_to_sheet(datosExcel)

            // Ajustar ancho de columnas
            const colWidths = [
                { wch: 5 },   // N°
                { wch: 12 },  // Fecha
                { wch: 20 },  // Stand
                { wch: 8 },   // Nivel
                { wch: 25 },  // Cliente
                { wch: 20 },  // Concepto
                { wch: 20 },  // Inquilino
                { wch: 12 },  // Monto
                { wch: 12 },  // Mora
                { wch: 12 },  // Total
                { wch: 12 },  // Pagado
                { wch: 12 },  // Saldo
                { wch: 10 },  // Estado
                { wch: 18 },  // Fecha Creación
                { wch: 15 }   // Creado Por
            ]
            ws['!cols'] = colWidths

            // Agregar hoja al libro
            XLSX.utils.book_append_sheet(wb, ws, 'Registro de Deudas')

            // Crear hoja de resumen
            const resumenData = [
                { 'Métrica': 'Total de registros', 'Valor': datos.length },
                { 'Métrica': 'Total deuda generada', 'Valor': datos.reduce((sum, d) => sum + parseFloat(d.monto) + parseFloat(d.mora || 0), 0) },
                { 'Métrica': 'Total pagado', 'Valor': datos.reduce((sum, d) => sum + parseFloat(d.totalPagado || 0), 0) },
                { 'Métrica': 'Saldo pendiente', 'Valor': datos.reduce((sum, d) => {
                    const total = parseFloat(d.monto) + parseFloat(d.mora || 0)
                    const pagado = parseFloat(d.totalPagado || 0)
                    return sum + (total - pagado)
                }, 0) },
                { 'Métrica': 'Porcentaje de cobranza', 'Valor': datos.length > 0 ? 
                    ((datos.reduce((sum, d) => sum + parseFloat(d.totalPagado || 0), 0) / 
                      datos.reduce((sum, d) => sum + parseFloat(d.monto) + parseFloat(d.mora || 0), 0)) * 100).toFixed(2) + '%' : '0%' }
            ]

            const wsResumen = XLSX.utils.json_to_sheet(resumenData)
            wsResumen['!cols'] = [{ wch: 25 }, { wch: 20 }]
            XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

            // Generar archivo
            const fechaActual = format(new Date(), 'yyyy-MM-dd_HH-mm')
            const nombreArchivo = `reporte-registro-deudas_${fechaActual}.xlsx`
            
            XLSX.writeFile(wb, nombreArchivo)

        } catch (error) {
            console.error('Error al exportar Excel:', error)
            alert('Error al exportar el archivo Excel')
        }
    }

    return (
        <Button 
            color="success" 
            onPress={exportarExcel}
            startContent={<FaDownload />}
        >
            Exportar Excel
        </Button>
    )
}

export default ExportarExcelButton
