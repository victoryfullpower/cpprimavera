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
    margin: 5,
    fontSize: 10,
    fontWeight: 'bold'
  },
  tableCell: {
    margin: 5,
    fontSize: 9
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 9,
    color: '#666'
  },
  totalContainer: {
    marginTop: 10,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: 'bold'
  }
})

const ReporteEgresosPDF = ({ data, fechaInicio, fechaFin, empresa, usuario }) => {
  const totalMonto = data.reduce((sum, recibo) => {
    return sum + recibo.detalles.reduce((detalleSum, detalle) => {
      return detalleSum + Number(detalle.monto)
    }, 0)
  }, 0)

  return (
    <Document>
      <Page size="A4" style={styles.page} orientation="landscape">
        <View style={styles.printDate}>
          <Text>Impreso: {format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
          <Text>Usuario: {usuario}</Text>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>{empresa?.nombre_empresa || 'Empresa'}</Text>
          <Text style={styles.subtitle}>Reporte de Recibos de Egreso</Text>
          <Text>
            Del {format(new Date(fechaInicio + 'T00:00:00'), 'dd/MM/yyyy')} al {format(new Date(fechaFin + 'T00:00:00'), 'dd/MM/yyyy')}
          </Text>
          <Text style={{ marginTop: 5, fontSize: 12, fontWeight: 'bold' }}>
            Total General: S/ {totalMonto.toFixed(2)}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.tableColHeader, { width: '15%' }]}>
              <Text style={styles.tableCellHeader}>N° Recibo</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '15%' }]}>
              <Text style={styles.tableCellHeader}>Fecha</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '25%' }]}>
              <Text style={styles.tableCellHeader}>Concepto</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '25%' }]}>
              <Text style={styles.tableCellHeader}>Descripción</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '10%' }]}>
              <Text style={styles.tableCellHeader}>Monto</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '10%' }]}>
              <Text style={styles.tableCellHeader}>Usuario</Text>
            </View>
          </View>

          {data.map((recibo) =>
            recibo.detalles.map((detalle, detalleIndex) => (
              <View key={`${recibo.idrecibo_egreso}-${detalleIndex}`} style={styles.tableRow}>
                <View style={[styles.tableCol, { width: '15%' }]}>
                  <Text style={styles.tableCell}>{recibo.numerorecibo_egreso}</Text>
                </View>
                <View style={[styles.tableCol, { width: '15%' }]}>
                  <Text style={styles.tableCell}>
                    {format(new Date(recibo.fecharecibo_egreso), 'dd/MM/yyyy')}
                  </Text>
                </View>
                <View style={[styles.tableCol, { width: '25%' }]}>
                  <Text style={styles.tableCell}>{detalle.concepto.descripcion}</Text>
                </View>
                <View style={[styles.tableCol, { width: '25%' }]}>
                  <Text style={styles.tableCell}>{detalle.descripcion || '-'}</Text>
                </View>
                <View style={[styles.tableCol, { width: '10%' }]}>
                  <Text style={styles.tableCell}>
                    S/ {Number(detalle.monto).toFixed(2)}
                  </Text>
                </View>
                <View style={[styles.tableCol, { width: '10%' }]}>
                  <Text style={styles.tableCell}>{recibo.createdBy.username}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.totalContainer}>
          <Text>TOTAL GENERAL: S/ {totalMonto.toFixed(2)}</Text>
        </View>

        <View style={styles.footer}>
          <Text>Generado el {format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
        </View>
      </Page>
    </Document>
  )
}

export default ReporteEgresosPDF