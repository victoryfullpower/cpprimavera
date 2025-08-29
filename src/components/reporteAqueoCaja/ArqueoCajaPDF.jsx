import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer'

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
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  summaryCard: {
    width: '30%',
    padding: 10,
    borderRadius: 5
  },
  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 20
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 15
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

const ArqueoCajaPDF = ({ reporte, usuario }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page} orientation="portrait">
        <View style={styles.printDate}>
          <Text>Impreso: {new Date().toLocaleDateString()}</Text>
          <Text>Usuario: {usuario}</Text>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Reporte de Arqueo de Caja</Text>
          <Text style={styles.subtitle}>Fecha de corte: {reporte.fechaCorte}</Text>
        </View>

        <View style={styles.summary}>
          <View style={[styles.summaryCard, { backgroundColor: '#e6f7ee', width: '23%' }]}>
            <Text style={{ fontWeight: 'bold' }}>Total Ingresos</Text>
            <Text style={{ fontSize: 14 }}>S/ {reporte.totalIngresos.toFixed(2)}</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: '#feeceb', width: '23%' }]}>
            <Text style={{ fontWeight: 'bold' }}>Total Egresos</Text>
            <Text style={{ fontSize: 14 }}>S/ {reporte.totalEgresos.toFixed(2)}</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: '#fff3e0', width: '23%' }]}>
            <Text style={{ fontWeight: 'bold' }}>Total Compras</Text>
            <Text style={{ fontSize: 14 }}>S/ {reporte.totalCompras.toFixed(2)}</Text>
          </View>

          <View style={[styles.summaryCard, { 
            backgroundColor: reporte.saldo >= 0 ? '#e6f2ff' : '#ffebee',
            width: '23%'
          }]}>
            <Text style={{ fontWeight: 'bold' }}>Saldo Final</Text>
            <Text style={{ fontSize: 14 }}>S/ {reporte.saldo.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Ingresos por Método de Pago</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.tableColHeader, { width: '70%' }]}>
              <Text style={styles.tableCellHeader}>Método de Pago</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '30%' }]}>
              <Text style={styles.tableCellHeader}>Monto</Text>
            </View>
          </View>

          {reporte.ingresosPorMetodo.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={[styles.tableCol, { width: '70%' }]}>
                <Text style={styles.tableCell}>{item.metodo}</Text>
              </View>
              <View style={[styles.tableCol, { width: '30%' }]}>
                <Text style={styles.tableCell}>S/ {item.monto.toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Detalle de Ingresos</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.tableColHeader, { width: '20%' }]}>
              <Text style={styles.tableCellHeader}>N° Recibo</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '20%' }]}>
              <Text style={styles.tableCellHeader}>Fecha</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '25%' }]}>
              <Text style={styles.tableCellHeader}>Método Pago</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '15%' }]}>
              <Text style={styles.tableCellHeader}>Entidad</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '20%' }]}>
              <Text style={styles.tableCellHeader}>Total</Text>
            </View>
          </View>

          {reporte.detalleIngresos.map((ingreso) => (
            <View key={ingreso.idrecibo_ingreso} style={styles.tableRow}>
              <View style={[styles.tableCol, { width: '20%' }]}>
                <Text style={styles.tableCell}>{ingreso.numerorecibo}</Text>
              </View>
              <View style={[styles.tableCol, { width: '20%' }]}>
                <Text style={styles.tableCell}>
                  {new Date(ingreso.fecharecibo).toLocaleDateString()}
                </Text>
              </View>
              <View style={[styles.tableCol, { width: '25%' }]}>
                <Text style={styles.tableCell}>{ingreso.metodoPago.descripcion}</Text>
              </View>
              <View style={[styles.tableCol, { width: '15%' }]}>
                <Text style={styles.tableCell}>{ingreso.entidadRecaudadora?.descripcion || '-'}</Text>
              </View>
              <View style={[styles.tableCol, { width: '20%' }]}>
                <Text style={styles.tableCell}>S/ {Number(ingreso.total).toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Detalle de Egresos</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.tableColHeader, { width: '30%' }]}>
              <Text style={styles.tableCellHeader}>N° Recibo</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '30%' }]}>
              <Text style={styles.tableCellHeader}>Fecha</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '40%' }]}>
              <Text style={styles.tableCellHeader}>Total</Text>
            </View>
          </View>

          {reporte.detalleEgresos.map((egreso) => (
            <View key={egreso.idrecibo_egreso} style={styles.tableRow}>
              <View style={[styles.tableCol, { width: '30%' }]}>
                <Text style={styles.tableCell}>{egreso.numerorecibo_egreso}</Text>
              </View>
              <View style={[styles.tableCol, { width: '30%' }]}>
                <Text style={styles.tableCell}>
                  {new Date(egreso.fecharecibo_egreso).toLocaleDateString()}
                </Text>
              </View>
              <View style={[styles.tableCol, { width: '40%' }]}>
                <Text style={styles.tableCell}>S/ {Number(egreso.total).toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Detalle de Compras</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.tableColHeader, { width: '25%' }]}>
              <Text style={styles.tableCellHeader}>N° Comprobante</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '20%' }]}>
              <Text style={styles.tableCellHeader}>Fecha</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '25%' }]}>
              <Text style={styles.tableCellHeader}>Tipo Documento</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '30%' }]}>
              <Text style={styles.tableCellHeader}>Monto</Text>
            </View>
          </View>

          {reporte.detalleCompras.map((compra) => (
            <View key={compra.idcompra} style={styles.tableRow}>
              <View style={[styles.tableCol, { width: '25%' }]}>
                <Text style={styles.tableCell}>{compra.numcomprobante}</Text>
              </View>
              <View style={[styles.tableCol, { width: '20%' }]}>
                <Text style={styles.tableCell}>
                  {new Date(compra.fecharegistro).toLocaleDateString()}
                </Text>
              </View>
              <View style={[styles.tableCol, { width: '25%' }]}>
                <Text style={styles.tableCell}>{compra.tipoCompra?.descripcion || 'Sin tipo'}</Text>
              </View>
              <View style={[styles.tableCol, { width: '30%' }]}>
                <Text style={styles.tableCell}>S/ {Number(compra.monto).toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text>Generado el {new Date().toLocaleDateString()}</Text>
        </View>
      </Page>
    </Document>
  )
}

export default ArqueoCajaPDF