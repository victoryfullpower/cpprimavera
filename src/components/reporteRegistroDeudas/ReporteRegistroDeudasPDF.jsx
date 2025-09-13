import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Registrar fuentes
Font.register({
    family: 'Roboto',
    src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2'
})

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        padding: 20,
        fontFamily: 'Roboto'
    },
    header: {
        marginBottom: 20,
        textAlign: 'center'
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333333'
    },
    subtitle: {
        fontSize: 12,
        color: '#666666',
        marginBottom: 20
    },
    table: {
        display: 'table',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        marginBottom: 20
    },
    tableRow: {
        margin: 'auto',
        flexDirection: 'row'
    },
    tableHeader: {
        backgroundColor: '#f5f5f5',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0
    },
    tableCell: {
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 8,
        fontSize: 8
    },
    tableHeaderText: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#333333'
    },
    tableCellText: {
        fontSize: 8,
        color: '#333333'
    },
    tableCellNumber: {
        fontSize: 8,
        color: '#333333',
        textAlign: 'right'
    },
    summary: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#f9f9f9',
        border: '1px solid #ddd'
    },
    summaryTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333333'
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4
    },
    summaryLabel: {
        fontSize: 10,
        color: '#666666'
    },
    summaryValue: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#333333'
    }
})

const ReporteRegistroDeudasPDF = ({ datos }) => {
    // Calcular totales
    const totalDeuda = datos.reduce((sum, d) => sum + parseFloat(d.monto) + parseFloat(d.mora || 0), 0)
    const totalPagado = datos.reduce((sum, d) => sum + parseFloat(d.totalPagado || 0), 0)
    const saldoPendiente = totalDeuda - totalPagado

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>REPORTE DE REGISTRO DE DEUDAS</Text>
                    <Text style={styles.subtitle}>
                        Generado el {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })} | 
                        Total de registros: {datos.length}
                    </Text>
                </View>

                {/* Tabla */}
                <View style={styles.table}>
                    {/* Header de la tabla */}
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={[styles.tableCell, { width: '8%' }]}>
                            <Text style={styles.tableHeaderText}>FECHA</Text>
                        </View>
                        <View style={[styles.tableCell, { width: '12%' }]}>
                            <Text style={styles.tableHeaderText}>STAND</Text>
                        </View>
                        <View style={[styles.tableCell, { width: '12%' }]}>
                            <Text style={styles.tableHeaderText}>CLIENTE</Text>
                        </View>
                        <View style={[styles.tableCell, { width: '12%' }]}>
                            <Text style={styles.tableHeaderText}>CONCEPTO</Text>
                        </View>
                        <View style={[styles.tableCell, { width: '10%' }]}>
                            <Text style={styles.tableHeaderText}>INQUILINO</Text>
                        </View>
                        <View style={[styles.tableCell, { width: '8%' }]}>
                            <Text style={styles.tableHeaderText}>MONTO</Text>
                        </View>
                        <View style={[styles.tableCell, { width: '8%' }]}>
                            <Text style={styles.tableHeaderText}>MORA</Text>
                        </View>
                        <View style={[styles.tableCell, { width: '8%' }]}>
                            <Text style={styles.tableHeaderText}>TOTAL</Text>
                        </View>
                        <View style={[styles.tableCell, { width: '8%' }]}>
                            <Text style={styles.tableHeaderText}>PAGADO</Text>
                        </View>
                        <View style={[styles.tableCell, { width: '8%' }]}>
                            <Text style={styles.tableHeaderText}>SALDO</Text>
                        </View>
                        <View style={[styles.tableCell, { width: '6%' }]}>
                            <Text style={styles.tableHeaderText}>ESTADO</Text>
                        </View>
                    </View>

                    {/* Filas de datos */}
                    {datos.map((detalle, index) => {
                        const total = parseFloat(detalle.monto) + parseFloat(detalle.mora || 0)
                        const pagado = parseFloat(detalle.totalPagado || 0)
                        const saldo = total - pagado

                        return (
                            <View key={detalle.idregdeuda_detalle || index} style={styles.tableRow}>
                                <View style={[styles.tableCell, { width: '8%' }]}>
                                    <Text style={styles.tableCellText}>
                                        {format(new Date(detalle.fechadeudaStand), 'dd/MM/yyyy', { locale: es })}
                                    </Text>
                                </View>
                                <View style={[styles.tableCell, { width: '12%' }]}>
                                    <Text style={styles.tableCellText}>
                                        {detalle.stand?.descripcion || 'N/A'}
                                    </Text>
                                    <Text style={[styles.tableCellText, { fontSize: 7, color: '#666' }]}>
                                        Nivel {detalle.stand?.nivel || 'N/A'}
                                    </Text>
                                </View>
                                <View style={[styles.tableCell, { width: '12%' }]}>
                                    <Text style={styles.tableCellText}>
                                        {detalle.stand?.client?.nombre || 'Sin cliente'}
                                    </Text>
                                </View>
                                <View style={[styles.tableCell, { width: '12%' }]}>
                                    <Text style={styles.tableCellText}>
                                        {detalle.concepto?.descripcion || 'Sin concepto'}
                                    </Text>
                                </View>
                                <View style={[styles.tableCell, { width: '10%' }]}>
                                    <Text style={styles.tableCellText}>
                                        {detalle.inquilino_activo?.nombre || 'Sin inquilino'}
                                    </Text>
                                </View>
                                <View style={[styles.tableCell, { width: '8%' }]}>
                                    <Text style={styles.tableCellNumber}>
                                        S/. {parseFloat(detalle.monto).toFixed(2)}
                                    </Text>
                                </View>
                                <View style={[styles.tableCell, { width: '8%' }]}>
                                    <Text style={styles.tableCellNumber}>
                                        S/. {parseFloat(detalle.mora || 0).toFixed(2)}
                                    </Text>
                                </View>
                                <View style={[styles.tableCell, { width: '8%' }]}>
                                    <Text style={[styles.tableCellNumber, { fontWeight: 'bold' }]}>
                                        S/. {total.toFixed(2)}
                                    </Text>
                                </View>
                                <View style={[styles.tableCell, { width: '8%' }]}>
                                    <Text style={styles.tableCellNumber}>
                                        S/. {pagado.toFixed(2)}
                                    </Text>
                                </View>
                                <View style={[styles.tableCell, { width: '8%' }]}>
                                    <Text style={[styles.tableCellNumber, { 
                                        fontWeight: 'bold',
                                        color: saldo > 0 ? '#e67e22' : '#27ae60'
                                    }]}>
                                        S/. {saldo.toFixed(2)}
                                    </Text>
                                </View>
                                <View style={[styles.tableCell, { width: '6%' }]}>
                                    <Text style={[styles.tableCellText, {
                                        color: detalle.estado ? '#27ae60' : '#e67e22',
                                        fontWeight: 'bold'
                                    }]}>
                                        {detalle.estado ? 'Pagado' : 'Pendiente'}
                                    </Text>
                                </View>
                            </View>
                        )
                    })}
                </View>

                {/* Resumen */}
                <View style={styles.summary}>
                    <Text style={styles.summaryTitle}>RESUMEN EJECUTIVO</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total de registros:</Text>
                        <Text style={styles.summaryValue}>{datos.length}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total deuda generada:</Text>
                        <Text style={styles.summaryValue}>S/. {totalDeuda.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total pagado:</Text>
                        <Text style={styles.summaryValue}>S/. {totalPagado.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Saldo pendiente:</Text>
                        <Text style={[styles.summaryValue, { 
                            color: saldoPendiente > 0 ? '#e67e22' : '#27ae60' 
                        }]}>
                            S/. {saldoPendiente.toFixed(2)}
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Porcentaje de cobranza:</Text>
                        <Text style={styles.summaryValue}>
                            {totalDeuda > 0 ? ((totalPagado / totalDeuda) * 100).toFixed(1) : 0}%
                        </Text>
                    </View>
                </View>
            </Page>
        </Document>
    )
}

export default ReporteRegistroDeudasPDF
