import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Registrar fuentes (opcional, usar las del sistema)
Font.register({
    family: 'Helvetica',
    fonts: [
        { src: 'Helvetica' },
        { src: 'Helvetica-Bold', fontWeight: 'bold' }
    ]
})

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        padding: 30,
        fontFamily: 'Helvetica'
    },
    header: {
        marginBottom: 20,
        textAlign: 'center',
        borderBottom: '2px solid #333',
        paddingBottom: 10
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333'
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5
    },
    info: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#f8f9fa',
        borderRadius: 5
    },
    filtros: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#e9ecef',
        borderRadius: 5
    },
    table: {
        marginTop: 20
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#dee2e6',
        minHeight: 35,
        alignItems: 'center'
    },
    tableColHeader: {
        backgroundColor: '#f8f9fa',
        padding: 8,
        fontWeight: 'bold',
        fontSize: 10,
        borderRightWidth: 1,
        borderRightColor: '#dee2e6'
    },
    tableCellHeader: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#333'
    },
    tableCol: {
        padding: 8,
        fontSize: 9,
        borderRightWidth: 1,
        borderRightColor: '#dee2e6'
    },
    tableCell: {
        fontSize: 9,
        color: '#333'
    },
    resumenConceptos: {
        marginTop: 20,
        marginBottom: 20
    },
    resumenTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333'
    },
    resumenRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#dee2e6',
        minHeight: 25,
        alignItems: 'center'
    },
    resumenCol: {
        padding: 6,
        fontSize: 9
    },
    resumenHeader: {
        backgroundColor: '#f8f9fa',
        fontWeight: 'bold'
    }
})

