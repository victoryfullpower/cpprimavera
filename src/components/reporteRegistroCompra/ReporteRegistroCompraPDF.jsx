// components/ReporteRegistroCompraPDF.js
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer'
import { format } from 'date-fns'

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10
  },
  header: {
    marginBottom: 20,
    textAlign: 'center'
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 10
  },
  printDate: {
    position: 'absolute',
    top: 15,
    right: 30,
    fontSize: 9,
    color: '#666'
  },
  info: {
    marginBottom: 15
  },
  filtros: {
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 5
  },
  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row"
  },
  tableColHeader: {
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: "#f0f0f0"
  },
  tableCol: {
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0
  },
  tableCellHeader: {
    margin: 6,
    fontSize: 9,
    fontWeight: 'bold'
  },
  tableCell: {
    margin: 6,
    fontSize: 8
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 9,
    color: '#666'
  }
})

const ReporteRegistroCompraPDF = ({ datos, filtros, estadisticas, empresa, usuario }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page} orientation="landscape">
        <View style={styles.printDate}>
          <Text>Impreso: {format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
          <Text>Usuario: {usuario}</Text>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Reporte de Registros de Compra</Text>
          <Text style={styles.subtitle}>{empresa?.nombre_empresa || 'Empresa'}</Text>
        </View>

        <View style={styles.info}>
          <Text style={{ marginBottom: 8, fontWeight: 'bold' }}>Total de registros: {estadisticas.total}</Text>
          <Text style={{ fontWeight: 'bold' }}>Monto total: S/. {estadisticas.totalMonto}</Text>
        </View>

        {(filtros.fechaDesde || filtros.fechaHasta || filtros.idtipocompra || filtros.estado !== '' || filtros.descripcion) && (
          <View style={styles.filtros}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Filtros aplicados:</Text>
            {filtros.fechaDesde && <Text>• Fecha desde: {filtros.fechaDesde}</Text>}
            {filtros.fechaHasta && <Text>• Fecha hasta: {filtros.fechaHasta}</Text>}
            {filtros.idtipocompra && (
              <Text>• Tipo de documento: {datos.find(d => d.idtipocompra === parseInt(filtros.idtipocompra))?.tipoCompra?.descripcion || 'N/A'}</Text>
            )}
            {filtros.estado !== '' && (
              <Text>• Estado: {filtros.estado === 'true' ? 'Activo' : 'Inactivo'}</Text>
            )}
            {filtros.descripcion && <Text>• Descripción: {filtros.descripcion}</Text>}
          </View>
        )}



        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.tableColHeader, { width: '8%' }]}>
              <Text style={styles.tableCellHeader}>ID</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '12%' }]}>
              <Text style={styles.tableCellHeader}>Fecha</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '15%' }]}>
              <Text style={styles.tableCellHeader}>Tipo Doc</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '15%' }]}>
              <Text style={styles.tableCellHeader}>Comprobante</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '25%' }]}>
              <Text style={styles.tableCellHeader}>Descripción</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '12%' }]}>
              <Text style={styles.tableCellHeader}>Monto</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '8%' }]}>
              <Text style={styles.tableCellHeader}>Estado</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '15%' }]}>
              <Text style={styles.tableCellHeader}>Creado por</Text>
            </View>
          </View>

          {datos.map((reg, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={[styles.tableCol, { width: '8%' }]}>
                <Text style={styles.tableCell}>{reg.idcompra}</Text>
              </View>
              <View style={[styles.tableCol, { width: '12%' }]}>
                <Text style={styles.tableCell}>{format(new Date(reg.fecharegistro), 'dd/MM/yyyy')}</Text>
              </View>
              <View style={[styles.tableCol, { width: '15%' }]}>
                <Text style={styles.tableCell}>{reg.tipoCompra?.descripcion || 'N/A'}</Text>
              </View>
              <View style={[styles.tableCol, { width: '15%' }]}>
                <Text style={styles.tableCell}>{reg.numcomprobante}</Text>
              </View>
              <View style={[styles.tableCol, { width: '25%' }]}>
                <Text style={styles.tableCell}>{reg.descripcion}</Text>
              </View>
              <View style={[styles.tableCol, { width: '12%' }]}>
                <Text style={styles.tableCell}>S/. {parseFloat(reg.monto).toFixed(2)}</Text>
              </View>
              <View style={[styles.tableCol, { width: '8%' }]}>
                <Text style={styles.tableCell}>{reg.estado ? 'Activo' : 'Inactivo'}</Text>
              </View>
              <View style={[styles.tableCol, { width: '15%' }]}>
                <Text style={styles.tableCell}>{reg.createdBy?.username || 'N/A'}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text>Reporte generado automáticamente por el sistema CCPrimavera</Text>
        </View>
      </Page>
    </Document>
  )
}

export default ReporteRegistroCompraPDF