export default function ReporteIngresosConceptosPDF({ datos, filtros, estadisticas, conceptos }) {
    console.log('📄 Generando PDF con datos:', datos.length, 'recibos')
    console.log('📄 Primer recibo:', datos[0])
    
    const fechaImpresion = new Date().toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })

    const tieneFiltros = filtros.fechaDesde || filtros.fechaHasta || filtros.idconcepto_deuda || filtros.estado !== ''

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Encabezado */}
                <View style={styles.header}>
                    <Text style={styles.title}>Reporte de Ingresos por Conceptos</Text>
                    <Text style={styles.subtitle}>Fecha de impresión: {fechaImpresion}</Text>
                    <Text style={styles.subtitle}>Usuario: {datos[0]?.createdBy?.username || 'N/A'}</Text>
                    <Text style={styles.subtitle}>Empresa: CCPrimavera</Text>
                </View>

                {/* Información general */}
                <View style={styles.info}>
                    <Text style={{ marginBottom: 8, fontWeight: 'bold' }}>Total de recibos: {estadisticas.total}</Text>
                    <Text style={{ fontWeight: 'bold' }}>Monto total: S/. {estadisticas.totalMonto}</Text>
                </View>

                {/* Filtros aplicados */}
                {tieneFiltros && (
                    <View style={styles.filtros}>
                        <Text style={{ marginBottom: 8, fontWeight: 'bold' }}>Filtros aplicados:</Text>
                        {filtros.fechaDesde && <Text>• Fecha desde: {filtros.fechaDesde}</Text>}
                        {filtros.fechaHasta && <Text>• Fecha hasta: {filtros.fechaHasta}</Text>}
                        {filtros.idconcepto_deuda && (
                            <Text>• Concepto: {conceptos.find(c => c.idconcepto === parseInt(filtros.idconcepto_deuda))?.descripcion || 'N/A'}</Text>
                        )}
                        {filtros.estado !== '' && (
                            <Text>• Estado: {filtros.estado === 'true' ? 'Activo' : 'Inactivo'}</Text>
                        )}
                    </View>
                )}

                {/* Resumen por conceptos */}
                <View style={styles.resumenConceptos}>
                    <Text style={styles.resumenTitle}>Resumen por Conceptos</Text>
                    <View style={[styles.resumenRow, styles.resumenHeader]}>
                        <View style={[styles.resumenCol, { width: '60%' }]}>
                            <Text style={{ fontWeight: 'bold' }}>Concepto</Text>
                        </View>
                        <View style={[styles.resumenCol, { width: '20%' }]}>
                            <Text style={{ fontWeight: 'bold' }}>Cantidad</Text>
                        </View>
                        <View style={[styles.resumenCol, { width: '20%' }]}>
                            <Text style={{ fontWeight: 'bold' }}>Monto Total</Text>
                        </View>
                    </View>
                    {Object.values(estadisticas.totalPorConcepto)
                        .filter(concepto => concepto.cantidad > 0)
                        .sort((a, b) => b.total - a.total)
                        .map((concepto, index) => (
                            <View key={index} style={styles.resumenRow}>
                                <View style={[styles.resumenCol, { width: '60%' }]}>
                                    <Text>{concepto.descripcion}</Text>
                                </View>
                                <View style={[styles.resumenCol, { width: '20%' }]}>
                                    <Text>{concepto.cantidad}</Text>
                                </View>
                                <View style={[styles.resumenCol, { width: '20%' }]}>
                                    <Text>S/. {concepto.total.toFixed(2)}</Text>
                                </View>
                            </View>
                        ))}
                </View>

                {/* Tabla de resultados */}
                <View style={styles.table}>
                    <View style={styles.tableRow}>
                        <View style={[styles.tableColHeader, { width: '10%' }]}>
                            <Text style={styles.tableCellHeader}>N° Recibo</Text>
                        </View>
                        <View style={[styles.tableColHeader, { width: '10%' }]}>
                            <Text style={styles.tableCellHeader}>Fecha</Text>
                        </View>
                        <View style={[styles.tableColHeader, { width: '25%' }]}>
                            <Text style={styles.tableCellHeader}>Stand/Cliente</Text>
                        </View>
                        <View style={[styles.tableColHeader, { width: '25%' }]}>
                            <Text style={styles.tableCellHeader}>Conceptos</Text>
                        </View>
                        <View style={[styles.tableColHeader, { width: '10%' }]}>
                            <Text style={styles.tableCellHeader}>Total</Text>
                        </View>
                        <View style={[styles.tableColHeader, { width: '10%' }]}>
                            <Text style={styles.tableCellHeader}>Estado</Text>
                        </View>
                        <View style={[styles.tableColHeader, { width: '10%' }]}>
                            <Text style={styles.tableCellHeader}>Creado por</Text>
                        </View>
                    </View>

                    {datos.map((recibo, index) => (
                        <View key={index} style={styles.tableRow}>
                            <View style={[styles.tableCol, { width: '10%' }]}>
                                <Text style={styles.tableCell}>{recibo.numerorecibo}</Text>
                            </View>
                            <View style={[styles.tableCol, { width: '10%' }]}>
                                <Text style={styles.tableCell}>
                                    {new Date(recibo.fecharecibo).toLocaleDateString()}
                                </Text>
                            </View>
                            <View style={[styles.tableCol, { width: '25%' }]}>
                                <Text style={styles.tableCell}>
                                    {recibo.stand ? 
                                        `Stand ${recibo.stand.descripcion}${recibo.stand.nivel ? ` - Piso ${recibo.stand.nivel}` : ''}${recibo.stand.client ? ` - ${recibo.stand.client.nombre}` : ''}` :
                                        recibo.detalles.map(detalle => 
                                            detalle.detalleDeuda?.stand ? 
                                                `Stand ${detalle.detalleDeuda.stand.descripcion}${detalle.detalleDeuda.stand.nivel ? ` - Piso ${detalle.detalleDeuda.stand.nivel}` : ''}${detalle.detalleDeuda.stand.client ? ` - ${detalle.detalleDeuda.stand.client.nombre}` : ''}` :
                                                ''
                                        ).filter(Boolean).join('\n')
                                    }
                                </Text>
                            </View>
                            <View style={[styles.tableCol, { width: '25%' }]}>
                                <View>
                                    {recibo.detalles.map((detalle, detIndex) => (
                                        <View key={detIndex} style={{ marginBottom: 2 }}>
                                            <Text style={[styles.tableCell, { fontSize: 8 }]}>
                                                {conceptos.find(c => c.idconcepto === detalle.idconcepto)?.descripcion || 'N/A'}
                                                {detalle.descripcion && ` - ${detalle.descripcion}`}
                                                {' S/. '}{parseFloat(detalle.monto).toFixed(2)}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                            <View style={[styles.tableCol, { width: '10%' }]}>
                                <Text style={styles.tableCell}>S/. {parseFloat(recibo.total).toFixed(2)}</Text>
                            </View>
                            <View style={[styles.tableCol, { width: '10%' }]}>
                                <Text style={styles.tableCell}>
                                    {recibo.estado ? 'Activo' : 'Inactivo'}
                                </Text>
                            </View>
                            <View style={[styles.tableCol, { width: '10%' }]}>
                                <Text style={styles.tableCell}>
                                    {recibo.createdBy?.username || 'N/A'}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            </Page>
        </Document>
    )
}
